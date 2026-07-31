import type { CharacterSettings, StickerPlan } from "../types/sticker";
import { dataUrlMediaType } from "./imageFile";
import type { ApiCallCostEstimate } from "./apiCostEstimate";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `リクエストに失敗しました（${res.status}）。`);
  }
  const body = await res.json();
  return body.result as T;
}

function toImagePayload(dataUrl: string) {
  const mediaType = dataUrlMediaType(dataUrl);
  return {
    mediaType: mediaType === "image/jpeg" ? "image/jpeg" : "image/png",
    dataBase64: dataUrl.split(",")[1] ?? "",
  };
}

export interface RecognizedSticker {
  index: number;
  recognizedPhrase: string;
}

// このAPIはClaude APIを呼び出すため、実行するたびに料金が発生する。
export async function recognizeStickerPhrases(
  imageDataUrls: string[],
): Promise<RecognizedSticker[]> {
  const res = await fetch("/api/sticker-recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: imageDataUrls.map(toImagePayload) }),
  });
  const result = await handleResponse<{ stickers: RecognizedSticker[] }>(res);
  return result.stickers;
}

// 実行前確認ダイアログ用。count_tokensのみを呼ぶため課金は発生しない。
export async function estimateStickerRecognizeCost(
  imageDataUrls: string[],
): Promise<ApiCallCostEstimate> {
  const res = await fetch("/api/sticker-recognize-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: imageDataUrls.map(toImagePayload) }),
  });
  return handleResponse<ApiCallCostEstimate>(res);
}

export type CharacterAnalysisResult = Omit<
  CharacterSettings,
  "expressionNotes" | "boyGirlDifference" | "freeNotes" | "updatedAt"
>;

// このAPIはClaude APIを呼び出すため、実行するたびに料金が発生する。
export async function analyzeCharacterFromImages(
  imageDataUrls: string[],
): Promise<CharacterAnalysisResult> {
  const res = await fetch("/api/sticker-character-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: imageDataUrls.map(toImagePayload) }),
  });
  return handleResponse<CharacterAnalysisResult>(res);
}

// 実行前確認ダイアログ用。count_tokensのみを呼ぶため課金は発生しない。
export async function estimateCharacterAnalysisCost(
  imageDataUrls: string[],
): Promise<ApiCallCostEstimate> {
  const res = await fetch("/api/sticker-character-analysis-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: imageDataUrls.map(toImagePayload) }),
  });
  return handleResponse<ApiCallCostEstimate>(res);
}

// このAPIはClaude APIを呼び出すため、実行するたびに料金が発生する。
export async function generateStickerPlans(params: {
  instruction: string;
  requestedCount: number;
  characterSettings: CharacterSettings;
  referenceImageDataUrls: string[];
  existingCandidates: { phrase: string; scene: string }[];
}): Promise<StickerPlan[]> {
  const res = await fetch("/api/sticker-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instruction: params.instruction,
      requestedCount: params.requestedCount,
      characterSettings: params.characterSettings,
      referenceImages: params.referenceImageDataUrls.map(toImagePayload),
      existingCandidates: params.existingCandidates,
    }),
  });
  const result = await handleResponse<{ plans: StickerPlan[] }>(res);
  return result.plans;
}

// 実行前確認ダイアログ用。count_tokensのみを呼ぶため課金は発生しない。
export async function estimateStickerPlanCost(params: {
  instruction: string;
  requestedCount: number;
  characterSettings: CharacterSettings;
  referenceImageDataUrls: string[];
  existingCandidates: { phrase: string; scene: string }[];
}): Promise<ApiCallCostEstimate> {
  const res = await fetch("/api/sticker-plan-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instruction: params.instruction,
      requestedCount: params.requestedCount,
      characterSettings: params.characterSettings,
      referenceImages: params.referenceImageDataUrls.map(toImagePayload),
      existingCandidates: params.existingCandidates,
    }),
  });
  return handleResponse<ApiCallCostEstimate>(res);
}
