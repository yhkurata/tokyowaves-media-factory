import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db/client.js";
import { agentProposals } from "./db/schema.js";
import { getBrandContext } from "./brandContextHandler.js";
import {
  listPostHistory,
  createProposedCandidates,
} from "./instagramPostHistoryHandler.js";
import { PROPOSAL_JSON_SCHEMA, type ProposalResult } from "./instagramProposalSchema.js";
import {
  buildProposalSystemPrompt,
  buildProposalUserMessage,
  buildPostHistorySummaryText,
} from "./instagramProposalPrompt.js";
import { calculateUsageCost, estimateCostFromTokenCounts } from "./anthropicPricing.js";
import { getAverageOutputTokens } from "./instagramAgentProposalHandler.js";

const DEFAULT_MODEL = "claude-opus-4-8";
// 実行実績がまだ無い場合（初回呼び出し等）の控えめな既定出力トークン見積もり。
// 3候補分のPostPlan全項目（デザイン指示・キャプション・画像生成プロンプト等）を
// thinking込みで出力する分、抽出タスク等より出力量が多くなりうることを踏まえた値。
const DEFAULT_OUTPUT_TOKEN_ESTIMATE = 20000;

// Anthropic SDKのエラーは生のJSONレスポンス本文がそのまま .message に入ってくるため、
// よくあるケースだけ分かりやすい日本語に変換する（extractHandler.ts系と同じ方針）。
function friendlyAnthropicErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 400 && /credit balance is too low/i.test(err.message)) {
      return "Anthropic APIのクレジット残高が不足しています。console.anthropic.com の「Plans & Billing」からクレジットを追加してください。";
    }
    if (err.status === 401) {
      return "Anthropic APIキーが無効です。環境変数 ANTHROPIC_API_KEY を確認してください。";
    }
    if (err.status === 429) {
      return "Anthropic APIのリクエスト数上限に達しました。しばらく待ってから再度お試しください。";
    }
    if (err.status === 529) {
      return "Anthropic APIが混雑しています。しばらく待ってから再度お試しください。";
    }
  }
  return err instanceof Error
    ? `提案生成中にエラーが発生しました: ${err.message}`
    : "提案生成中に不明なエラーが発生しました。";
}

export interface ProposeRequestBody {
  instruction: string;
}

function createId() {
  return crypto.randomUUID();
}

// runPropose（実行）とestimateProposeCost（見積もり）の両方で、実際に送信される
// システムプロンプト・ユーザーメッセージを完全に同じ内容で組み立てるための共通処理。
// ここがズレると見積もりが実際のトークン数と食い違ってしまうため、必ず1箇所にまとめる。
async function buildPromptParts(instruction: string) {
  const brandContext = await getBrandContext();
  const history = await listPostHistory();

  const systemPrompt = buildProposalSystemPrompt(brandContext.operatingGuide);
  const historySummary = buildPostHistorySummaryText(
    history.map((h) => ({
      postedAt: h.postedAt ? h.postedAt.toISOString() : null,
      proposedAt: h.proposedAt ? h.proposedAt.toISOString() : null,
      createdAt: h.createdAt.toISOString(),
      format: h.format,
      category: h.category,
      concept: h.concept,
      status: h.status,
    })),
  );
  const userMessage = buildProposalUserMessage(instruction, historySummary);
  return { systemPrompt, userMessage };
}

