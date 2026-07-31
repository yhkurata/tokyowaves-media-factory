import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getBrandContext,
  updateBrandContext,
  type BrandContextPayload,
} from "./brandContextHandler.js";
import {
  listPostHistory,
  createPostHistoryEntry,
  updatePostHistoryEntry,
  deletePostHistoryEntry,
  type CreatePostHistoryPayload,
  type UpdatePostHistoryPayload,
} from "./instagramPostHistoryHandler.js";
import {
  runPropose,
  estimateProposeCost,
  type ProposeRequestBody,
} from "./instagramProposeHandler.js";
import {
  listAgentProposals,
  updateProposalApproval,
  type UpdateApprovalPayload,
} from "./instagramAgentProposalHandler.js";
import { assertInstagramProviderEnabled } from "./instagramProviderAccess.js";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB（このAPIはJSONのみで十分な余裕）

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
const VALID_APPROVAL_STATUSES = ["pending", "approved", "rejected", "revised"];

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

function isCreatePostHistoryPayload(
  value: unknown,
): value is CreatePostHistoryPayload {
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

function isUpdatePostHistoryPayload(
  value: unknown,
): value is UpdatePostHistoryPayload {
  return typeof value === "object" && value !== null;
}

interface ProposeRequest extends ProposeRequestBody {
  mode?: "run" | "estimate";
}

function isProposeRequestBody(value: unknown): value is ProposeRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.instruction === "string" &&
    v.instruction.trim() !== "" &&
    (v.provider === undefined ||
      v.provider === "anthropic" ||
      v.provider === "openai") &&
    (v.mode === undefined || v.mode === "run" || v.mode === "estimate")
  );
}

function isUpdateApprovalPayload(
  value: unknown,
): value is UpdateApprovalPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.approvalStatus === "string" &&
    VALID_APPROVAL_STATUSES.includes(v.approvalStatus)
  );
}

// ローカル開発サーバー用のミドルウェア。api/instagram/[...path].ts（Vercel
// Function、1つのcatch-allにまとめてある）と同じハンドラー関数を呼ぶだけで、
// ロジックの二重管理を避ける。パス構成も本番と完全に一致させてある：
//   POST         /api/instagram/propose             （body.modeで"run"/"estimate"を切り替え）
//   GET, PUT     /api/instagram/brand-context
//   GET, POST    /api/instagram/post-history
//   PATCH, DELETE /api/instagram/post-history/{id}
//   GET          /api/instagram/agent-proposals
//   PATCH        /api/instagram/agent-proposals/{id}
export function instagramAiApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: "tokyowaves-instagram-ai-api",
    configureServer(server) {
      server.middlewares.use("/api/instagram", (req, res, next) => {
        // "/api/instagram" にマウントされているため、req.url はこのプレフィックスを
        // 除いたパス（例: "/propose", "/post-history/abc123"）になる。
        const segments = (req.url ?? "").split("?")[0].split("/").filter(Boolean);
        const [resource, id] = segments;

        if (resource === "propose" && segments.length === 1) {
          void handlePropose(req, res, apiKey);
          return;
        }
        if (resource === "brand-context" && segments.length === 1) {
          void handleBrandContext(req, res);
          return;
        }
        if (resource === "post-history" && segments.length === 1) {
          void handlePostHistoryList(req, res);
          return;
        }
        if (resource === "post-history" && segments.length === 2) {
          void handlePostHistoryItem(req, res, id);
          return;
        }
        if (resource === "agent-proposals" && segments.length === 1) {
          void handleAgentProposalList(req, res);
          return;
        }
        if (resource === "agent-proposals" && segments.length === 2) {
          void handleAgentProposalItem(req, res, id);
          return;
        }
        next();
      });
    },
  };
}

async function handleBrandContext(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "GET") {
      const result = await getBrandContext();
      sendJson(res, 200, { result });
      return;
    }
    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      if (!isBrandContextPayload(body)) {
        sendJson(res, 400, { error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await updateBrandContext(body);
      sendJson(res, 200, { result });
      return;
    }
    sendJson(res, 405, { error: "GET・PUTのみ対応しています。" });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}

async function handlePostHistoryList(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "GET") {
      const result = await listPostHistory();
      sendJson(res, 200, { result });
      return;
    }
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!isCreatePostHistoryPayload(body)) {
        sendJson(res, 400, { error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await createPostHistoryEntry(body);
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

async function handlePostHistoryItem(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
) {
  try {
    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      if (!isUpdatePostHistoryPayload(body)) {
        sendJson(res, 400, { error: "リクエストの形式が不正です。" });
        return;
      }
      const result = await updatePostHistoryEntry(id, body);
      sendJson(res, 200, { result });
      return;
    }
    if (req.method === "DELETE") {
      await deletePostHistoryEntry(id);
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

async function handlePropose(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "POSTメソッドのみ対応しています。" });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!isProposeRequestBody(body)) {
      sendJson(res, 400, {
        error: "リクエストの形式が不正です（instructionが必要です）。",
      });
      return;
    }
    const provider = body.provider ?? "anthropic";
    try {
      assertInstagramProviderEnabled(provider);
    } catch (error) {
      sendJson(res, 403, {
        error:
          error instanceof Error ? error.message : "選択したAIは利用できません。",
      });
      return;
    }
    const selectedApiKey =
      provider === "openai" ? process.env.OPENAI_API_KEY : apiKey;
    if (!selectedApiKey) {
      sendJson(res, 500, {
        error:
          provider === "openai"
            ? "サーバーに OPENAI_API_KEY が設定されていません。.env ファイルを確認してください。"
            : "サーバーに ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。",
      });
      return;
    }
    if (body.mode === "estimate") {
      const result = await estimateProposeCost(selectedApiKey, body);
      sendJson(res, 200, { result });
      return;
    }
    const result = await runPropose(selectedApiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error:
        err instanceof Error ? err.message : "提案生成中に不明なエラーが発生しました。",
    });
  }
}

async function handleAgentProposalList(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "GETのみ対応しています。" });
    return;
  }
  try {
    const result = await listAgentProposals();
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}

async function handleAgentProposalItem(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
) {
  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "PATCHのみ対応しています。" });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!isUpdateApprovalPayload(body)) {
      sendJson(res, 400, { error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await updateProposalApproval(id, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}
