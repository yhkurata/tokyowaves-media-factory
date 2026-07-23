import type { ExpeditionGuideInput } from "./expeditionGuide";

// 「この場所・この時間ならこの内容」というまるごとテンプレート。
// フォーム全体を1回の選択で復元できるようにするためのもの。
export interface ExpeditionGuideTemplate {
  id: string;
  name: string; // 例：「大宮公園遠征」「埼玉栄遠征」
  input: ExpeditionGuideInput;
  updatedAt: string;
}
