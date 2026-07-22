import type { ExpeditionGuideInput } from "../types/expeditionGuide";

const STORAGE_KEY = "tokyowaves-media-factory:expedition-guide";

export function saveExpeditionGuideSnapshot(input: ExpeditionGuideInput) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // localStorageが使えない環境（プライベートブラウズ等）では黙って諦める
  }
}

export function loadExpeditionGuideSnapshot(): ExpeditionGuideInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExpeditionGuideInput;
  } catch {
    return null;
  }
}
