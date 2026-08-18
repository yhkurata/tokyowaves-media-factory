import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  updateExpeditionGuideTemplate,
  deleteExpeditionGuideTemplate,
} from "../../server/expeditionGuideTemplateHandler.js";
import type { ExpeditionGuideInput } from "../../src/types/expeditionGuide.js";

// 遠征要項AIの共有テンプレート機能（個別テンプレートの更新・削除）。
// 一覧・新規保存は api/expedition-guide-templates.ts（セグメント無しのルート
// はVercelのcatch-allにマッチしないため分離してある）。

function isExpeditionGuideInput(value: unknown): value is ExpeditionGuideInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tournamentName === "string" &&
    typeof v.leaders === "string" &&
    typeof v.schedule === "string" &&
    typeof v.venue === "string" &&
    typeof v.targetGroup === "string" &&
    typeof v.extraItems === "string" &&
    typeof v.practiceTime === "string" &&
    typeof v.practicePartner === "string" &&
    typeof v.meeting === "string" &&
    typeof v.dismissal === "string" &&
    typeof v.fee === "string" &&
    typeof v.notes === "string"
  );
}

interface UpdatePayload {
  input: ExpeditionGuideInput;
}

function isUpdatePayload(value: unknown): value is UpdatePayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isExpeditionGuideInput(v.input);
}

function sendError(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id;
  if (typeof id !== "string") {
    sendError(res, 400, "idが不正です。");
    return;
  }

  try {
    if (req.method === "PATCH") {
      const body: unknown = req.body;
      if (!isUpdatePayload(body)) {
        sendError(res, 400, "リクエストの形式が不正です。");
        return;
      }
      const result = await updateExpeditionGuideTemplate(id, body.input);
      res.status(200).json({ result });
      return;
    }
    if (req.method === "DELETE") {
      await deleteExpeditionGuideTemplate(id);
      res.status(204).end();
      return;
    }
    sendError(res, 405, "PATCH・DELETEのみ対応しています。");
  } catch (err) {
    sendError(
      res,
      500,
      err instanceof Error ? err.message : "不明なエラーが発生しました。",
    );
  }
}
