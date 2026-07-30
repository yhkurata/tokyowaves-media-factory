import { useEffect, useState } from "react";
import { listAgentProposals, updateProposalApproval } from "../../lib/instagramAiApi";
import type { AgentProposal, ApprovalStatus } from "../../types/instagramAi";
import { ProposalCandidateCard } from "./ProposalCandidateCard";
import { formatCostLabel, formatTokenDetail } from "../../lib/instagramCostFormat";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "未対応",
  approved: "承認済み",
  rejected: "却下済み",
  revised: "修正依頼",
};

const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  revised: "bg-blue-100 text-blue-700",
};

function ProposalRow({
  proposal,
  isOpen,
  onToggle,
  onUpdate,
}: {
  proposal: AgentProposal;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (updated: AgentProposal) => void;
}) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const recommended = proposal.candidates[proposal.recommendedCandidateIndex];

  const handleApprove = async (candidateIndex: number) => {
    setApproving(true);
    setError("");
    try {
      const updated = await updateProposalApproval(proposal.id, {
        approvalStatus: "approved",
        approvedCandidateIndex: candidateIndex,
      });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認処理に失敗しました。");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setApproving(true);
    setError("");
    try {
      const updated = await updateProposalApproval(proposal.id, {
        approvalStatus: "rejected",
      });
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "却下処理に失敗しました。");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{formatDateTime(proposal.requestedAt)}</span>
            <span
              className={`rounded px-1.5 py-0.5 font-semibold ${APPROVAL_STATUS_COLORS[proposal.approvalStatus]}`}
            >
              {APPROVAL_STATUS_LABELS[proposal.approvalStatus]}
            </span>
            <span className="text-gray-400">{formatCostLabel(proposal)}</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">
            {proposal.userInstruction}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            おすすめ：{recommended.plan.title}
          </p>
        </div>
        <span className="shrink-0 text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          <p className="text-xs text-gray-400">{formatTokenDetail(proposal)}</p>

          {proposal.openQuestions.length > 0 && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3">
              <p className="text-xs font-bold text-yellow-800">要確認</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-yellow-800">
                {proposal.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {proposal.operationalSuggestions.length > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-bold text-blue-800">改善提案</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-blue-800">
                {proposal.operationalSuggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
            <span className="font-bold">推薦理由：</span>
            {proposal.recommendationReasoning}
          </div>

          <div className="space-y-3">
            {proposal.candidates.map((candidate, index) => (
              <ProposalCandidateCard
                key={index}
                candidate={candidate}
                isRecommended={index === proposal.recommendedCandidateIndex}
                isApproved={
                  proposal.approvalStatus === "approved" &&
                  proposal.approvedCandidateIndex === index
                }
                approveDisabled={approving || proposal.approvalStatus === "approved"}
                onApprove={() => handleApprove(index)}
              />
            ))}
          </div>

          {proposal.approvalStatus === "pending" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReject}
                disabled={approving}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                3案すべて却下する
              </button>
            </div>
          )}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function ProposalListScreen() {
  const [proposals, setProposals] = useState<AgentProposal[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listAgentProposals()
      .then(setProposals)
      .catch((err) => setLoadError(err.message));
  }, []);

  const handleUpdate = (updated: AgentProposal) => {
    setProposals(
      (prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? prev,
    );
  };

  if (loadError) {
    return <p className="text-sm font-semibold text-red-600">{loadError}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">提案一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          過去にAIが生成した提案（1回の呼び出しごとに3案＋推薦理由）をいつでも振り返れます。
        </p>
      </div>

      <div className="space-y-2">
        {proposals === null && (
          <p className="text-sm text-gray-400">読み込み中...</p>
        )}
        {proposals?.length === 0 && (
          <p className="text-sm text-gray-400">
            まだ提案がありません。「次の投稿を提案」タブでAIに提案してもらってください。
          </p>
        )}
        {proposals?.map((proposal) => (
          <ProposalRow
            key={proposal.id}
            proposal={proposal}
            isOpen={openId === proposal.id}
            onToggle={() => setOpenId(openId === proposal.id ? null : proposal.id)}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
