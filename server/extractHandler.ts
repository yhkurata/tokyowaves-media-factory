import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACTION_JSON_SCHEMA,
  type ExtractionResult,
} from "./extractionSchema.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt.js";
import { friendlyAnthropicErrorMessage } from "./anthropicErrors.js";

export type SupportedMediaType = "image/png" | "image/jpeg" | "application/pdf";

export interface ExtractRequestFile {
  mediaType: SupportedMediaType;
  dataBase64: string;
}

export interface ExtractRequestBody {
  files: ExtractRequestFile[];
}

const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_FILES = 8;

function toContentBlock(file: ExtractRequestFile) {
  return file.mediaType === "application/pdf"
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: file.dataBase64,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: file.mediaType,
          data: file.dataBase64,
        },
      };
}

export async function runExtraction(
  apiKey: string,
  body: ExtractRequestBody,
): Promise<ExtractionResult> {
  if (body.files.length === 0) {
    throw new Error("ファイルが指定されていません。");
  }
  if (body.files.length > MAX_FILES) {
    throw new Error(`一度に解析できるのは最大${MAX_FILES}ファイルまでです。`);
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const instructionText =
    body.files.length > 1
      ? `${body.files.length}件の資料から大会情報を抽出し、指定されたJSON形式で返してください。資料間で共通する試合No.があれば、内容を照合して1つの結果に統合してください。`
      : "この資料から大会情報を抽出し、指定されたJSON形式で返してください。";

  let response;
  try {
    // 思考トークンを含めると max_tokens が大きく、10分を超えうるため
    // 非ストリーミングはSDKに拒否される。ストリーミングで受けて最終結果だけ使う。
    const stream = client.messages.stream({
      model,
      // 試合数の多い大会（複数日・複数会場）でもJSON出力が途中で切れないよう、
      // また複雑な勝ち上がりトーナメント表の対戦カードを推論する思考トークン分も
      // 十分な余裕を持たせている。
      max_tokens: 32000,
      // 「試合No.15はトーナメント表の位置的にどのチームか」のような多段階の
      // 空間的推論が必要なため、thinkingなしだと安全側に倒れてnullを返しがちになる。
      thinking: { type: "adaptive" },
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...body.files.map(toContentBlock),
            {
              type: "text",
              text: instructionText,
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: EXTRACTION_JSON_SCHEMA,
        },
      },
    });
    response = await stream.finalMessage();
  } catch (err) {
    throw new Error(friendlyAnthropicErrorMessage(err));
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "資料の情報量が多く、解析結果の出力が途中で切れてしまいました。資料を分割して解析するか、日付・会場ごとにファイルを分けて再度お試しください。",
    );
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした。");
  }

  try {
    return JSON.parse(textBlock.text) as ExtractionResult;
  } catch {
    throw new Error(
      "Claudeの応答をJSON形式として読み取れませんでした。もう一度お試しいただくか、資料を分けて解析してください。",
    );
  }
}
