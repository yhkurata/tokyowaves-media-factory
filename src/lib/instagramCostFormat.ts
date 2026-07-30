import type { AgentProposal, ProposeCostEstimate } from "../types/instagramAi";

// 提案1件（＝Claude API呼び出し1回分）の実測トークン数から計算した概算コストを
// 表示用の文字列にする。未知のモデル（料金表に無いANTHROPIC_MODEL指定時）は
// costJpy/costUsdがnullになるため、その場合は不明である旨を表示する。
export function formatCostLabel(proposal: AgentProposal): string {
  if (proposal.costJpy == null || proposal.costUsd == null) {
    return "コスト不明（未対応モデルのため計算できません）";
  }
  const jpy = proposal.costJpy.toLocaleString("ja-JP", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
  const usd = proposal.costUsd.toFixed(4);
  return `約¥${jpy}（$${usd}）`;
}

export function formatTokenDetail(proposal: AgentProposal): string {
  const parts = [`入力${proposal.inputTokens ?? "?"}`, `出力${proposal.outputTokens ?? "?"}`];
  if (proposal.cacheReadInputTokens > 0) {
    parts.push(`キャッシュ読込${proposal.cacheReadInputTokens}`);
  }
  if (proposal.cacheCreationInputTokens > 0) {
    parts.push(`キャッシュ書込${proposal.cacheCreationInputTokens}`);
  }
  return `${parts.join(" / ")}トークン`;
}

// 実行前確認ダイアログ用：「今回の推定料金：約○円」
export function formatEstimateLabel(estimate: ProposeCostEstimate): string {
  if (estimate.costJpy == null) {
    return "推定コスト不明（未対応モデルのため計算できません）";
  }
  const jpy = estimate.costJpy.toLocaleString("ja-JP", {
    maximumFractionDigits: 0,
  });
  return `今回の推定料金：約${jpy}円`;
}

export function formatEstimateDetail(estimate: ProposeCostEstimate): string {
  const outputNote = estimate.isOutputEstimateFromHistory
    ? "過去の実行実績の平均"
    : "初回実行のため既定値";
  return `入力${estimate.estimatedInputTokens}トークン（実測）／出力約${estimate.estimatedOutputTokens}トークン（${outputNote}）`;
}
