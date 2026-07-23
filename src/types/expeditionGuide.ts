// 遠征要項AIのデータ構造。
// 基本の生成はテンプレートエンジン（src/lib/expeditionGuideTemplate.ts）が
// APIを呼ばずに行う。AIは任意の「強化」操作としてのみ利用する。
// サーバーDBは持たず、フォーム入力値をlocalStorageに保存するだけの
// シンプルな構成（大会画像作成・スタンプ制作と同じ方針）。
//
// フィールドの並びは、実際にTokyoWAVESが使っている記入順に合わせてある：
// タイトル→引率→期日→会場→対象→持ち物→練習時間→練習相手→
// 集合場所→集合時間→解散場所→解散時間→参加費→その他

export interface ExpeditionGuideInput {
  tournamentName: string; // タイトル
  leaders: string; // 引率
  schedule: string; // 期日
  venue: string; // 会場（複数会場・住所・最寄駅があれば改行して記入可）
  targetGroup: string; // 対象（小学生・中学生・全員）
  extraItems: string; // 持ち物（改行して箇条書き可）
  practiceTime: string; // 練習時間
  practicePartner: string; // 練習相手（合同練習を行うクラブ名等）
  meetingPlace: string; // 集合場所（複数地点があれば改行して記入可）
  meetingTime: string; // 集合時間
  dismissalPlace: string; // 解散場所（複数地点があれば改行して記入可）
  dismissalTime: string; // 解散時間
  fee: string; // 参加費
  notes: string; // その他（改行して箇条書き可）
}

// 毎回ほぼ同じ内容になる項目は、空欄からではなく定型文からスタートできるように
// デフォルト値を入れておく（必要に応じて上書き・削除して使う）。
// 実際の遠征案内で共通していた内容を採用している。
const DEFAULT_EXTRA_ITEMS =
  "水着・セーム（タオル）・ゴーグル・キャップ（試合帽子　白×１　青×１）・ボール×１・スイミングキャップ・ジャージ（プールサイド用）・補食（必要な方のみ）・サンダル（火傷・怪我防止）・日焼け対策";
const DEFAULT_NOTES =
  "◎乗り換えをスムーズに行えるようにSuicaの用意をお願いいたします。\n◎移動時は必ず運動靴を履いてください。\n※解散時間が変更する場合、一斉LINEでご連絡します。\n・参加費は集合時に集めます。\n・保護者の観覧有り。\n・駐車場：（利用可能な駐車場があれば記入してください）\n・ご不明な点はお気軽にご連絡ください。\n・前日までに参加の有無をスプレッドシートまでご入力ください。";
const DEFAULT_FEE = "1,000円";
// 集合・解散はほぼ毎回「立川」と「現地」の2点になるため、空欄ではなく
// 記入例を兼ねた定型文から始められるようにしてある（時間だけ書き足せばよい）。
const DEFAULT_MEETING_PLACE = "立川　\n現地　";
const DEFAULT_DISMISSAL_PLACE = "立川　\n現地　";

// 「対象」の選択肢。複数選択して「・」区切りで組み立てる。
export const TARGET_GROUP_OPTIONS = ["小学生", "中学生", "全員"] as const;

// 「引率」の選択肢（チェックボックス）。これ以外の名前は自由記入欄に追記する。
// 窪田はどの遠征でも引率に入っていたため、初期状態でチェック済みにしてある。
export const LEADER_OPTIONS = ["窪田", "岡本", "倉田"] as const;
const DEFAULT_LEADERS = "窪田";

export function createEmptyExpeditionGuideInput(): ExpeditionGuideInput {
  return {
    tournamentName: "",
    leaders: DEFAULT_LEADERS,
    schedule: "",
    venue: "",
    targetGroup: "",
    extraItems: DEFAULT_EXTRA_ITEMS,
    practiceTime: "",
    practicePartner: "",
    meetingPlace: DEFAULT_MEETING_PLACE,
    meetingTime: "",
    dismissalPlace: DEFAULT_DISMISSAL_PLACE,
    dismissalTime: "",
    fee: DEFAULT_FEE,
    notes: DEFAULT_NOTES,
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
