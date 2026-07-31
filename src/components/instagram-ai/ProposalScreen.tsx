import { useEffect, useState } from "react";
import {
  listAgentProposals,
  proposeNextPost,
  estimateProposeCost,
  updateProposalApproval,
} from "../../lib/instagramAiApi";
import type {
  AgentProposal,
  AiProvider,
  ProposeCostEstimate,
} from "../../types/instagramAi";
import { ProposalCandidateCard } from "./ProposalCandidateCard";
import {
  formatCostLabel,
  formatTokenDetail,
  formatEstimateLabel,
  formatEstimateDetail,
} from "../../lib/instagramCostFormat";
import { isAdminMode } from "../../lib/adminMode";

const DEFAULT_INSTRUCTION = "次のInstagram投稿を考えて";

// 一般ユーザーは実行前に必ず概算コストの確認を挟む（Media Factory全体のAI課金
// ルールに統一）。管理者（?admin=1）はこの確認をスキップして即実行できる。
type RequestState = "idle" | "estimating" | "confirming" | "loading" | "error";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProposalScreen() {
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<AgentProposal | null>(null);
  const [estimate, setEstimate] = useState<ProposeCostEstimate | null>(null);
  const [approving, setApproving] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const admin = isAdminMode();

  // 起動時、DBに保存済みの最新の提案（＝直近のAI呼び出し結果）をそのまま
  // 表示する。AI APIは呼ばないため、リロードしても無料で前回の続きから見れる。
  useEffect(() => {
    listAgentProposals()
      .then((list) => {
        if (list.length > 0) setProposal(list[0]);
      })
      .catch(() => {
        // 起動時の読み込み失敗は静かに諦める（「提案してもらう」で新規生成は可能なため）。
      })
      .finally(() => setLoadingLatest(false));
  }, []);

  const runPropose = async () => {
    setRequestState("loading");
    setError("");
    try {
      const result = await proposeNextPost(instruction, provider);
      setProposal(result);
      setRequestState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提案の生成に失敗しました。");
      setRequestState("error");
    }
  };

  // 「提案してもらう」クリック時の入口。管理者は確認なしで即実行、一般ユーザーは
  // 概算コストを取得してから確認ダイアログを挟む。
  const handleClickPropose = async () => {
    if (admin) {
      void runPropose();
      return;
    }
    setRequestState("estimating");
    setError("");
    try {
      const result = await estimateProposeCost(instruction, provider);
      setEstimate(result);
    } catch {
      // 見積もり自体が失敗しても、確認ダイアログは概算不明の表示で出す
      // （実行そのものを不能にはしない）。
      setEstimate(null);
    }
    setRequestState("confirming");
  };

  const handleApprove = async (candidateIndex: number) => {
    if (!proposal) return;
    setApproving(true);
    try {
      const updated = await updateProposalApproval(proposal.id, {
        approvalStatus: "approved",
        approvedCandidateIndex: candidateIndex,
      });
      setProposal(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認処理に失敗しました。");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    setApproving(true);
    try {
      const updated = await updateProposalApproval(proposal.id, {
        approvalStatus: "rejected",
      });
      setProposal(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "却下処理に失敗しました。");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">次の投稿を提案</h1>
        <p className="mt-1 text-sm text-gray-500">
          ブランドコンテキストと投稿履歴を踏まえて、AIが3案を考えて1つを推薦します。
        </p>
      </div>

      <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-gray-700">
            比較するAI
          </legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="ai-provider"
                value="anthropic"
                checked={provider === "anthropic"}
                onChange={() => setProvider("anthropic")}
                disabled={requestState !== "idle" && requestState !== "error"}
              />
              Claude（従来版・既定）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="ai-provider"
                value="openai"
                checked={provider === "openai"}
                onChange={() => setProvider("openai")}
                disabled={requestState !== "idle" && requestState !== "error"}
              />
              GPT（比較版）
            </label>
          </div>
        </fieldset>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        {requestState !== "confirming" && requestState !== "estimating" && (
          <button
            type="button"
            onClick={() => void handleClickPropose()}
            disabled={instruction.trim() === ""}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            提案してもらう
          </button>
        )}

        {requestState === "estimating" && (
          <p className="text-sm text-gray-500">概算コストを計算しています...</p>
        )}

        {requestState === "confirming" && (
          <div className="space-y-2 rounded-md bg-yellow-50 p-3">
            <p className="text-sm font-semibold text-yellow-900">
              {estimate
                ? formatEstimateLabel(estimate)
                : "推定コストを取得できませんでした（実行は可能です）"}
            </p>
            {estimate && (
              <p className="text-xs text-yellow-700">{formatEstimateDetail(estimate)}</p>
            )}
            <p className="text-xs text-yellow-800">
              {provider === "openai" ? "OpenAI API" : "Claude API"}
              を呼び出します。実行しますか？
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void runPropose()}
                className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                実行する
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequestState("idle");
                  setEstimate(null);
                }}
                className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {requestState === "loading" && (
          <p className="text-sm text-gray-500">
            AIが考えています...（拡張思考を使うため数十秒〜数分かかります）
          </p>
        )}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>

      {loadingLatest && (
        <p className="text-sm text-gray-400">前回の提案を読み込み中...</p>
      )}

      {proposal && (
        <div className="space-y-4">
          {requestState === "idle" && (
            <p className="text-xs text-gray-400">
              直近の提案を表示しています（{formatDateTime(proposal.requestedAt)}）。過去の提案は「提案一覧」タブから見られます。
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">
              このAPI呼び出しのコスト：{formatCostLabel(proposal)}
            </span>
            <span className="text-gray-500">
              {proposal.aiProvider === "openai" ? "GPT" : "Claude"}
              {proposal.aiModel ? `（${proposal.aiModel}）` : ""}
            </span>
            <span className="text-gray-400">
              （{formatTokenDetail(proposal)}）
            </span>
          </div>

          {(proposal.safetyWarnings?.length ?? 0) > 0 && (
            <div className="rounded-md border-2 border-red-400 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-800">
                未確認の日時・料金・申込方法などが含まれています
              </p>
              <p className="mt-1 text-xs text-red-700">
                該当する案は承認できません。ブランドコンテキストへ確定情報を登録するか、提案内容を修正してください。
              </p>
            </div>
          )}

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
                safetyWarnings={(proposal.safetyWarnings ?? [])
                  .filter((warning) => warning.candidateIndex === index)
                  .map((warning) => warning.message)}
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
          {proposal.approvalStatus === "approved" && (
            <p className="text-sm font-semibold text-green-700">
              承認しました。「投稿一覧」タブで状態（画像作成済み・投稿済み等）を更新できます。
            </p>
          )}
          {proposal.approvalStatus === "rejected" && (
            <p className="text-sm font-semibold text-gray-500">
              この提案は却下しました。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
