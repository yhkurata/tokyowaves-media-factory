import OpenAI from "openai";
import { PROPOSAL_JSON_SCHEMA, type ProposalResult } from "./instagramProposalSchema.js";
import {
  calculateOpenAIUsageCost,
  estimateOpenAICost,
  type OpenAIUsageCost,
} from "./openaiPricing.js";

export const DEFAULT_OPENAI_INSTAGRAM_MODEL = "gpt-5.6-terra";

export interface OpenAIProposeInput {
  systemPrompt: string;
  userMessage: string;
}

function createClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    // テスト時はローカルのモックサーバーへ向けられる。本番では未設定のため
    // OpenAI公式APIがSDK既定値として使われる。
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

function friendlyOpenAIErrorMessage(err: unknown): string {
  if (err instanceof OpenAI.AuthenticationError) {
    return "OpenAI APIキーが無効です。環境変数 OPENAI_API_KEY を確認してください。";
  }
  if (err instanceof OpenAI.RateLimitError) {
    return "OpenAI APIの利用上限に達しました。しばらく待ってから再度お試しください。";
  }
  if (err instanceof OpenAI.BadRequestError) {
    return `OpenAI APIへのリクエストが受け付けられませんでした: ${err.message}`;
  }
  if (err instanceof OpenAI.InternalServerError) {
    return "OpenAI APIが混雑しています。しばらく待ってから再度お試しください。";
  }
  return err instanceof Error
    ? `GPTでの提案生成中にエラーが発生しました: ${err.message}`
    : "GPTでの提案生成中に不明なエラーが発生しました。";
}

function requestParts(model: string, input: OpenAIProposeInput) {
  return {
    model,
    instructions: input.systemPrompt,
    input: input.userMessage,
    reasoning: { effort: "medium" as const },
    text: {
      format: {
        type: "json_schema" as const,
        name: "instagram_post_proposal",
        strict: true,
        schema: PROPOSAL_JSON_SCHEMA,
      },
    },
  };
}

export async function runOpenAIInstagramPropose(
  apiKey: string,
  input: OpenAIProposeInput,
): Promise<{
  result: ProposalResult;
  model: string;
  cost: OpenAIUsageCost;
}> {
  const client = createClient(apiKey);
  const model =
    process.env.OPENAI_INSTAGRAM_MODEL || DEFAULT_OPENAI_INSTAGRAM_MODEL;

  try {
    const response = await client.responses.create({
      ...requestParts(model, input),
      max_output_tokens: 32000,
      store: false,
    });
    if (response.status === "incomplete") {
      throw new Error(
        "提案内容が多く、出力が途中で切れてしまいました。もう一度お試しください。",
      );
    }
    if (!response.output_text) {
      throw new Error("GPTからテキスト形式の応答が得られませんでした。");
    }
    const result = JSON.parse(response.output_text) as ProposalResult;
    if (!response.usage) {
      throw new Error("GPTの利用トークン数を取得できませんでした。");
    }
    return {
      result,
      model,
      cost: calculateOpenAIUsageCost(model, response.usage),
    };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.startsWith("提案内容が多く") ||
        err.message.startsWith("GPTから") ||
        err.message.startsWith("GPTの利用"))
    ) {
      throw err;
    }
    if (err instanceof SyntaxError) {
      throw new Error(
        "GPTの応答をJSON形式として読み取れませんでした。もう一度お試しください。",
      );
    }
    throw new Error(friendlyOpenAIErrorMessage(err));
  }
}

export async function estimateOpenAIInstagramPropose(
  apiKey: string,
  input: OpenAIProposeInput,
  estimatedOutputTokens: number,
): Promise<{
  costJpy: number | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}> {
  const client = createClient(apiKey);
  const model =
    process.env.OPENAI_INSTAGRAM_MODEL || DEFAULT_OPENAI_INSTAGRAM_MODEL;
  try {
    const counted = await client.responses.inputTokens.count(
      requestParts(model, input),
    );
    return {
      ...estimateOpenAICost(
        model,
        counted.input_tokens,
        estimatedOutputTokens,
      ),
      estimatedInputTokens: counted.input_tokens,
      estimatedOutputTokens,
    };
  } catch (err) {
    throw new Error(friendlyOpenAIErrorMessage(err));
  }
}
