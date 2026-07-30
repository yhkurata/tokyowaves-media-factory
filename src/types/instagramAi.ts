export interface BrandContext {
  id: "default";
  operatingGuide: string;
  brandColors: string[];
  contentRatioTargets: { category: string; targetPercent: number }[];
  kpiMetrics: string[];
  updatedAt: string;
}

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

export interface PostHistoryEntry {
  id: string;
  format: PostFormat;
  category: PostCategory;
  concept: string;
  captionExcerpt: string;
  tags: string[];
  status: PostStatus;
  plan: PostPlan | null;
  sourceProposalId: string | null;
  candidateIndex: number | null;
  isRecommended: boolean | null;
  proposedAt: string | null;
  approvedAt: string | null;
  imageCreatedAt: string | null;
  postedAt: string | null;
  resultLikes: number | null;
  resultSaves: number | null;
  resultComments: number | null;
  resultViews: number | null;
  resultMemo: string | null;
  instagramMediaId: string | null;
  instagramPermalink: string | null;
  instagramPublishedAt: string | null;
  createdAt: string;
}

export const POST_FORMATS: PostFormat[] = ["feed", "carousel", "reel", "story"];
export const POST_CATEGORIES: PostCategory[] = [
  "教育系",
  "共感系",
  "大会・活動報告",
  "募集",
];
export const POST_STATUSES: PostStatus[] = [
  "proposed",
  "approved",
  "rejected",
  "image_created",
  "posted",
  "backfilled",
];

export const FORMAT_LABELS: Record<PostFormat, string> = {
  feed: "フィード",
  carousel: "カルーセル",
  reel: "リール",
  story: "ストーリーズ",
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  proposed: "提案中",
  approved: "承認",
  rejected: "却下",
  image_created: "画像作成済み",
  posted: "投稿済み",
  backfilled: "過去実績（手入力）",
};

export const STATUS_COLORS: Record<PostStatus, string> = {
  proposed: "bg-gray-100 text-gray-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  image_created: "bg-purple-100 text-purple-700",
  posted: "bg-green-100 text-green-700",
  backfilled: "bg-gray-100 text-gray-500",
};

export type PostPurpose = "save" | "share" | "recruit" | "awareness" | "empathy";

export const PURPOSE_LABELS: Record<PostPurpose, string> = {
  save: "保存",
  share: "シェア",
  recruit: "募集",
  awareness: "認知",
  empathy: "共感",
};

export interface PostPlanPage {
  pageNumber: number;
  content: string;
  // このページ1枚だけを対象にした、文字込みでほぼ完成形を目指す画像生成
  // プロンプト（ロゴだけは画像生成AIに描かせず、配置用の余白を空けさせる）。
  imagePrompt?: string;
  // 画像生成後にCanvaで行う軽微な仕上げメモ（文言確認・ロゴ貼り付け程度）。
  canvaTouchUpNotes?: string;
}

export interface PostPlan {
  priorityStars: number;
  priorityReason: string;
  purpose: PostPurpose;
  title: string;
  firstSlideCopy: string;
  pageStructure: PostPlanPage[];
  designInstructions: {
    colors: string;
    photos: string;
    icons: string;
    layout: string;
    fontSize: string;
    whitespace: string;
    decoration: string;
  };
  // 過去（この項目の再設計前）に生成された提案にのみ残る互換フィールド。
  imageGenPrompt?: string;
  caption: string;
  cta: string;
  hashtags: string[];
  postTime: string;
  postTimeReason: string;
  metricsToWatch: string[];
}

export interface ProposalCandidate {
  format: PostFormat;
  formatReasoning: string;
  category: PostCategory;
  plan: PostPlan;
  noveltyNote: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revised";

export interface AgentProposal {
  id: string;
  requestedAt: string;
  userInstruction: string;
  candidates: [ProposalCandidate, ProposalCandidate, ProposalCandidate];
  recommendedCandidateIndex: number;
  recommendationReasoning: string;
  operationalSuggestions: string[];
  openQuestions: string[];
  approvalStatus: ApprovalStatus;
  approvedCandidateIndex: number | null;
  // このAPI呼び出し1回分の実測トークン数・概算コスト。
  inputTokens: number | null;
  outputTokens: number | null;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  costUsd: number | null;
  costJpy: number | null;
}

// 一般ユーザー向けの実行前確認ダイアログに表示する概算コスト。
// 入力トークンはcount_tokensによる実測値、出力トークンは過去の実行実績の
// 平均値（実績が無ければ既定値）による見積もりのため、実際の請求額とは
// 多少ずれうる（あくまで「約○円」の目安）。
export interface ProposeCostEstimate {
  costJpy: number | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  isOutputEstimateFromHistory: boolean;
}
