import Anthropic from "@anthropic-ai/sdk";
import { GUIDE_DOC_JSON_SCHEMA, type GuideDocResult } from "./guideDocSchema.js";
import {
  buildExpeditionGuideEnhanceSystemPrompt,
  buildExpeditionGuideEnhanceUserMessage,
  type ExpeditionGuideEnhanceMode,
  type ExpeditionGuideFieldsInput,
} from "./expeditionGuideEnhancePrompt.js";
import { friendlyAnthropicErrorMessage } from "./anthropicErrors.js";

export interface ExpeditionGuideEnhanceRequestBody {
  fields: ExpeditionGuideFieldsInput;
  currentOutput: GuideDocResult;
  mode: ExpeditionGuideEnhanceMode;
}

const DEFAULT_MODEL = "claude-sonnet-5";

// 遠征要項AIのAI強化操作。基本生成はテンプレートエンジン（クライアント側）が
// APIを使わずに行うため、この関数はユーザーが「AIで強化する」ボタンを
// 押したときだけ呼び出される。
export async function runExpeditionGuideEnhance(
  apiKey: string,
  body: ExpeditionGuideEnhanceRequestBody,
): Promise<GuideDocResult> {
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const systemPrompt = buildExpeditionGuideEnhanceSystemPrompt(body.mode);
  const userMessageText = buildExpeditionGuideEnhanceUserMessage({
    fields: body.fields,
    currentOutput: body.currentOutput,
  });

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessageText,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: GUIDE_DOC_JSON_SCHEMA,
        },
      },
    });
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "出力が長くなりすぎて途中で切れてしまいました。もう一度お試しください。",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした。");
  }

  try {
    return JSON.parse(textBlock.text) as GuideDocResult;
  } catch {
    throw new Error("Claudeの応答をJSON形式として読み取れませんでした。");
  }
}
