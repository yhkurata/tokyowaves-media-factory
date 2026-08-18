import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listExpeditionGuideTemplates,
  saveExpeditionGuideTemplate,
  updateExpeditionGuideTemplate,
  deleteExpeditionGuideTemplate,
} from "../../server/expeditionGuideTemplateHandler.js";
import type { ExpeditionGuideInput } from "../../src/types/expeditionGuide.js";

// 遠征要項AIの共有テンプレート機能。以前はブラウザのlocalStorageのみに
// 保存していたため、監督が保存しても他のメンバーの画面には反映されなかった。
// チーム全員で積み上げていけるよう、他機能と同じNeon DBに保存する
// （ログイン機構が無いため、誰でも読み書きできる共有テーブル）。
//
// パス構成：
//   GET   /api/expedition-guide-templates       一覧取得（無ければシード投入）
//   POST  /api/expedition-guide-templates       新規保存（同名があれば上書き）
//   PATCH /api/expedition-guide-templates/{id}  既存テンプレートを今の内容で更新
//   DELETE /api/expedition-guide-templates/{id} 削除

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

interface SavePayload {
  name: string;
  input: ExpeditionGuideInput;
}

function isSavePayload(value: unknown): value is SavePayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    v.name.trim() !== "" &&
    isExpeditionGuideInput(v.input)
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
  const rawPath = req.query.path;
  const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const [id] = segments;

  try {
    if (segments.length === 0) {
      if (req.method === "GET") {
        const result = await listExpeditionGuideTemplates();
        res.status(200).json({ result });
        return;
      }
      if (req.method === "POST") {
        const body: unknown = req.body;
        if (!isSavePayload(body)) {
          sendError(res, 400, "リクエストの形式が不正です。");
          return;
        }
        const result = await saveExpeditionGuideTemplate(body);
        res.status(201).json({ result });
        return;
      }
      sendError(res, 405, "GET・POSTのみ対応しています。");
      return;
    }

    if (segments.length === 1) {
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
      return;
    }

    sendError(res, 404, "リクエストされたパスが見つかりません。");
  } catch (err) {
    sendError(
      res,
      500,
      err instanceof Error ? err.message : "不明なエラーが発生しました。",
    );
  }
}
