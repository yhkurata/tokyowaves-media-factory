export interface StickerCharacterAnalysisResult {
  characterFeatures: string;
  face: string;
  hairStyle: string;
  hat: string;
  logo: string;
  colorScheme: string;
  artStyle: string;
  mustNotChange: string[];
}

export const STICKER_CHARACTER_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    characterFeatures: { type: "string" },
    face: { type: "string" },
    hairStyle: { type: "string" },
    hat: { type: "string" },
    logo: { type: "string" },
    colorScheme: { type: "string" },
    artStyle: { type: "string" },
    mustNotChange: { type: "array", items: { type: "string" } },
  },
  required: [
    "characterFeatures",
    "face",
    "hairStyle",
    "hat",
    "logo",
    "colorScheme",
    "artStyle",
    "mustNotChange",
  ],
  additionalProperties: false,
} as const;
