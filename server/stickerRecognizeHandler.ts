import Anthropic from "@anthropic-ai/sdk";
import {
  STICKER_RECOGNIZE_JSON_SCHEMA,
  type StickerRecognizeResult,
} from "./stickerRecognizeSchema.js";
import { friendlyAnthropicErrorMessage } from "./anthropicErrors.js";
import { estimateApiCallCost, type ApiCallCostEstimate } from "./anthropicPricing.js";

export type StickerMediaType = "image/png" | "image/jpeg";

export interface StickerRecognizeRequestBody {
  images: { mediaType: StickerMediaType; dataBase64: string }[];
}

const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_IMAGES = 20;
// 画像1枚あたり短いラベル文字列を返すだけの軽い呼び出しのため、既定値も小さめ。
const OUTPUT_TOKEN_ESTIMATE_PER_IMAGE = 60;

const SYSTEM_PROMPT = `あなたはLINEスタンプ画像からセリフ（画像内に描かれた文字）を読み取るアシスタントです。
渡された各画像について、画像内に書かれているセリフ文字列をそのまま書き出してください。
文字が見当たらない場合は recognizedPhrase を空文字にしてください。
説明や前置きは不要で、指定されたJSON形式のみを返してください。`;

function validateRequestBody(body: StickerRecognizeRequestBody) {
  if (body.images.length === 0) {
    throw new Error("画像が指定されていません。");
  }
  if (body.images.length > MAX_IMAGES) {
    throw new Error(`一度に認識できるのは最大${MAX_IMAGES}枚までです。`);
  }
}

function buildMessageContent(body: StickerRecognizeRequestBody) {
  return [
    ...body.images.flatMap((image, index) => [
      {
        type: "text" as const,
        text: `画像${index}：`,
      },
      {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: image.mediaType,
          data: image.dataBase64,
        },
      },
    ]),
    {
      type: "text" as const,
      text: "上記それぞれの画像についてセリフを読み取ってください。",
    },
  ];
}

// 一般ユーザー向けの実行前確認ダイアログ用。
export async function estimateStickerRecognize(
  apiKey: string,
  body: StickerRecognizeRequestBody,
): Promise<ApiCallCostEstimate> {
  validateRequestBody(body);
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  try {
    return await estimateApiCallCost(
      apiKey,
      model,
      SYSTEM_PROMPT,
      [{ role: "user", content: buildMessageContent(body) }],
      body.images.length * OUTPUT_TOKEN_ESTIMATE_PER_IMAGE,
    );
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }
}

export async function runStickerRecognize(
  apiKey: string,
  body: StickerRecognizeRequestBody,
): Promise<StickerRecognizeResult> {
  validateRequestBody(body);

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let response;
  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildMessageContent(body),
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: STICKER_RECOGNIZE_JSON_SCHEMA,
        },
      },
    });
    response = await stream.finalMessage();
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした。");
  }

  try {
    return JSON.parse(textBlock.text) as StickerRecognizeResult;
  } catch {
    throw new Error("Claudeの応答をJSON形式として読み取れませんでした。");
  }
}
