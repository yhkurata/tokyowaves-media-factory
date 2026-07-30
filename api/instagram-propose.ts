import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runPropose, type ProposeRequestBody } from "../server/instagramProposeHandler.js";

function isProposeRequestBody(value: unknown): value is ProposeRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.instruction === "string" && v.instruction.trim() !== "";
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
  if (!isProposeRequestBody(body)) {
    res.status(400).json({ error: "リクエストの形式が不正です（instructionが必要です）。" });
    return;
  }

  try {
    const result = await runPropose(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "提案生成中に不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
