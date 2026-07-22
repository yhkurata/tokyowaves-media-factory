// 「保護者向け案内をテンプレートエンジンで基本生成し、AIは任意の強化操作としてのみ
// 呼び出す」機能群（遠征要項AI・今後の練習案内AI/大会案内AI等）で共通利用する
// AI強化レスポンスの形状。LINE用・メール用・印刷用の3形式をまとめて1回で返す。
// 印刷用は見出しボックス表示ができるよう「見出し＋本文」のセクション配列にしてある
// （src/components/print/PrintDocumentTemplate.tsx にそのまま渡せる形）。

export interface GuideDocPrintSection {
  heading: string;
  body: string;
}

export interface GuideDocResult {
  lineText: string;
  emailText: string;
  printTitle: string;
  printDateLabel: string;
  printSections: GuideDocPrintSection[];
}

const PRINT_SECTION_SCHEMA = {
  type: "object",
  properties: {
    heading: { type: "string" },
    body: { type: "string" },
  },
  required: ["heading", "body"],
  additionalProperties: false,
} as const;

// セクション数は内容によって変動するため、配列にminItems/maxItemsは付けない
// （Claudeの構造化出力は0/1以外のminItems/maxItemsを拒否するプラットフォーム制約があるため）。
export const GUIDE_DOC_JSON_SCHEMA = {
  type: "object",
  properties: {
    lineText: { type: "string" },
    emailText: { type: "string" },
    printTitle: { type: "string" },
    printDateLabel: { type: "string" },
    printSections: { type: "array", items: PRINT_SECTION_SCHEMA },
  },
  required: [
    "lineText",
    "emailText",
    "printTitle",
    "printDateLabel",
    "printSections",
  ],
  additionalProperties: false,
} as const;
