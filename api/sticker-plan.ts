import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  runStickerPlan,
  estimateStickerPlan,
  type StickerPlanRequestBody,
} from "../server/stickerPlanHandler.js";

// Vercel Hobbyプランの関数数上限対策として、実行(mode:"run")と見積もり
// (mode:"estimate")を1つの関数にまとめている。

interface RequestBody extends StickerPlanRequestBody {
  mode?: "run" | "estimate";
}

function isStickerImage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mediaType === "image/png" || v.mediaType === "image/jpeg") &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.instruction === "string" &&
    v.instruction.trim() !== "" &&
    typeof v.requestedCount === "number" &&
    typeof v.characterSettings === "object" &&
    v.characterSettings !== null &&
    Array.isArray(v.referenceImages) &&
    v.referenceImages.every(isStickerImage) &&
    Array.isArray(v.existingCandidates) &&
    (v.mode === undefined || v.mode === "run" || v.mode === "estimate")
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
  if (!isRequestBody(body)) {
    res.status(400).json({ error: "リクエストの形式が不正です。" });
    return;
  }

  try {
    if (body.mode === "estimate") {
      const result = await estimateStickerPlan(apiKey, body);
      res.status(200).json({ result });
      return;
    }
    const result = await runStickerPlan(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
