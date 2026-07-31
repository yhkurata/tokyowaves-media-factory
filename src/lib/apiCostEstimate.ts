// AI呼び出し前の確認ダイアログ（「今回の推定料金：約○円」）用の共通の型・表示整形。
// 大会画像作成・スタンプ制作など、count_tokensベースの見積もりエンドポイントを
// 持つ全ての機能がこの型・関数をそのまま使う（機能ごとに表示形式がばらつかないため）。
export interface ApiCallCostEstimate {
  costJpy: number | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

export function formatEstimateLabel(estimate: ApiCallCostEstimate): string {
  if (estimate.costJpy == null) {
    return "推定コスト不明（未対応モデルのため計算できません）";
  }
  const jpy = estimate.costJpy.toLocaleString("ja-JP", {
    maximumFractionDigits: 0,
  });
  return `今回の推定料金：約${jpy}円`;
}

export function formatEstimateDetail(estimate: ApiCallCostEstimate): string {
  return `入力${estimate.estimatedInputTokens}トークン（実測）／出力約${estimate.estimatedOutputTokens}トークン（既定値の目安）`;
}
