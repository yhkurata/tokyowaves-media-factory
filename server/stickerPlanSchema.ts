export interface StickerPlanResult {
  phrase: string;
  scene: string;
  emotion: string;
  expression: string;
  pose: string;
  handGesture: string;
  bodyOrientation: string;
  hasBall: boolean;
  props: string;
  backgroundEffect: string;
  splash: string;
  effectLines: string;
  textStyle: string;
  differentiationNote: string;
  imageGenPrompt: string;
}

export interface StickerPlanBatchResult {
  plans: StickerPlanResult[];
}

const STICKER_PLAN_ITEM_SCHEMA = {
  type: "object",
  properties: {
    phrase: { type: "string" },
    scene: { type: "string" },
    emotion: { type: "string" },
    expression: { type: "string" },
    pose: { type: "string" },
    handGesture: { type: "string" },
    bodyOrientation: { type: "string" },
    hasBall: { type: "boolean" },
    props: { type: "string" },
    backgroundEffect: { type: "string" },
    splash: { type: "string" },
    effectLines: { type: "string" },
    textStyle: { type: "string" },
    differentiationNote: { type: "string" },
    imageGenPrompt: { type: "string" },
  },
  required: [
    "phrase",
    "scene",
    "emotion",
    "expression",
    "pose",
    "handGesture",
    "bodyOrientation",
    "hasBall",
    "props",
    "backgroundEffect",
    "splash",
    "effectLines",
    "textStyle",
    "differentiationNote",
    "imageGenPrompt",
  ],
  additionalProperties: false,
} as const;

// candidatesの件数はユーザー指定（8/16/24/32/40）で可変のため、
// minItems/maxItemsは付けない（Claudeの構造化出力は0/1以外のminItems/maxItemsを
// 拒否するプラットフォーム制約があるため）。件数の一致はプロンプト指示＋
// 呼び出し側の実行時チェックで担保する。
export const STICKER_PLAN_BATCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    plans: {
      type: "array",
      items: STICKER_PLAN_ITEM_SCHEMA,
    },
  },
  required: ["plans"],
  additionalProperties: false,
} as const;
