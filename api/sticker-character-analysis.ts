import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  runStickerCharacterAnalysis,
  type StickerCharacterAnalysisRequestBody,
} from "../server/stickerCharacterAnalysisHandler.js";

function isStickerImage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mediaType === "image/png" || v.mediaType === "image/jpeg") &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

function isStickerCharacterAnalysisRequestBody(
  value: unknown,
): value is StickerCharacterAnalysisRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.images) && v.images.length > 0 && v.images.every(isStickerImage)
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POSTメソッドのみ対応しています。" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "サーバーに ANTHROPIC_API_KEY が設定されていません。Vercelの環境変数を確認してください。",
    });
    return;
  }

  const body: unknown = req.body;
  if (!isStickerCharacterAnalysisRequestBody(body)) {
    res.status(400).json({ error: "リクエストの形式が不正です。" });
    return;
  }

  try {
    const result = await runStickerCharacterAnalysis(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
