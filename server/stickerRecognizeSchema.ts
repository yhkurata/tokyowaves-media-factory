export interface RecognizedSticker {
  index: number; // 入力画像の並び順（0始まり）
  recognizedPhrase: string; // 画像内に書かれているセリフ（読み取れなければ空文字）
}

export interface StickerRecognizeResult {
  stickers: RecognizedSticker[];
}

export const STICKER_RECOGNIZE_JSON_SCHEMA = {
  type: "object",
  properties: {
    stickers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          recognizedPhrase: { type: "string" },
        },
        required: ["index", "recognizedPhrase"],
        additionalProperties: false,
      },
    },
  },
  required: ["stickers"],
  additionalProperties: false,
} as const;
