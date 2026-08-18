import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listExpeditionGuideTemplates,
  saveExpeditionGuideTemplate,
} from "../server/expeditionGuideTemplateHandler.js";
import type { ExpeditionGuideInput } from "../src/types/expeditionGuide.js";

// 遠征要項AIの共有テンプレート機能（一覧・新規保存）。以前はブラウザの
// localStorageのみに保存していたため、監督が保存しても他のメンバーの画面には
// 反映されなかった。チーム全員で積み上げていけるよう、他機能と同じNeon DBに
// 保存する（ログイン機構が無いため、誰でも読み書きできる共有テーブル）。
//
// 個別テンプレートの更新・削除は api/expedition-guide-templates/[id].ts。
// 当初は両方を1つのcatch-all（[...path].ts）にまとめていたが、Vercelの
// catch-allルートは1つ以上のパスセグメントが無いとマッチせず、この
// 「セグメント無しのルート」（一覧・新規保存）が本番で404になっていたため、
// このファイルを分離した。

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

function sendError(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
  } catch (err) {
    sendError(
      res,
      500,
      err instanceof Error ? err.message : "不明なエラーが発生しました。",
    );
  }
}
