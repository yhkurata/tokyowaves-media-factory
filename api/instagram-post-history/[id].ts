import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  updatePostHistoryEntry,
  deletePostHistoryEntry,
  type UpdatePostHistoryPayload,
} from "../../server/instagramPostHistoryHandler.js";

function isUpdatePayload(value: unknown): value is UpdatePostHistoryPayload {
  return typeof value === "object" && value !== null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const id = req.query.id;
  if (typeof id !== "string") {
    res.status(400).json({ error: "idが不正です。" });
    return;
  }

  try {
    if (req.method === "PATCH") {
      const body: unknown = req.body;
      if (!isUpdatePayload(body)) {
        res.status(400).json({ error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await updatePostHistoryEntry(id, body);
      res.status(200).json({ result });
      return;
    }

    if (req.method === "DELETE") {
      await deletePostHistoryEntry(id);
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: "PATCH・DELETEのみ対応しています。" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
