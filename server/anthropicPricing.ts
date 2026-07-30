// Claude APIの1リクエストあたりの実コストを、レスポンスのusage（実測トークン数）から
// 計算するための料金表。金額はAnthropicの公式1MトークンあたりのUSD単価。
// 新しいモデルを使う場合はここに追記する（未掲載モデルはコスト計算不能として扱う）。
//
// Instagram AI固有の概念（agent_proposals等）を一切含まない汎用モジュール。
// 他のツール（大会画像作成・スタンプ制作等）が実行前コスト見積もりや実行後の
// 実コスト計算を必要とする場合も、このモジュールをそのままimportして使う。
interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-7": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-opus-4-6": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
  "claude-fable-5": { inputPerMTok: 10, outputPerMTok: 50 },
};

// プロンプトキャッシュの書き込み(5分TTL)は入力単価の1.25倍、読み取りは0.1倍で課金される。
// このアプリはcache_control.ttlを指定していない＝常に5分TTLなのでこの倍率で固定でよい。
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

// 為替レートは変動するため.envで上書き可能にする。未設定時は概算値を使う。
const DEFAULT_USD_JPY_RATE = 150;

function usdJpyRate(): number {
  return Number(process.env.USD_JPY_RATE) || DEFAULT_USD_JPY_RATE;
}

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export interface UsageCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  costUsd: number | null;
  costJpy: number | null;
  usdJpyRate: number;
}

// 実行後：レスポンスのusage（実測トークン数）から実際にかかったコストを計算する。
export function calculateUsageCost(model: string, usage: AnthropicUsage): UsageCost {
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  const cacheCreationInputTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadInputTokens = usage.cache_read_input_tokens ?? 0;
  const rate = usdJpyRate();

  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    // 料金表に無いモデル(未知のANTHROPIC_MODEL指定など)はコスト不明として保存する。
    return {
      model,
      inputTokens,
      outputTokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      costUsd: null,
      costJpy: null,
      usdJpyRate: rate,
    };
  }

  const costUsd =
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (cacheCreationInputTokens / 1_000_000) * pricing.inputPerMTok * CACHE_WRITE_MULTIPLIER +
    (cacheReadInputTokens / 1_000_000) * pricing.inputPerMTok * CACHE_READ_MULTIPLIER +
    (outputTokens / 1_000_000) * pricing.outputPerMTok;

  return {
    model,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    costUsd,
    costJpy: costUsd * rate,
    usdJpyRate: rate,
  };
}

// 実行前：一般ユーザー向けの確認ダイアログ「今回の推定料金：約○円」用。
// 入力トークンはcount_tokensによる実測値、出力トークンは呼び出し側が渡す見積もり値
// （通常は過去実行実績の平均）を使う。実行前はキャッシュヒットの有無が分からないため
// キャッシュ割引は考慮せず全額入力単価で計算する（＝実額より高めに出ることはあっても
// 安く見せてしまうことはない、安全側の見積もり）。
export function estimateCostFromTokenCounts(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): { costJpy: number | null } {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return { costJpy: null };
  const costUsd =
    (estimatedInputTokens / 1_000_000) * pricing.inputPerMTok +
    (estimatedOutputTokens / 1_000_000) * pricing.outputPerMTok;
  return { costJpy: costUsd * usdJpyRate() };
}
