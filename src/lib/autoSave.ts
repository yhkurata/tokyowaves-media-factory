import {
  buildProjectData,
  serializeProjectData,
  parseProjectData,
  type ProjectSnapshot,
  type ProjectData,
} from "./projectFile";

const STORAGE_KEY = "tokyowaves-media-factory:autosave";

export function saveAutoSnapshot(snapshot: ProjectSnapshot) {
  try {
    const data = buildProjectData(snapshot);
    localStorage.setItem(STORAGE_KEY, serializeProjectData(data));
  } catch {
    // localStorageが使えない環境（プライベートブラウズ等）では黙って諦める
  }
}

export function loadAutoSnapshot(): ProjectData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseProjectData(raw);
  } catch {
    return null;
  }
}

export function clearAutoSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無視
  }
}
