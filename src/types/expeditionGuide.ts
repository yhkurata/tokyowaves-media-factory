// 遠征要項AIのデータ構造。
// 基本の生成はテンプレートエンジン（src/lib/expeditionGuideTemplate.ts）が
// APIを呼ばずに行う。AIは任意の「強化」操作としてのみ利用する。
// サーバーDBは持たず、フォーム入力値をlocalStorageに保存するだけの
// シンプルな構成（大会画像作成・スタンプ制作と同じ方針）。

export interface ExpeditionGuideInput {
  tournamentName: string; // 大会名
  schedule: string; // 日程
  meetingPlace: string; // 集合場所
  meetingTime: string; // 集合時間
  departureTime: string; // 出発時間
  dismissalTime: string; // 解散予定
  venue: string; // 会場
  accommodation: string; // 宿泊先
  fee: string; // 参加費
  extraItems: string; // 持ち物追加
  lunch: string; // 昼食
  notes: string; // 注意事項
  emergencyContact: string; // 緊急連絡先
}

export function createEmptyExpeditionGuideInput(): ExpeditionGuideInput {
  return {
    tournamentName: "",
    schedule: "",
    meetingPlace: "",
    meetingTime: "",
    departureTime: "",
    dismissalTime: "",
    venue: "",
    accommodation: "",
    fee: "",
    extraItems: "",
    lunch: "",
    notes: "",
    emergencyContact: "",
  };
}

export function expeditionGuideInputHasAnyValue(
  input: ExpeditionGuideInput,
): boolean {
  return Object.values(input).some((value) => value.trim() !== "");
}

// これが空だと保護者が現地に来られない・迷うような核心的な項目。
// 未入力でも生成自体はブロックしないが、フォーム上で要確認表示にする。
export const REQUIRED_EXPEDITION_FIELDS: (keyof ExpeditionGuideInput)[] = [
  "tournamentName",
  "schedule",
  "meetingPlace",
  "meetingTime",
  "venue",
];

export interface ExpeditionGuidePrintSection {
  heading: string;
  body: string;
}

export interface ExpeditionGuideOutput {
  line: string;
  email: string;
  printTitle: string;
  printDateLabel: string;
  printSections: ExpeditionGuidePrintSection[];
}

// AIによる「強化」操作の種類。今後の練習案内AI等でも同じ4種を踏襲する想定。
export type ExpeditionGuideEnhanceMode =
  | "improve" // 文章を自然に改善
  | "suggest-notes" // 注意事項を提案
  | "beginner-supplement" // 初参加向けの補足を追加
  | "parent-tone"; // 保護者向けの表現へ変更
