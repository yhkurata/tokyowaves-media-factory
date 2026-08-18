import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  listExpeditionGuideTemplates,
  saveExpeditionGuideTemplate,
  updateExpeditionGuideTemplate,
  deleteExpeditionGuideTemplate,
} from "./expeditionGuideTemplateHandler.js";
import type { ExpeditionGuideInput } from "../src/types/expeditionGuide.js";

const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1MB（JSONのみで十分な余裕）

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error("リクエストが大きすぎます。"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (received === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch {
        reject(new Error("リクエストの形式が不正です。"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(body === undefined ? "" : JSON.stringify(body));
}

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

// ローカル開発サーバー用のミドルウェア。api/expedition-guide-templates.ts +
// api/expedition-guide-templates/[id].ts（Vercel Functions）と同じハンドラー
// 関数を呼ぶだけで、ロジックの二重管理を避ける。
// （本番側はセグメント無しのルートがcatch-allにマッチしないため2ファイルに
// 分かれているが、こちらは1つのミドルウェアでパス構成だけ本番と一致させてある）
//   GET   /api/expedition-guide-templates       一覧取得（無ければシード投入）
//   POST  /api/expedition-guide-templates       新規保存（同名があれば上書き）
//   PATCH /api/expedition-guide-templates/{id}  既存テンプレートを今の内容で更新
//   DELETE /api/expedition-guide-templates/{id} 削除
export function expeditionGuideTemplateApiPlugin(): Plugin {
  return {
    name: "tokyowaves-expedition-guide-template-api",
    configureServer(server) {
      server.middlewares.use(
        "/api/expedition-guide-templates",
        (req, res, next) => {
          const segments = (req.url ?? "").split("?")[0].split("/").filter(Boolean);
          const [id] = segments;

          if (segments.length === 0) {
            void handleCollection(req, res);
            return;
          }
          if (segments.length === 1) {
            void handleItem(req, res, id);
            return;
          }
          next();
        },
      );
    },
  };
}

async function handleCollection(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "GET") {
      const result = await listExpeditionGuideTemplates();
      sendJson(res, 200, { result });
      return;
    }
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!isSavePayload(body)) {
        sendJson(res, 400, { error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await saveExpeditionGuideTemplate(body);
      sendJson(res, 201, { result });
      return;
    }
    sendJson(res, 405, { error: "GET・POSTのみ対応しています。" });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}

async function handleItem(req: IncomingMessage, res: ServerResponse, id: string) {
  try {
    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      if (!isUpdatePayload(body)) {
        sendJson(res, 400, { error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await updateExpeditionGuideTemplate(id, body.input);
      sendJson(res, 200, { result });
      return;
    }
    if (req.method === "DELETE") {
      await deleteExpeditionGuideTemplate(id);
      sendJson(res, 204, undefined);
      return;
    }
    sendJson(res, 405, { error: "PATCH・DELETEのみ対応しています。" });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}
