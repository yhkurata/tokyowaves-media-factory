import Anthropic from "@anthropic-ai/sdk";
import {
  STICKER_PLAN_BATCH_JSON_SCHEMA,
  type StickerPlanBatchResult,
} from "./stickerPlanSchema.js";
import {
  buildStickerPlanSystemPrompt,
  buildStickerPlanUserMessage,
  type CharacterSettingsInput,
} from "./stickerPlanPrompt.js";
import { friendlyAnthropicErrorMessage } from "./anthropicErrors.js";

export type StickerMediaType = "image/png" | "image/jpeg";

export interface StickerPlanRequestBody {
  instruction: string;
  requestedCount: number;
  characterSettings: CharacterSettingsInput;
  referenceImages: { mediaType: StickerMediaType; dataBase64: string }[];
  existingCandidates: { phrase: string; scene: string }[];
}

const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_REFERENCE_IMAGES = 10;
const ALLOWED_COUNTS = [8, 16, 24, 32, 40];

export async function runStickerPlan(
  apiKey: string,
  body: StickerPlanRequestBody,
): Promise<StickerPlanBatchResult> {
  if (body.instruction.trim() === "") {
    throw new Error("指示文が入力されていません。");
  }
  if (!ALLOWED_COUNTS.includes(body.requestedCount)) {
    throw new Error("件数はLINEの入稿枚数（8/16/24/32/40）から選択してください。");
  }
  if (body.referenceImages.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`参考画像は最大${MAX_REFERENCE_IMAGES}枚までです。`);
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const systemPrompt = buildStickerPlanSystemPrompt(body.characterSettings);
  const userMessageText = buildStickerPlanUserMessage({
    instruction: body.instruction,
    requestedCount: body.requestedCount,
    existingCandidates: body.existingCandidates,
  });

  let response;
  try {
    // 16件（デフォルト想定）ぶんの企画＋英語プロンプトを1回でまとめて出力するため、
    // 出力トークンに十分な余裕を持たせる。件数が多いほど必要トークンも増える。
    const maxTokens = Math.min(64000, 8000 + body.requestedCount * 1200);
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            ...body.referenceImages.map((image) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: image.mediaType,
                data: image.dataBase64,
              },
            })),
            {
              type: "text" as const,
              text: userMessageText,
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: STICKER_PLAN_BATCH_JSON_SCHEMA,
        },
      },
    });
    response = await stream.finalMessage();
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "出力が長くなりすぎて途中で切れてしまいました。件数を減らして再度お試しください。",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした。");
  }

  let result: StickerPlanBatchResult;
  try {
    result = JSON.parse(textBlock.text) as StickerPlanBatchResult;
  } catch {
    throw new Error("Claudeの応答をJSON形式として読み取れませんでした。");
  }

  if (result.plans.length !== body.requestedCount) {
    throw new Error(
      `指定した${body.requestedCount}件と異なる${result.plans.length}件が返されました。もう一度お試しください。`,
    );
  }

  return result;
}
