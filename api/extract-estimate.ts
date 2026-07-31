import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  estimateExtraction,
  type ExtractRequestBody,
} from "../server/extractHandler.js";

const MAX_FILES = 8;

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

// 一般ユーザー向け実行前確認ダイアログ用。count_tokensのみを呼ぶため課金は
// 発生しない（管理者モードではフロント側でこの呼び出し自体をスキップする）。
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
    const result = await estimateExtraction(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "見積もり中に不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
