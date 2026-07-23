import type {
  ExpeditionGuideEnhanceMode,
  ExpeditionGuideInput,
  ExpeditionGuideOutput,
} from "../types/expeditionGuide";

const MODE_INSTRUCTIONS: Record<ExpeditionGuideEnhanceMode, string> = {
  improve:
    "文章を自然に改善してください。日時・場所・金額・連絡先などの事実情報は一切変えず、より自然で読みやすい日本語に整えることだけを行ってください。",
  "suggest-notes":
    "注意事項を提案してください。水球の遠征でよくある一般的な注意点（体調管理、持ち物の最終確認、行動範囲、SNS投稿時の配慮など）を、既存の「その他」欄に加えて具体的に追記してください。既存の事実情報は変えないでください。",
  "beginner-supplement":
    "初めて遠征に参加する保護者にも分かるように補足説明を追加してください。当日の流れ（集合後にどう動くか、保護者の同行有無など）や、持ち物の目安など、初参加の方が迷いやすい点を分かりやすく補ってください。既存の事実情報は変えないでください。",
  "parent-tone":
    "文章全体を、保護者向けのより丁寧で温かみのある表現に書き換えてください。事実関係（日時・場所・金額・連絡先等）は変えないでください。",
};

const FIELD_LABELS: Record<keyof ExpeditionGuideInput, string> = {
  tournamentName: "タイトル",
  leaders: "引率",
  schedule: "期日",
  venue: "会場",
  targetGroup: "対象",
  extraItems: "持ち物",
  practiceTime: "練習時間",
  practicePartner: "練習相手",
  meetingPlace: "集合場所",
  meetingTime: "集合時間",
  dismissalPlace: "解散場所",
  dismissalTime: "解散時間",
  fee: "参加費",
  notes: "その他",
};

function buildFieldsText(fields: ExpeditionGuideInput): string {
  return (Object.keys(FIELD_LABELS) as (keyof ExpeditionGuideInput)[])
    .map((key) => `${FIELD_LABELS[key]}: ${fields[key].trim() || "（未入力）"}`)
    .join("\n");
}

function buildPrintSectionsText(output: ExpeditionGuideOutput): string {
  return output.printSections
    .map((s) => `【${s.heading}】\n${s.body}`)
    .join("\n\n");
}

// Claude.ai / ChatGPTの無料Webチャットにそのままコピペするためのプロンプトを組み立てる。
// サーバー側のAPIは一切呼ばない（管理者がこのテキストを手動でAIに貼り付けて実行する）。
export function buildExpeditionGuideEnhancePrompt(
  fields: ExpeditionGuideInput,
  currentOutput: ExpeditionGuideOutput,
  mode: ExpeditionGuideEnhanceMode,
): string {
  return `あなたは水球クラブ「TokyoWAVES」の保護者向け遠征要項の作成アシスタントです。すでに作成済みのLINE用文章・メール用文章・印刷用文章（見出し＋本文）を、下記の1つの観点で改善してください。

# 今回の改善指示
${MODE_INSTRUCTIONS[mode]}

# 厳守ルール
- LINE用・メール用・印刷用の3形式すべてに同じ改善を反映し、3形式間で内容の矛盾がないようにすること
- 元の文章にない日時・場所・金額・連絡先などの具体的事実を勝手に作らないこと（一般的なアドバイスの追加は可）
- 印刷用のセクション構成は、既存の見出しを基本に保ちつつ、必要なら見出しの追加・本文の充実を行ってよい

# 入力された遠征情報（事実の参照用）
${buildFieldsText(fields)}

# 現在のLINE用文章
${currentOutput.line}

# 現在のメール用文章
${currentOutput.email}

# 現在の印刷用
タイトル: ${currentOutput.printTitle}
日付表記: ${currentOutput.printDateLabel}
${buildPrintSectionsText(currentOutput)}

# 回答フォーマット（必ずこの形式だけで、他の説明文を含めずに回答してください）
===LINE===
(改善後のLINE用文章)
===MAIL===
(改善後のメール用文章)
===PRINT_TITLE===
(改善後の印刷用タイトル)
===PRINT_DATE===
(改善後の印刷用日付表記)
===PRINT_SECTIONS===
【見出しA】
本文A

【見出しB】
本文B
`;
}
