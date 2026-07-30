import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  updateProposalApproval,
  type UpdateApprovalPayload,
} from "../../server/instagramAgentProposalHandler.js";

const VALID_STATUSES = ["pending", "approved", "rejected", "revised"];

function isUpdatePayload(value: unknown): value is UpdateApprovalPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.approvalStatus === "string" && VALID_STATUSES.includes(v.approvalStatus);
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

  if (req.method !== "PATCH") {
    res.status(405).json({ error: "PATCHのみ対応しています。" });
    return;
  }

  try {
    const body: unknown = req.body;
    if (!isUpdatePayload(body)) {
      res.status(400).json({ error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await updateProposalApproval(id, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
