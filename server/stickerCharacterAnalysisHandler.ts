import Anthropic from "@anthropic-ai/sdk";
import {
  STICKER_CHARACTER_ANALYSIS_JSON_SCHEMA,
  type StickerCharacterAnalysisResult,
} from "./stickerCharacterAnalysisSchema.js";
import { friendlyAnthropicErrorMessage } from "./anthropicErrors.js";

export type StickerMediaType = "image/png" | "image/jpeg";

export interface StickerCharacterAnalysisRequestBody {
  images: { mediaType: StickerMediaType; dataBase64: string }[];
}

const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_IMAGES = 10;

const SYSTEM_PROMPT = `あなたはLINEスタンプのキャラクターデザインを分析するアシスタントです。
渡された既存スタンプ画像（1枚または複数枚）を見て、このキャラクターの特徴を今後のスタンプ制作で
毎回参照できるよう、次の項目にまとめてください。

- characterFeatures: キャラクター全体の特徴（誰が見ても分かる簡潔な説明）
- face: 顔の特徴（目・輪郭など）
- hairStyle: 髪型
- hat: 帽子（着用している場合はその形状・色・ロゴなど）
- logo: 服や小物に描かれているロゴ・マークがあれば、その内容と位置
- colorScheme: 全体の配色
- artStyle: 絵柄・作風（線の太さ、塗り方、雰囲気など）
- mustNotChange: 今後スタンプを増やす際に絶対に変えてはいけない要素を箇条書きで（例：帽子の着用、配色など）

複数枚が渡された場合は、共通して見られる特徴を優先してまとめてください。
出力はJSON形式のみとし、説明文や前置きは含めないでください。`;

export async function runStickerCharacterAnalysis(
  apiKey: string,
  body: StickerCharacterAnalysisRequestBody,
): Promise<StickerCharacterAnalysisResult> {
  if (body.images.length === 0) {
    throw new Error("画像が指定されていません。");
  }
  if (body.images.length > MAX_IMAGES) {
    throw new Error(`一度に解析できるのは最大${MAX_IMAGES}枚までです。`);
  }

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
          content: [
            ...body.images.map((image) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: image.mediaType,
                data: image.dataBase64,
              },
            })),
            {
              type: "text" as const,
              text: "このキャラクターの特徴を分析してください。",
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: STICKER_CHARACTER_ANALYSIS_JSON_SCHEMA,
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
    return JSON.parse(textBlock.text) as StickerCharacterAnalysisResult;
  } catch {
    throw new Error("Claudeの応答をJSON形式として読み取れませんでした。");
  }
}
