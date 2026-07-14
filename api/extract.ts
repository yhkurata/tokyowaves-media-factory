import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  runExtraction,
  type ExtractRequestBody,
} from "../server/extractHandler";

// 本番デプロイ（Vercel）用のエントリーポイント。
// ローカル開発（npm run dev）では server/viteExtractPlugin.ts が同じ
// /api/extract パスを提供するため、フロントエンド側（fetch("/api/extract")）は
// コード変更なしでどちらの環境でも動く。実際の解析ロジックは
// server/extractHandler.ts の runExtraction に共通化してある。

const MAX_FILES = 5;

function isExtractRequestFile(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mediaType === "image/png" ||
      v.mediaType === "image/jpeg" ||
      v.mediaType === "application/pdf") &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

function isExtractRequestBody(value: unknown): value is ExtractRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.files) &&
    v.files.length > 0 &&
    v.files.length <= MAX_FILES &&
    v.files.every(isExtractRequestFile)
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
  if (!isExtractRequestBody(body)) {
    res.status(400).json({
      error: `リクエストの形式が不正です（filesが1〜${MAX_FILES}件必要です）。`,
    });
    return;
  }

  try {
    const result = await runExtraction(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "解析中に不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
