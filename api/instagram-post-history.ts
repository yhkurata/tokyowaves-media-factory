import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listPostHistory,
  createPostHistoryEntry,
  type CreatePostHistoryPayload,
} from "../server/instagramPostHistoryHandler.js";

const VALID_FORMATS = ["feed", "carousel", "reel", "story"];
const VALID_CATEGORIES = ["教育系", "共感系", "大会・活動報告", "募集"];
const VALID_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "image_created",
  "posted",
  "backfilled",
];

function isCreatePayload(value: unknown): value is CreatePostHistoryPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.format === "string" &&
    VALID_FORMATS.includes(v.format) &&
    typeof v.category === "string" &&
    VALID_CATEGORIES.includes(v.category) &&
    typeof v.concept === "string" &&
    v.concept.trim() !== "" &&
    typeof v.status === "string" &&
    VALID_STATUSES.includes(v.status)
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === "GET") {
      const result = await listPostHistory();
      res.status(200).json({ result });
      return;
    }

    if (req.method === "POST") {
      const body: unknown = req.body;
      if (!isCreatePayload(body)) {
        res.status(400).json({ error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await createPostHistoryEntry(body);
      res.status(201).json({ result });
      return;
    }

    res.status(405).json({ error: "GET・POSTのみ対応しています。" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
