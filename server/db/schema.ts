import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  pgEnum,
  doublePrecision,
} from "drizzle-orm/pg-core";

// ============================================================
// brand_context: 単一レコード（id は常に "default"）。
// operatingGuide にユーザーから受領した運用指示・ブランド情報の全文を
// Markdownで保持する。brandColors/contentRatioTargets/kpiMetrics は
// そこから抽出した構造化フィールドで、改善提案の自動判定やMedia Factory
// 連携などプログラム側から参照する用途のみに使う。
// ============================================================
export const brandContext = pgTable("brand_context", {
  id: text("id").primaryKey().default("default"),
  operatingGuide: text("operating_guide").notNull().default(""),
  brandColors: jsonb("brand_colors").$type<string[]>().notNull().default([]),
  contentRatioTargets: jsonb("content_ratio_targets")
    .$type<{ category: string; targetPercent: number }[]>()
    .notNull()
    .default([]),
  kpiMetrics: jsonb("kpi_metrics").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// post_history: 「毎日使うAI」の中心となる、個々の投稿案のライフサイクルを
// 一元管理するテーブル。AIが1回の提案で出す3候補は、生成された時点で
// それぞれ1行（status: proposed）としてここに登録され、以後
// 承認/却下/画像作成済み/投稿済みへと自由に状態遷移する
// （状態はいつでも変更可能で、一方向の強制はしない）。
// 重複チェック・投稿比率トラッキング・提案一覧画面の一次データ源。
// ============================================================
export const postFormatEnum = pgEnum("post_format", [
  "feed",
  "carousel",
  "reel",
  "story",
]);

export const postCategoryEnum = pgEnum("post_category", [
  "教育系",
  "共感系",
  "大会・活動報告",
  "募集",
]);

export const postStatusEnum = pgEnum("post_status", [
  "proposed", // 提案中（AIが出したばかり、まだ承認前）
  "approved", // 承認
  "rejected", // 却下
  "image_created", // 画像作成済み
  "posted", // 投稿済み
  "backfilled", // 過去実績の手入力（AI提案由来でない、ステータス管理外の実績記録）
]);

export const postHistory = pgTable("post_history", {
  id: text("id").primaryKey(),
  format: postFormatEnum("format").notNull(),
  category: postCategoryEnum("category").notNull(),
  concept: text("concept").notNull(), // タイトル相当（一覧表示・検索用）
  captionExcerpt: text("caption_excerpt").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  status: postStatusEnum("status").notNull(),
  // AI提案由来の場合、候補の全内容（デザイン指示・キャプション全文・
  // 画像生成プロンプト等）をそのまま保持し、一覧からいつでも再表示できるようにする。
  // 手入力（backfilled）の場合はnull。
  plan: jsonb("plan").$type<Record<string, unknown> | null>(),
  sourceProposalId: text("source_proposal_id"), // どのagent_proposals由来か
  candidateIndex: integer("candidate_index"), // そのproposal内の何番目の候補か（0-2）
  isRecommended: boolean("is_recommended"), // AIがそのproposal内で推薦した候補だったか
  proposedAt: timestamp("proposed_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  imageCreatedAt: timestamp("image_created_at", { withTimezone: true }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  // 投稿結果メモ（すべて任意入力）
  resultLikes: integer("result_likes"),
  resultSaves: integer("result_saves"),
  resultComments: integer("result_comments"),
  resultViews: integer("result_views"),
  resultMemo: text("result_memo"),
  // Instagram連携は今回未実装。将来の自動同期に備えて構造だけ用意しておく。
  instagramMediaId: text("instagram_media_id"),
  instagramPermalink: text("instagram_permalink"),
  instagramPublishedAt: timestamp("instagram_published_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// agent_proposals: AIの提案ログ全件（却下分も含む）。
// candidates は「投稿提案時の出力形式」テンプレートに沿った構造化データを
// そのままjsonbで保持する（PostPlan/ProposalCandidate 相当）。
// ============================================================
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "revised",
]);

export const agentProposals = pgTable("agent_proposals", {
  id: text("id").primaryKey(),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userInstruction: text("user_instruction").notNull(),
  // ProposalCandidate[] （各要素に format/formatReasoning/category/plan/noveltyNote を含む）
  candidates: jsonb("candidates").$type<unknown[]>().notNull(),
  recommendedCandidateIndex: integer("recommended_candidate_index").notNull(),
  recommendationReasoning: text("recommendation_reasoning").notNull(),
  operationalSuggestions: jsonb("operational_suggestions")
    .$type<string[]>()
    .notNull()
    .default([]),
  openQuestions: jsonb("open_questions")
    .$type<string[]>()
    .notNull()
    .default([]),
  approvalStatus: approvalStatusEnum("approval_status")
    .notNull()
    .default("pending"),
  approvedCandidateIndex: integer("approved_candidate_index"),
  // この提案を生成したClaude API呼び出し1回分の実測トークン数と概算コスト。
  // 「毎回いくらかかったか」を提案一覧・提案画面に表示するために保持する。
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cacheCreationInputTokens: integer("cache_creation_input_tokens")
    .notNull()
    .default(0),
  cacheReadInputTokens: integer("cache_read_input_tokens")
    .notNull()
    .default(0),
  costUsd: doublePrecision("cost_usd"),
  costJpy: doublePrecision("cost_jpy"),
});
