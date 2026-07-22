// 遠征要項AIのデータ構造。
// 基本の生成はテンプレートエンジン（src/lib/expeditionGuideTemplate.ts）が
// APIを呼ばずに行う。AIは任意の「強化」操作としてのみ利用する。
// サーバーDBは持たず、フォーム入力値をlocalStorageに保存するだけの
// シンプルな構成（大会画像作成・スタンプ制作と同じ方針）。

export interface ExpeditionGuideInput {
  tournamentName: string; // 大会名
  schedule: string; // 日程
  meetingPlace: string; // 集合場所（複数地点がある場合は改行して記入可）
  meetingTime: string; // 集合時間
  targetGroup: string; // 対象（例：中学男子、小学生・中女）
  leaders: string; // 引率者
  practiceTime: string; // 練習時間（集合・解散とは別の、活動そのものの開始〜終了時刻）
  departureTime: string; // 出発時間
  dismissalTime: string; // 解散予定（複数地点がある場合は改行して記入可）
  venue: string; // 会場
  accommodation: string; // 宿泊先
  fee: string; // 参加費
  extraItems: string; // 持ち物追加（改行して箇条書き可）
  lunch: string; // 昼食
  notes: string; // 注意事項（改行して箇条書き可）
  emergencyContact: string; // 緊急連絡先
}

// 毎回ほぼ同じ内容になる項目は、空欄からではなく定型文からスタートできるように
// デフォルト値を入れておく（必要に応じて上書き・削除して使う）。
// 実際の遠征案内2件でほぼ同一だった内容を採用している。
const DEFAULT_EXTRA_ITEMS =
  "水着・セーム（タオル）・ゴーグル・キャップ（試合帽子　白×１　青×１）・ボール×１・スイミングキャップ・ジャージ（プールサイド用）";
const DEFAULT_NOTES =
  "◎乗り換えをスムーズに行えるようにSuicaの用意をお願いいたします。\n◎移動時は必ず運動靴を履いてください。";

export function createEmptyExpeditionGuideInput(): ExpeditionGuideInput {
  return {
    tournamentName: "",
    schedule: "",
    meetingPlace: "",
    meetingTime: "",
    targetGroup: "",
    leaders: "",
    practiceTime: "",
    departureTime: "",
    dismissalTime: "",
    venue: "",
    accommodation: "",
    fee: "",
    extraItems: DEFAULT_EXTRA_ITEMS,
    lunch: "",
    notes: DEFAULT_NOTES,
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
