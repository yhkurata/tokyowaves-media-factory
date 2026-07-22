import type { GuideDocResult } from "./guideDocSchema.js";

export type ExpeditionGuideEnhanceMode =
  | "improve"
  | "suggest-notes"
  | "beginner-supplement"
  | "parent-tone";

export interface ExpeditionGuideFieldsInput {
  tournamentName: string;
  schedule: string;
  meetingPlace: string;
  meetingTime: string;
  departureTime: string;
  dismissalTime: string;
  venue: string;
  accommodation: string;
  fee: string;
  extraItems: string;
  lunch: string;
  notes: string;
  emergencyContact: string;
}

const FIELD_LABELS: Record<keyof ExpeditionGuideFieldsInput, string> = {
  tournamentName: "大会名",
  schedule: "日程",
  meetingPlace: "集合場所",
  meetingTime: "集合時間",
  departureTime: "出発時間",
  dismissalTime: "解散予定",
  venue: "会場",
  accommodation: "宿泊先",
  fee: "参加費",
  extraItems: "持ち物追加",
  lunch: "昼食",
  notes: "注意事項",
  emergencyContact: "緊急連絡先",
};

const MODE_INSTRUCTIONS: Record<ExpeditionGuideEnhanceMode, string> = {
  improve:
    "文章を自然に改善してください。日時・場所・金額・連絡先などの事実情報は一切変えず、より自然で読みやすい日本語に整えることだけを行ってください。",
  "suggest-notes":
    "注意事項を提案してください。水球の遠征でよくある一般的な注意点（体調管理、持ち物の最終確認、行動範囲、SNS投稿時の配慮など）を、既存の注意事項に加えて具体的に追記してください。既存の事実情報は変えないでください。",
  "beginner-supplement":
    "初めて遠征に参加する保護者にも分かるように補足説明を追加してください。当日の流れ（集合後にどう動くか、保護者の同行有無など）や、持ち物の目安など、初参加の方が迷いやすい点を分かりやすく補ってください。既存の事実情報は変えないでください。",
  "parent-tone":
    "文章全体を、保護者向けのより丁寧で温かみのある表現に書き換えてください。事実関係（日時・場所・金額・連絡先等）は変えないでください。",
};

function buildFieldsText(fields: ExpeditionGuideFieldsInput): string {
  return (Object.keys(FIELD_LABELS) as (keyof ExpeditionGuideFieldsInput)[])
    .map((key) => `${FIELD_LABELS[key]}: ${fields[key].trim() || "（未入力）"}`)
    .join("\n");
}

export function buildExpeditionGuideEnhanceSystemPrompt(
  mode: ExpeditionGuideEnhanceMode,
): string {
  return `あなたは水球クラブ「TokyoWAVES」の保護者向け遠征要項の作成アシスタントです。すでにテンプレートエンジンで作成済みのLINE用文章・メール用文章・印刷用文章（見出し＋本文のセクション形式）を、指定された1つの観点で改善します。

# 今回の改善指示
${MODE_INSTRUCTIONS[mode]}

# 厳守ルール
- LINE用・メール用・印刷用の3形式すべてに同じ改善を反映し、3形式間で内容の矛盾がないようにすること
- 元の文章にない日時・場所・金額・連絡先などの具体的事実を勝手に作らないこと（一般的なアドバイスの追加は可）
- 印刷用のprintSectionsは、既存のセクション構成を基本に保ちつつ、必要なら見出しの追加・本文の充実を行ってよい
- 出力はJSON形式のみ。説明文や前置きは含めないこと`;
}

export function buildExpeditionGuideEnhanceUserMessage(params: {
  fields: ExpeditionGuideFieldsInput;
  currentOutput: GuideDocResult;
}): string {
  const { fields, currentOutput } = params;
  return `# 入力された遠征情報（事実の参照用）
${buildFieldsText(fields)}

# 現在のLINE用文章
${currentOutput.lineText}

# 現在のメール用文章
${currentOutput.emailText}

# 現在の印刷用（タイトル・日付・セクション）
タイトル: ${currentOutput.printTitle}
日付表記: ${currentOutput.printDateLabel}
${currentOutput.printSections.map((s) => `【${s.heading}】\n${s.body}`).join("\n\n")}`;
}
