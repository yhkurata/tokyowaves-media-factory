import { useState } from "react";
import type { ProposalCandidate } from "../../types/instagramAi";
import { FORMAT_LABELS, PURPOSE_LABELS } from "../../types/instagramAi";
import { PostPlanDetails } from "./PostPlanDetails";

type Props = {
  candidate: ProposalCandidate;
  isRecommended: boolean;
  isApproved: boolean;
  onApprove: () => void;
  approveDisabled: boolean;
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(count)}
      <span className="text-gray-300">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export function ProposalCandidateCard({
  candidate,
  isRecommended,
  isApproved,
  onApprove,
  approveDisabled,
}: Props) {
  const [expanded, setExpanded] = useState(isRecommended);
  const { plan } = candidate;

  return (
    <div
      className={`rounded-lg border bg-white ${
        isRecommended ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {isRecommended && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                おすすめ
              </span>
            )}
            {isApproved && (
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                承認済み
              </span>
            )}
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {FORMAT_LABELS[candidate.format]}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {candidate.category}
            </span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {PURPOSE_LABELS[plan.purpose]}
            </span>
          </div>
          <h3 className="font-bold text-gray-900">{plan.title}</h3>
          <p className="mt-0.5 text-sm text-gray-600">
            <Stars count={plan.priorityStars} /> {plan.priorityReason}
          </p>
        </div>
        <button
          type="button"
          onClick={onApprove}
          disabled={approveDisabled}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          この案を承認
        </button>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full border-t border-gray-100 px-4 py-2 text-left text-xs font-semibold text-gray-500 hover:bg-gray-50"
      >
        {expanded ? "▲ 詳細を閉じる" : "▼ 詳細を見る（デザイン指示・キャプション・画像生成プロンプトなど）"}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4">
          <PostPlanDetails
            plan={plan}
            formatReasoning={candidate.formatReasoning}
            noveltyNote={candidate.noveltyNote}
          />
        </div>
      )}
    </div>
  );
}
