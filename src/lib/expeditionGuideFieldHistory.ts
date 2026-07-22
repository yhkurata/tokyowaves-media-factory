// 会場・集合場所・解散場所・時間・引率者は毎回微妙に違うため厳密な固定リストには
// しにくいが、実際によく使う値をワンタップで選べるように、要項を作成するたびに
// 入力値を履歴として自動的に覚えておく（事前にリストを用意する必要がない）。

const STORAGE_KEY = "tokyowaves-media-factory:expedition-guide-history";
const MAX_ENTRIES_PER_FIELD = 8;

export type ExpeditionGuideHistoryField =
  | "venue"
  | "meetingPlace"
  | "dismissalTime"
  | "leaders";

type HistoryStore = Partial<Record<ExpeditionGuideHistoryField, string[]>>;

function loadStore(): HistoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: HistoryStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorageが使えない環境（プライベートブラウズ等）では黙って諦める
  }
}

export function recordExpeditionGuideFieldHistory(
  field: ExpeditionGuideHistoryField,
  value: string,
) {
  const trimmed = value.trim();
  if (trimmed === "") return;
  const store = loadStore();
  const existing = (store[field] ?? []).filter((v) => v !== trimmed);
  store[field] = [trimmed, ...existing].slice(0, MAX_ENTRIES_PER_FIELD);
  saveStore(store);
}

export function getExpeditionGuideFieldHistory(
  field: ExpeditionGuideHistoryField,
): string[] {
  return loadStore()[field] ?? [];
}
