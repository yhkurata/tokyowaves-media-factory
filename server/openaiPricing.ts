import type { ResponseUsage } from "openai/resources/responses/responses";

interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-5.6-sol": { inputPerMTok: 5, outputPerMTok: 30 },
  "gpt-5.6": { inputPerMTok: 5, outputPerMTok: 30 },
  "gpt-5.6-terra": { inputPerMTok: 2.5, outputPerMTok: 15 },
  "gpt-5.6-luna": { inputPerMTok: 1, outputPerMTok: 6 },
};

const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;
const DEFAULT_USD_JPY_RATE = 150;

function usdJpyRate(): number {
  return Number(process.env.USD_JPY_RATE) || DEFAULT_USD_JPY_RATE;
}

function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cachedTokens = 0,
): number | null {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return null;
  const regularInputTokens = Math.max(
    0,
    inputTokens - cacheWriteTokens - cachedTokens,
  );
  return (
    (regularInputTokens / 1_000_000) * pricing.inputPerMTok +
    (cacheWriteTokens / 1_000_000) *
      pricing.inputPerMTok *
      CACHE_WRITE_MULTIPLIER +
    (cachedTokens / 1_000_000) *
      pricing.inputPerMTok *
      CACHE_READ_MULTIPLIER +
    (outputTokens / 1_000_000) * pricing.outputPerMTok
  );
}

export interface OpenAIUsageCost {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cachedTokens: number;
  costUsd: number | null;
  costJpy: number | null;
}

export function calculateOpenAIUsageCost(
  model: string,
  usage: ResponseUsage,
): OpenAIUsageCost {
  const cacheWriteTokens = usage.input_tokens_details.cache_write_tokens ?? 0;
  const cachedTokens = usage.input_tokens_details.cached_tokens ?? 0;
  const costUsd = calculateCostUsd(
    model,
    usage.input_tokens,
    usage.output_tokens,
    cacheWriteTokens,
    cachedTokens,
  );
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheWriteTokens,
    cachedTokens,
    costUsd,
    costJpy: costUsd === null ? null : costUsd * usdJpyRate(),
  };
}

export function estimateOpenAICost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): { costJpy: number | null } {
  const costUsd = calculateCostUsd(
    model,
    estimatedInputTokens,
    estimatedOutputTokens,
  );
  return {
    costJpy: costUsd === null ? null : costUsd * usdJpyRate(),
  };
}
