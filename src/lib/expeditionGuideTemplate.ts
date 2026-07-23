import type {
  ExpeditionGuideInput,
  ExpeditionGuideOutput,
  ExpeditionGuidePrintSection,
} from "../types/expeditionGuide";

const UNDECIDED_PLACEHOLDER = "（未定・追ってご連絡します）";

function requiredOrPlaceholder(value: string): string {
  return value.trim() || UNDECIDED_PLACEHOLDER;
}

function formatTodayJa(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

// 遠征要項AIの基本生成ロジック（テンプレートエンジン）。
// APIを呼ばない純粋関数。「タイトル・期日・集合場所・時間・会場」以外は
// 未入力ならその行/セクションごと省略する。
// 項目の並び順は、TokyoWAVESが実際に記入している流れ
// （タイトル→引率→期日→会場→対象→持ち物→練習時間→練習相手→
// 集合場所・時間→解散場所・時間→参加費→その他）に合わせてある。
export function buildExpeditionGuideOutput(
  input: ExpeditionGuideInput,
): ExpeditionGuideOutput {
  const tournamentName = requiredOrPlaceholder(input.tournamentName);
  const schedule = requiredOrPlaceholder(input.schedule);
  const meeting = requiredOrPlaceholder(input.meeting);
  const venue = requiredOrPlaceholder(input.venue);

  const leaders = input.leaders.trim();
  const targetGroup = input.targetGroup.trim();
  const extraItems = input.extraItems.trim();
  const practiceTime = input.practiceTime.trim();
  const practicePartner = input.practicePartner.trim();
  const dismissal = input.dismissal.trim();
  const fee = input.fee.trim();
  const notes = input.notes.trim();

  const fields: TemplateFields = {
    tournamentName,
    leaders,
    schedule,
    venue,
    targetGroup,
    extraItems,
    practiceTime,
    practicePartner,
    meeting,
    dismissal,
    fee,
    notes,
  };

  return {
    line: buildLineText(fields),
    email: buildEmailText(fields),
    printTitle: `${input.tournamentName.trim() || "TokyoWAVES"} 遠征要項`,
    printDateLabel: `発行日：${formatTodayJa()}`,
    printSections: buildPrintSections(fields),
  };
}

interface TemplateFields {
  tournamentName: string;
  leaders: string;
  schedule: string;
  venue: string;
  targetGroup: string;
  extraItems: string;
  practiceTime: string;
  practicePartner: string;
  meeting: string;
  dismissal: string;
  fee: string;
  notes: string;
}

function buildLineText(f: TemplateFields): string {
  const lines = [
    `📢【${f.tournamentName} 遠征のお知らせ】`,
    "",
    f.leaders ? `🧑‍🏫 引率：${f.leaders}` : "",
    `🗓 期日：${f.schedule}`,
    `🏟 会場：${f.venue}`,
    f.targetGroup ? `👥 対象：${f.targetGroup}` : "",
    f.extraItems ? `🎒 持ち物：${f.extraItems}` : "",
    f.practiceTime ? `🏊 練習時間：${f.practiceTime}` : "",
    f.practicePartner ? `🤝 練習相手：${f.practicePartner}` : "",
    `📍 集合場所・時間：${f.meeting}`,
    f.dismissal ? `🏁 解散場所・時間：${f.dismissal}` : "",
    f.fee ? `💰 参加費：${f.fee}` : "",
    f.notes ? `📝 その他：${f.notes}` : "",
    "",
    "よろしくお願いいたします🙇",
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function buildEmailText(f: TemplateFields): string {
  const blocks = [
    "保護者各位",
    `いつもお世話になっております。${f.tournamentName}の遠征要項についてご案内いたします。`,
    f.leaders ? `【引率】\n${f.leaders}` : "",
    `【期日】\n${f.schedule}`,
    `【会場】\n${f.venue}`,
    f.targetGroup ? `【対象】\n${f.targetGroup}` : "",
    f.extraItems ? `【持ち物】\n${f.extraItems}` : "",
    f.practiceTime ? `【練習時間】\n${f.practiceTime}` : "",
    f.practicePartner ? `【練習相手】\n${f.practicePartner}` : "",
    `【集合場所・時間】\n${f.meeting}`,
    f.dismissal ? `【解散場所・時間】\n${f.dismissal}` : "",
    f.fee ? `【参加費】\n${f.fee}` : "",
    f.notes ? `【その他】\n${f.notes}` : "",
    "ご不明な点がございましたら、お気軽にお問い合わせください。\nよろしくお願いいたします。",
    "TokyoWAVES",
  ];
  return blocks.filter((block) => block !== "").join("\n\n");
}

function buildPrintSections(f: TemplateFields): ExpeditionGuidePrintSection[] {
  const sections: (ExpeditionGuidePrintSection | null)[] = [
    f.leaders ? { heading: "引率", body: f.leaders } : null,
    { heading: "期日・会場", body: `期日：${f.schedule}\n会場：${f.venue}` },
    f.targetGroup ? { heading: "対象", body: f.targetGroup } : null,
    f.extraItems ? { heading: "持ち物", body: f.extraItems } : null,
    f.practiceTime ? { heading: "練習時間", body: f.practiceTime } : null,
    f.practicePartner
      ? { heading: "練習相手", body: f.practicePartner }
      : null,
    { heading: "集合場所・時間", body: f.meeting },
    f.dismissal ? { heading: "解散場所・時間", body: f.dismissal } : null,
    f.fee ? { heading: "参加費", body: f.fee } : null,
    f.notes ? { heading: "その他", body: f.notes } : null,
  ];

  return sections.filter((s): s is ExpeditionGuidePrintSection => s !== null);
}
