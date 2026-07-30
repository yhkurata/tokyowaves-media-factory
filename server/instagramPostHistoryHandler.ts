import { eq, and, desc } from "drizzle-orm";
import { getDb, type DbOrTx } from "./db/client.js";
import { postHistory } from "./db/schema.js";
import type { ProposalCandidate } from "./instagramProposalSchema.js";

export type PostFormat = "feed" | "carousel" | "reel" | "story";
export type PostCategory = "教育系" | "共感系" | "大会・活動報告" | "募集";
export type PostStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "image_created"
  | "posted"
  | "backfilled";

export interface ResultMetrics {
  likes?: number;
  saves?: number;
  comments?: number;
  views?: number;
  memo?: string;
}

export interface CreatePostHistoryPayload {
  format: PostFormat;
  category: PostCategory;
  concept: string;
  captionExcerpt?: string;
  tags?: string[];
  status: PostStatus;
  proposedAt?: string | null;
  approvedAt?: string | null;
  postedAt?: string | null;
  sourceProposalId?: string | null;
}

export interface UpdatePostHistoryPayload {
  status?: PostStatus;
  postedAt?: string | null;
  resultMetrics?: ResultMetrics | null;
}

function createId() {
  return crypto.randomUUID();
}

const CAPTION_EXCERPT_LENGTH = 120;

// 直近のものから新しい順で返す（提案一覧画面・提案時の重複チェック用要約の両方に使う）。
export async function listPostHistory() {
  return getDb()
    .select()
    .from(postHistory)
    .orderBy(desc(postHistory.createdAt));
}

export async function getPostHistoryEntry(id: string, db: DbOrTx = getDb()) {
  const rows = await db.select().from(postHistory).where(eq(postHistory.id, id));
  if (rows.length === 0) throw new Error(`post_history id=${id} が見つかりません。`);
  return rows[0];
}

// 過去投稿の手入力（バックフィル）用。AI提案由来ではないため plan は null。
export async function createPostHistoryEntry(
  payload: CreatePostHistoryPayload,
) {
  const [created] = await getDb()
    .insert(postHistory)
    .values({
      id: createId(),
      format: payload.format,
      category: payload.category,
      concept: payload.concept,
      captionExcerpt: payload.captionExcerpt ?? "",
      tags: payload.tags ?? [],
      status: payload.status,
      plan: null,
      proposedAt: payload.proposedAt ? new Date(payload.proposedAt) : null,
      approvedAt: payload.approvedAt ? new Date(payload.approvedAt) : null,
      postedAt: payload.postedAt ? new Date(payload.postedAt) : null,
      sourceProposalId: payload.sourceProposalId ?? null,
    })
    .returning();
  return created;
}

// AIが1回の提案で出した3候補を、生成された時点でそれぞれ1行
// （status: proposed）として登録する。以後は個別に状態が変わっていく。
export async function createProposedCandidates(
  proposalId: string,
  requestedAt: Date,
  candidates: ProposalCandidate[],
  recommendedIndex: number,
  db: DbOrTx = getDb(),
) {
  const rows = candidates.map((candidate, index) => ({
    id: createId(),
    format: candidate.format,
    category: candidate.category,
    concept: candidate.plan.title,
    captionExcerpt: candidate.plan.caption.slice(0, CAPTION_EXCERPT_LENGTH),
    tags: candidate.plan.hashtags,
    status: "proposed" as const,
    plan: candidate.plan as unknown as Record<string, unknown>,
    sourceProposalId: proposalId,
    candidateIndex: index,
    isRecommended: index === recommendedIndex,
    proposedAt: requestedAt,
  }));
  return db.insert(postHistory).values(rows).returning();
}

const STATUS_TIMESTAMP_FIELD: Partial<Record<PostStatus, "approvedAt" | "imageCreatedAt" | "postedAt">> = {
  approved: "approvedAt",
  image_created: "imageCreatedAt",
  posted: "postedAt",
};

export async function updatePostHistoryEntry(
  id: string,
  payload: UpdatePostHistoryPayload,
  db: DbOrTx = getDb(),
) {
  const patch: Record<string, unknown> = {};
  if (payload.status !== undefined) {
    patch.status = payload.status;
    // ステータスに対応する日時が未設定なら、変更のタイミングで自動的に記録する
    // （「状態変更はいつでも可能」にするため、既存の日時があれば上書きしない）。
    const field = STATUS_TIMESTAMP_FIELD[payload.status];
    if (field) {
      const existing = await getPostHistoryEntry(id, db);
      if (!existing[field]) patch[field] = new Date();
    }
  }
  if (payload.postedAt !== undefined) {
    patch.postedAt = payload.postedAt ? new Date(payload.postedAt) : null;
  }
  if (payload.resultMetrics !== undefined) {
    const m = payload.resultMetrics;
    patch.resultLikes = m?.likes ?? null;
    patch.resultSaves = m?.saves ?? null;
    patch.resultComments = m?.comments ?? null;
    patch.resultViews = m?.views ?? null;
    patch.resultMemo = m?.memo ?? null;
  }

  const [updated] = await db
    .update(postHistory)
    .set(patch)
    .where(eq(postHistory.id, id))
    .returning();
  if (!updated) throw new Error(`post_history id=${id} が見つかりません。`);
  return updated;
}

// 特定の提案（agent_proposals）の特定候補に対応する post_history 行を更新する。
// 承認・却下（3案まとめて）の反映に使う。
export async function updatePostHistoryByCandidate(
  sourceProposalId: string,
  candidateIndex: number,
  status: PostStatus,
  db: DbOrTx = getDb(),
) {
  const rows = await db
    .select()
    .from(postHistory)
    .where(
      and(
        eq(postHistory.sourceProposalId, sourceProposalId),
        eq(postHistory.candidateIndex, candidateIndex),
      ),
    );
  if (rows.length === 0) return null;
  return updatePostHistoryEntry(rows[0].id, { status }, db);
}

export async function updateAllPostHistoryForProposal(
  sourceProposalId: string,
  status: PostStatus,
  db: DbOrTx = getDb(),
) {
  const rows = await db
    .select()
    .from(postHistory)
    .where(eq(postHistory.sourceProposalId, sourceProposalId));
  for (const row of rows) {
    await updatePostHistoryEntry(row.id, { status }, db);
  }
}

export async function deletePostHistoryEntry(id: string) {
  await getDb().delete(postHistory).where(eq(postHistory.id, id));
}
