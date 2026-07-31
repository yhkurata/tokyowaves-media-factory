import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "./db/client.js";
import { agentProposals } from "./db/schema.js";
import {
  updatePostHistoryByCandidate,
  updateAllPostHistoryForProposal,
} from "./instagramPostHistoryHandler.js";
import { getBrandContext } from "./brandContextHandler.js";
import {
  validateProposalSafety,
  type ProposalSafetyWarning,
} from "./instagramProposalSafety.js";
import type { ProposalResult } from "./instagramProposalSchema.js";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revised";

export interface UpdateApprovalPayload {
  approvalStatus: ApprovalStatus;
  approvedCandidateIndex?: number | null;
}

type StoredProposal = Awaited<ReturnType<typeof listAgentProposalRows>>[number];

async function listAgentProposalRows(limit = DEFAULT_LIST_LIMIT) {
  return getDb()
    .select()
    .from(agentProposals)
    .orderBy(desc(agentProposals.requestedAt))
    .limit(limit);
}

async function addSafetyWarnings<T extends StoredProposal>(
  proposal: T,
  operatingGuide: string,
): Promise<T & { safetyWarnings: ProposalSafetyWarning[] }> {
  return {
    ...proposal,
    safetyWarnings: validateProposalSafety(
      proposal.candidates as ProposalResult["candidates"],
      `${operatingGuide}\n${proposal.userInstruction}`,
    ),
  };
}

const DEFAULT_LIST_LIMIT = 20;
const OUTPUT_TOKEN_HISTORY_SAMPLE_SIZE = 10;

// 実行前の概算コスト見積もり用：直近の実行実績（outputTokensが記録されている
// もの）の平均を返す。実績が無い場合はnull（呼び出し側で既定値にフォールバック）。
export async function getAverageOutputTokens(
  aiProvider = "anthropic",
): Promise<number | null> {
  const rows = await getDb()
    .select({ outputTokens: agentProposals.outputTokens })
    .from(agentProposals)
    .where(
      and(
        isNotNull(agentProposals.outputTokens),
        eq(agentProposals.aiProvider, aiProvider),
      ),
    )
    .orderBy(desc(agentProposals.requestedAt))
    .limit(OUTPUT_TOKEN_HISTORY_SAMPLE_SIZE);
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0);
  return Math.round(total / rows.length);
}

// 「提案一覧」画面用：過去の提案バッチ（1回のAI呼び出し＝3候補＋推薦理由等）を
// 新しい順に返す。post_history（候補ごとのライフサイクル）とは別に、
// AIが出した生の提案ログをそのまま振り返れるようにするための一覧。
export async function listAgentProposals(limit = DEFAULT_LIST_LIMIT) {
  const [rows, context] = await Promise.all([
    listAgentProposalRows(limit),
    getBrandContext(),
  ]);
  return Promise.all(
    rows.map((proposal) =>
      addSafetyWarnings(proposal, context.operatingGuide),
    ),
  );
}

export async function getAgentProposal(id: string) {
  const rows = await getDb()
    .select()
    .from(agentProposals)
    .where(eq(agentProposals.id, id));
  if (rows.length === 0) throw new Error(`agent_proposals id=${id} が見つかりません。`);
  const context = await getBrandContext();
  return addSafetyWarnings(rows[0], context.operatingGuide);
}

// agent_proposals.approvalStatus は「この提案バッチ全体を最後にどう扱ったか」の
// 概要フラグ。実際の状態管理（提案中/承認/却下/画像作成済み/投稿済み）は
// post_history側の対応する行で行う（③候補それぞれが独立して自由に遷移できる）。
export async function updateProposalApproval(
  id: string,
  payload: UpdateApprovalPayload,
) {
  const proposal = await getAgentProposal(id);

  if (
    payload.approvalStatus === "approved" &&
    typeof payload.approvedCandidateIndex === "number"
  ) {
    const warnings = proposal.safetyWarnings.filter(
      (warning) =>
        warning.candidateIndex === payload.approvedCandidateIndex,
    );
    if (warnings.length > 0) {
      throw new Error(
        `未確認情報が${warnings.length}件あるため承認できません。提案内容またはブランドコンテキストを修正してください。`,
      );
    }
  }

  // agent_proposals の承認状態更新と post_history への反映は、どちらかだけが
  // 成功して食い違う状態(例:承認済みなのにpost_history側に反映されていない)を
  // 防ぐため、1つのトランザクションにまとめる。
  return getDb().transaction(async (tx) => {
    const [updated] = await tx
      .update(agentProposals)
      .set({
        approvalStatus: payload.approvalStatus,
        approvedCandidateIndex: payload.approvedCandidateIndex ?? null,
      })
      .where(eq(agentProposals.id, id))
      .returning();

    if (
      payload.approvalStatus === "approved" &&
      typeof payload.approvedCandidateIndex === "number"
    ) {
      const result = await updatePostHistoryByCandidate(
        proposal.id,
        payload.approvedCandidateIndex,
        "approved",
        tx,
      );
      if (!result) {
        throw new Error(
          "承認対象の候補がpost_historyに見つかりません(この提案は候補登録前の古いデータの可能性があります)。",
        );
      }
    } else if (payload.approvalStatus === "rejected") {
      // 「3案すべて却下する」：この提案由来の全候補を却下にする。
      await updateAllPostHistoryForProposal(proposal.id, "rejected", tx);
    }

    return updated;
  });
}
