import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getBrandContext,
  updateBrandContext,
  type BrandContextPayload,
} from "../../server/brandContextHandler.js";
import {
  listPostHistory,
  createPostHistoryEntry,
  updatePostHistoryEntry,
  deletePostHistoryEntry,
  type CreatePostHistoryPayload,
  type UpdatePostHistoryPayload,
} from "../../server/instagramPostHistoryHandler.js";
import {
  runPropose,
  estimateProposeCost,
  type ProposeRequestBody,
} from "../../server/instagramProposeHandler.js";
import {
  listAgentProposals,
  updateProposalApproval,
  type UpdateApprovalPayload,
} from "../../server/instagramAgentProposalHandler.js";
import { assertInstagramProviderEnabled } from "../../server/instagramProviderAccess.js";

// Instagram AI機能の全エンドポイントを1つのVercel Functionにまとめたcatch-all
// ルート（Vercel Hobbyプランのサーバーレス関数12個上限対策。当初は機能ごとに
// 7ファイルに分けていたが、他機能分と合わせて上限を超えたため統合した）。
// ローカル開発では server/viteInstagramAiApiPlugin.ts が同じ /api/instagram/*
// パス構成を提供する。
//
// パス構成：
//   POST         /api/instagram/propose             （body.modeで"run"/"estimate"を切り替え）
//   GET, PUT     /api/instagram/brand-context
//   GET, POST    /api/instagram/post-history
//   PATCH, DELETE /api/instagram/post-history/{id}
//   GET          /api/instagram/agent-proposals
//   PATCH        /api/instagram/agent-proposals/{id}

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

function sendError(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const rawPath = req.query.path;
  const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const [resource, id] = segments;

  try {
    if (resource === "propose" && segments.length === 1) {
      await handlePropose(req, res);
      return;
    }
    if (resource === "brand-context" && segments.length === 1) {
      await handleBrandContext(req, res);
      return;
    }
    if (resource === "post-history" && segments.length === 1) {
      await handlePostHistoryList(req, res);
      return;
    }
    if (resource === "post-history" && segments.length === 2) {
      await handlePostHistoryItem(req, res, id);
      return;
    }
    if (resource === "agent-proposals" && segments.length === 1) {
      await handleAgentProposalList(req, res);
      return;
    }
    if (resource === "agent-proposals" && segments.length === 2) {
      await handleAgentProposalItem(req, res, id);
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

async function handlePropose(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    sendError(res, 405, "POSTメソッドのみ対応しています。");
    return;
  }
  const body: unknown = req.body;
  if (!isProposeRequestBody(body)) {
    sendError(res, 400, "リクエストの形式が不正です（instructionが必要です）。");
    return;
  }
  const provider = body.provider ?? "anthropic";
  try {
    assertInstagramProviderEnabled(provider);
  } catch (error) {
    sendError(
      res,
      403,
      error instanceof Error ? error.message : "選択したAIは利用できません。",
    );
    return;
  }
  const apiKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendError(
      res,
      500,
      provider === "openai"
        ? "サーバーに OPENAI_API_KEY が設定されていません。Vercelの環境変数を確認してください。"
        : "サーバーに ANTHROPIC_API_KEY が設定されていません。Vercelの環境変数を確認してください。",
    );
    return;
  }
  if (body.mode === "estimate") {
    const result = await estimateProposeCost(apiKey, body);
    res.status(200).json({ result });
    return;
  }
  const result = await runPropose(apiKey, body);
  res.status(200).json({ result });
}

async function handleBrandContext(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const result = await getBrandContext();
    res.status(200).json({ result });
    return;
  }
  if (req.method === "PUT") {
    const body: unknown = req.body;
    if (!isBrandContextPayload(body)) {
      sendError(res, 400, "リクエストの形式が不正です。");
      return;
    }
    const result = await updateBrandContext(body);
    res.status(200).json({ result });
    return;
  }
  sendError(res, 405, "GET・PUTのみ対応しています。");
}

async function handlePostHistoryList(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const result = await listPostHistory();
    res.status(200).json({ result });
    return;
  }
  if (req.method === "POST") {
    const body: unknown = req.body;
    if (!isCreatePostHistoryPayload(body)) {
      sendError(res, 400, "リクエストの形式が不正です。");
      return;
    }
    const result = await createPostHistoryEntry(body);
    res.status(201).json({ result });
    return;
  }
  sendError(res, 405, "GET・POSTのみ対応しています。");
}

async function handlePostHistoryItem(
  req: VercelRequest,
  res: VercelResponse,
  id: string | undefined,
) {
  if (typeof id !== "string") {
    sendError(res, 400, "idが不正です。");
    return;
  }
  if (req.method === "PATCH") {
    const body: unknown = req.body;
    if (!isUpdatePostHistoryPayload(body)) {
      sendError(res, 400, "リクエストの形式が不正です。");
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
  sendError(res, 405, "PATCH・DELETEのみ対応しています。");
}

async function handleAgentProposalList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    sendError(res, 405, "GETのみ対応しています。");
    return;
  }
  const result = await listAgentProposals();
  res.status(200).json({ result });
}

async function handleAgentProposalItem(
  req: VercelRequest,
  res: VercelResponse,
  id: string | undefined,
) {
  if (typeof id !== "string") {
    sendError(res, 400, "idが不正です。");
    return;
  }
  if (req.method !== "PATCH") {
    sendError(res, 405, "PATCHのみ対応しています。");
    return;
  }
  const body: unknown = req.body;
  if (!isUpdateApprovalPayload(body)) {
    sendError(res, 400, "リクエストの形式が不正です。");
    return;
  }
  const result = await updateProposalApproval(id, body);
  res.status(200).json({ result });
}
