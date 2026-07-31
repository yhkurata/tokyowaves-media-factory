import type {
  BrandContext,
  PostHistoryEntry,
  AgentProposal,
  ApprovalStatus,
  ResultMetrics,
  ProposeCostEstimate,
} from "../types/instagramAi";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `リクエストに失敗しました（${res.status}）。`);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.result as T;
}

export function getBrandContext(): Promise<BrandContext> {
  return fetch("/api/instagram/brand-context").then((res) => handleResponse(res));
}

export function updateBrandContext(
  payload: Omit<BrandContext, "id" | "updatedAt">,
): Promise<BrandContext> {
  return fetch("/api/instagram/brand-context", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res));
}

export function listPostHistory(): Promise<PostHistoryEntry[]> {
  return fetch("/api/instagram/post-history").then((res) => handleResponse(res));
}

export function createPostHistoryEntry(payload: {
  format: PostHistoryEntry["format"];
  category: PostHistoryEntry["category"];
  concept: string;
  captionExcerpt?: string;
  tags?: string[];
  status: PostHistoryEntry["status"];
  postedAt?: string | null;
}): Promise<PostHistoryEntry> {
  return fetch("/api/instagram/post-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res));
}

export function updatePostHistoryEntry(
  id: string,
  payload: {
    status?: PostHistoryEntry["status"];
    postedAt?: string | null;
    resultMetrics?: ResultMetrics | null;
  },
): Promise<PostHistoryEntry> {
  return fetch(`/api/instagram/post-history/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res));
}

export function deletePostHistoryEntry(id: string): Promise<void> {
  return fetch(`/api/instagram/post-history/${id}`, { method: "DELETE" }).then(
    (res) => handleResponse(res),
  );
}

// このAPIはClaude APIを呼び出すため、実行するたびに料金が発生する。
export function proposeNextPost(instruction: string): Promise<AgentProposal> {
  return fetch("/api/instagram/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "run", instruction }),
  }).then((res) => handleResponse(res));
}

// 一般ユーザー向け確認ダイアログ用の概算コスト取得。count_tokensのみを呼ぶため
// 課金は発生しない。実行(mode:"run")と同じ /api/instagram/propose エンドポイント
// にまとめてある（Vercel Hobbyプランの関数数上限対策）。
export function estimateProposeCost(
  instruction: string,
): Promise<ProposeCostEstimate> {
  return fetch("/api/instagram/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "estimate", instruction }),
  }).then((res) => handleResponse(res));
}

export function listAgentProposals(): Promise<AgentProposal[]> {
  return fetch("/api/instagram/agent-proposals").then((res) => handleResponse(res));
}

export function updateProposalApproval(
  id: string,
  payload: { approvalStatus: ApprovalStatus; approvedCandidateIndex?: number | null },
): Promise<AgentProposal> {
  return fetch(`/api/instagram/agent-proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => handleResponse(res));
}