export async function runPropose(apiKey: string, body: ProposeRequestBody) {
  if (!body.instruction || body.instruction.trim() === "") {
    throw new Error("指示文が空です。");
  }

  const { systemPrompt, userMessage } = await buildPromptParts(body.instruction);

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let response;
  try {
    // 3候補分のPostPlan全項目（デザイン指示・キャプション・画像生成プロンプト等）を
    // 出力するため、抽出タスクより出力量が多くなりうる。thinking込みで余裕を持たせる。
    const stream = client.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          // ブランドコンテキストはほぼ変化しないため、プロンプトキャッシュを効かせて
          // 繰り返し呼び出すコストを抑える。
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
      output_config: {
        format: {
          type: "json_schema",
          schema: PROPOSAL_JSON_SCHEMA,
        },
      },
    });
    response = await stream.finalMessage();
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "提案内容が多く、出力が途中で切れてしまいました。もう一度お試しください。",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした。");
  }

  let result: ProposalResult;
  try {
    result = JSON.parse(textBlock.text) as ProposalResult;
  } catch {
    throw new Error(
      "Claudeの応答をJSON形式として読み取れませんでした。もう一度お試しください。",
    );
  }

  // JSON Schema側は候補数を3件に強制できない（Claudeの構造化出力は配列の
  // minItems/maxItemsに0/1以外を指定できないため）。プロンプトで3件を指示
  // しているが、念のため実行時にも検証する。
  if (result.candidates.length !== 3) {
    throw new Error(
      `Claudeの応答の候補数が3件ではありませんでした（${result.candidates.length}件）。もう一度お試しください。`,
    );
  }

  // このAPI呼び出し1回分の実測トークン数から、実際にかかったコストを計算する
  // （見積もりではなく、レスポンスのusageに基づく実額）。
  const cost = calculateUsageCost(model, response.usage);

  // agent_proposals への保存と、3候補分の post_history 登録は、どちらかだけが
  // 成功して食い違う状態を防ぐため1つのトランザクションにまとめる。
  const saved = await getDb().transaction(async (tx) => {
    const [saved] = await tx
      .insert(agentProposals)
      .values({
        id: createId(),
        userInstruction: body.instruction,
        candidates: result.candidates,
        recommendedCandidateIndex: result.recommendedCandidateIndex,
        recommendationReasoning: result.recommendationReasoning,
        operationalSuggestions: result.operationalSuggestions,
        openQuestions: result.openQuestions,
        approvalStatus: "pending",
        inputTokens: cost.inputTokens,
        outputTokens: cost.outputTokens,
        cacheCreationInputTokens: cost.cacheCreationInputTokens,
        cacheReadInputTokens: cost.cacheReadInputTokens,
        costUsd: cost.costUsd,
        costJpy: cost.costJpy,
      })
      .returning();

    // 3候補それぞれを post_history へ「提案中」として即座に登録する。
    // これにより提案一覧画面に常に最新の全候補が並び、次回以降の重複チェックにも
    // （承認されなかった候補も含めて）反映される。
    await createProposedCandidates(
      saved.id,
      saved.requestedAt,
      result.candidates,
      result.recommendedCandidateIndex,
      tx,
    );

    return saved;
  });

  return saved;
}

export interface ProposeCostEstimateResult {
  costJpy: number | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  isOutputEstimateFromHistory: boolean;
}

// 一般ユーザー向けの実行前確認ダイアログ（「今回の推定料金：約○円」）用。
// 実際に送信されるシステムプロンプト・ユーザーメッセージをcount_tokensに
// かけて入力トークン数を正確に求め、出力トークン数は過去の実行実績の平均
// （無ければ既定値）で見積もる。count_tokensは生成を伴わないAPI呼び出し
// のため、この見積もり自体には課金が発生しない。
export async function estimateProposeCost(
  apiKey: string,
  body: ProposeRequestBody,
): Promise<ProposeCostEstimateResult> {
  if (!body.instruction || body.instruction.trim() === "") {
    throw new Error("指示文が空です。");
  }

  const { systemPrompt, userMessage } = await buildPromptParts(body.instruction);

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let counted;
  try {
    counted = await client.messages.countTokens({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  const historicalAverage = await getAverageOutputTokens();
  const estimatedOutputTokens = historicalAverage ?? DEFAULT_OUTPUT_TOKEN_ESTIMATE;
  const { costJpy } = estimateCostFromTokenCounts(
    model,
    counted.input_tokens,
    estimatedOutputTokens,
  );

  return {
    costJpy,
    estimatedInputTokens: counted.input_tokens,
    estimatedOutputTokens,
    isOutputEstimateFromHistory: historicalAverage !== null,
  };
}
