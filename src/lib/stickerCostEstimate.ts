// Claude API呼び出し前に表示する概算料金の見積もり。
//
// 実際の課金は「拡張思考（adaptive thinking）」の使用量に応じて変動し、
// 事前に正確な値を出すことはできない。ここでの数値はあくまで典型的な
// トークン消費量を仮定した目安（幅のある概算）であり、正確な保証ではない。
// 実行後に実際の請求額を確認しながら、必要に応じて下の仮定値を調整すること。

const OPUS_INPUT_USD_PER_MTOK = 5;
const OPUS_OUTPUT_USD_PER_MTOK = 25;
const JPY_PER_USD = 155; // 概算用の目安レート

const FIXED_INPUT_TOKENS = 800; // システムプロンプト＋キャラクター設定＋指示文
const TOKENS_PER_REFERENCE_IMAGE = 1500; // 参考画像1枚あたりの視覚トークン目安

// 1件（1スタンプ企画）あたりの出力トークン目安。拡張思考の消費量が
// 案件によって大きく変動するため、少なめ/多めの2パターンで幅を持たせる。
const OUTPUT_TOKENS_PER_STICKER_LOW = 350;
const OUTPUT_TOKENS_PER_STICKER_HIGH = 750;

export interface CostEstimate {
  lowYen: number;
  highYen: number;
  label: string; // 表示用（例："約60〜120円（概算）"）
}

function roundTo10(yen: number): number {
  return Math.max(10, Math.round(yen / 10) * 10);
}

function usdToYen(usd: number): number {
  return usd * JPY_PER_USD;
}

export function estimateBatchCost(
  requestedCount: number,
  referenceImageCount: number,
): CostEstimate {
  const inputTokens =
    FIXED_INPUT_TOKENS + referenceImageCount * TOKENS_PER_REFERENCE_IMAGE;
  const inputCostUsd = (inputTokens / 1_000_000) * OPUS_INPUT_USD_PER_MTOK;

  const outputTokensLow = requestedCount * OUTPUT_TOKENS_PER_STICKER_LOW;
  const outputTokensHigh = requestedCount * OUTPUT_TOKENS_PER_STICKER_HIGH;
  const outputCostLowUsd =
    (outputTokensLow / 1_000_000) * OPUS_OUTPUT_USD_PER_MTOK;
  const outputCostHighUsd =
    (outputTokensHigh / 1_000_000) * OPUS_OUTPUT_USD_PER_MTOK;

  const lowYen = roundTo10(usdToYen(inputCostUsd + outputCostLowUsd));
  const highYen = roundTo10(usdToYen(inputCostUsd + outputCostHighUsd));

  return {
    lowYen,
    highYen,
    label: `約${lowYen}〜${highYen}円（概算・保証値ではありません）`,
  };
}

// アップロード時のセリフ自動認識（画像のみ・出力は短いラベル文字列）は
// バッチ企画よりずっと軽い呼び出しになる。
export function estimateRecognizeCost(imageCount: number): CostEstimate {
  const inputTokens = 300 + imageCount * TOKENS_PER_REFERENCE_IMAGE;
  const outputTokens = imageCount * 60;
  const usd =
    (inputTokens / 1_000_000) * OPUS_INPUT_USD_PER_MTOK +
    (outputTokens / 1_000_000) * OPUS_OUTPUT_USD_PER_MTOK;
  const yen = roundTo10(usdToYen(usd));
  return {
    lowYen: yen,
    highYen: yen,
    label: `約${yen}円以内（概算・保証値ではありません）`,
  };
}

// キャラクター設定のAI解析（画像を見て特徴・禁止事項などをまとめて出力）。
export function estimateCharacterAnalysisCost(imageCount: number): CostEstimate {
  const inputTokens = 400 + imageCount * TOKENS_PER_REFERENCE_IMAGE;
  const outputTokens = 600;
  const usd =
    (inputTokens / 1_000_000) * OPUS_INPUT_USD_PER_MTOK +
    (outputTokens / 1_000_000) * OPUS_OUTPUT_USD_PER_MTOK;
  const yen = roundTo10(usdToYen(usd));
  return {
    lowYen: yen,
    highYen: yen,
    label: `約${yen}円以内（概算・保証値ではありません）`,
  };
}
