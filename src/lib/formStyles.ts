// AIが自動入力できなかった（＝空欄の）フィールドを、黄色い枠線・背景で
// 視覚的に「要確認」だと分かるようにする共通スタイル。
// 埋まっているフィールドは通常のグレー枠のまま。
export const NEEDS_REVIEW_FIELD_CLASS = "border-yellow-400 bg-yellow-50";
export const FILLED_FIELD_CLASS = "border-gray-300";

export function reviewFieldClass(value: string): string {
  return value.trim() === "" ? NEEDS_REVIEW_FIELD_CLASS : FILLED_FIELD_CLASS;
}
