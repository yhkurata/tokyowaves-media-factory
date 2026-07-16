// LINEスタンプ制作機能のデータ構造。
// 大会データと同じくサーバーDBは持たず、ローカルのJSONプロジェクトファイル
// （画像はbase64で埋め込み）として保存・読み込みする。

export type StickerGender = "boy" | "girl" | "unspecified";

// AIが一括企画する1件分のスタンプ案。セリフの言い換えだけでなく、
// 表情・ポーズ・背景演出まで含めて毎回変化をつけるための構造化データ。
export interface StickerPlan {
  phrase: string;
  scene: string; // 利用場面
  emotion: string; // 感情
  expression: string; // 表情
  pose: string; // ポーズ
  handGesture: string; // 手の動き
  bodyOrientation: string; // 体の向き
  hasBall: boolean; // 水球ボールの有無
  props: string; // 小物
  backgroundEffect: string; // 背景演出
  splash: string; // 水しぶき表現
  effectLines: string; // 効果線
  textStyle: string; // 文字の雰囲気
  differentiationNote: string; // 既存スタンプ・他候補との差別化ポイント
  imageGenPrompt: string; // 英語。ChatGPTにそのまま貼り付ける画像編集プロンプト
}

export type StickerCandidateStatus =
  | "proposed" // AI提案直後
  | "adopted" // 採用（ChatGPTで生成予定/生成中）
  | "rejected" // 却下（履歴として残す）
  | "completed"; // 完成画像アップロード済み

export interface StickerCandidate {
  id: string;
  batchId: string;
  baseStickerIds: string[];
  plan: StickerPlan; // 生成後も全項目editable
  status: StickerCandidateStatus;
  completedImageDataUrl: string | null; // ChatGPTで生成した完成画像（原寸）
  lineFormattedImageDataUrl: string | null; // 370x320以内・PNG透過に変換済み
  createdAt: string;
}

// 一括生成1回分の呼び出しログ（自由指示・件数・概算費用）。
export interface StickerBatch {
  id: string;
  instruction: string;
  requestedCount: 8 | 16 | 24 | 32 | 40;
  baseStickerIds: string[];
  estimatedCostYen: string; // 表示用の概算文字列（例："約60〜100円（概算）"）
  createdAt: string;
}

// キャラクターの統一感を保つための設定。プロンプト生成の都度これを参照する。
// characterFeatures/face/hairStyle/hat/logo/colorScheme/artStyle/mustNotChange は
// 参考画像からAIが自動解析して埋められる項目（手修正も可能）。
export interface CharacterSettings {
  characterFeatures: string; // キャラクター特徴（全般）
  face: string; // 顔の特徴
  hairStyle: string;
  hat: string;
  logo: string;
  colorScheme: string;
  artStyle: string;
  expressionNotes: string;
  boyGirlDifference: string;
  mustNotChange: string[];
  freeNotes: string;
  updatedAt: string;
}

// AIによる企画生成は、キャラクター設定が実質空のまま実行しても意味のある
// 差別化ができないため、事前にこれで判定してAPI呼び出し自体をブロックする。
export function isCharacterSettingsEmpty(settings: CharacterSettings): boolean {
  return (
    settings.characterFeatures.trim() === "" &&
    settings.face.trim() === "" &&
    settings.hairStyle.trim() === "" &&
    settings.hat.trim() === "" &&
    settings.logo.trim() === "" &&
    settings.colorScheme.trim() === "" &&
    settings.artStyle.trim() === "" &&
    settings.mustNotChange.length === 0
  );
}

export interface StickerLibraryItem {
  id: string;
  imageDataUrl: string;
  label: string; // AIがアップロード時に自動認識、手修正可
  gender: StickerGender;
  createdAt: string;
}

export type StickerSnapshot = Omit<StickerProjectData, "formatVersion" | "savedAt">;

export interface StickerProjectData {
  formatVersion: 1;
  savedAt: string;
  characterSettings: CharacterSettings;
  library: StickerLibraryItem[];
  batches: StickerBatch[];
  candidates: StickerCandidate[];
}

export function createEmptyCharacterSettings(): CharacterSettings {
  return {
    characterFeatures: "",
    face: "",
    hairStyle: "",
    hat: "",
    logo: "",
    colorScheme: "",
    artStyle: "",
    expressionNotes: "",
    boyGirlDifference: "",
    mustNotChange: [],
    freeNotes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function createEmptyStickerProjectData(): StickerProjectData {
  return {
    formatVersion: 1,
    savedAt: new Date(0).toISOString(),
    characterSettings: createEmptyCharacterSettings(),
    library: [],
    batches: [],
    candidates: [],
  };
}
