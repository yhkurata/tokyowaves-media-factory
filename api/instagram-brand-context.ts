import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getBrandContext,
  updateBrandContext,
  type BrandContextPayload,
} from "../server/brandContextHandler.js";

function isBrandContextPayload(value: unknown): value is BrandContextPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.operatingGuide === "string" &&
    Array.isArray(v.brandColors) &&
    Array.isArray(v.contentRatioTargets) &&
    Array.isArray(v.kpiMetrics)
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === "GET") {
      const result = await getBrandContext();
      res.status(200).json({ result });
      return;
    }

    if (req.method === "PUT") {
      const body: unknown = req.body;
      if (!isBrandContextPayload(body)) {
        res.status(400).json({ error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await updateBrandContext(body);
      res.status(200).json({ result });
      return;
    }

    res.status(405).json({ error: "GET・PUTのみ対応しています。" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
