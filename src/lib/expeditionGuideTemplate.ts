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
// APIを呼ばない純粋関数。「大会名・日程・集合場所・集合時間・会場」以外は
// 未入力ならその行/セクションごと省略する。
export function buildExpeditionGuideOutput(
  input: ExpeditionGuideInput,
): ExpeditionGuideOutput {
  const tournamentName = requiredOrPlaceholder(input.tournamentName);
  const schedule = requiredOrPlaceholder(input.schedule);
  const meetingPlace = requiredOrPlaceholder(input.meetingPlace);
  const meetingTime = requiredOrPlaceholder(input.meetingTime);
  const venue = requiredOrPlaceholder(input.venue);

  const targetGroup = input.targetGroup.trim();
  const leaders = input.leaders.trim();
  const departureTime = input.departureTime.trim();
  const dismissalTime = input.dismissalTime.trim();
  const accommodation = input.accommodation.trim();
  const fee = input.fee.trim();
  const extraItems = input.extraItems.trim();
  const lunch = input.lunch.trim();
  const notes = input.notes.trim();
  const emergencyContact = input.emergencyContact.trim();

  const fields: TemplateFields = {
    tournamentName,
    schedule,
    venue,
    meetingPlace,
    meetingTime,
    targetGroup,
    leaders,
    departureTime,
    dismissalTime,
    accommodation,
    fee,
    extraItems,
    lunch,
    notes,
    emergencyContact,
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
  schedule: string;
  venue: string;
  meetingPlace: string;
  meetingTime: string;
  targetGroup: string;
  leaders: string;
  departureTime: string;
  dismissalTime: string;
  accommodation: string;
  fee: string;
  extraItems: string;
  lunch: string;
  notes: string;
  emergencyContact: string;
}

function buildLineText(f: TemplateFields): string {
  const lines = [
    `📢【${f.tournamentName} 遠征のお知らせ】`,
    "",
    `🗓 日程：${f.schedule}`,
    f.targetGroup ? `👥 対象：${f.targetGroup}` : "",
    f.leaders ? `🧑‍🏫 引率：${f.leaders}` : "",
    `🏟 会場：${f.venue}`,
    `📍 集合場所：${f.meetingPlace}`,
    `⏰ 集合時間：${f.meetingTime}`,
    f.departureTime ? `🚌 出発時間：${f.departureTime}` : "",
    f.dismissalTime ? `🏁 解散予定：${f.dismissalTime}` : "",
    f.accommodation ? `🏨 宿泊先：${f.accommodation}` : "",
    f.fee ? `💰 参加費：${f.fee}` : "",
    f.extraItems ? `🎒 持ち物：${f.extraItems}` : "",
    f.lunch ? `🍙 昼食：${f.lunch}` : "",
    f.notes ? `⚠️ 注意事項：${f.notes}` : "",
    f.emergencyContact ? `📞 緊急連絡先：${f.emergencyContact}` : "",
    "",
    "よろしくお願いいたします🙇",
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function buildEmailText(f: TemplateFields): string {
  const blocks = [
    "保護者各位",
    `いつもお世話になっております。${f.tournamentName}の遠征要項についてご案内いたします。`,
    `【日程】\n${f.schedule}`,
    f.targetGroup ? `【対象】\n${f.targetGroup}` : "",
    f.leaders ? `【引率】\n${f.leaders}` : "",
    `【会場】\n${f.venue}`,
    `【集合場所】\n${f.meetingPlace}`,
    `【集合時間】\n${f.meetingTime}`,
    f.departureTime ? `【出発時間】\n${f.departureTime}` : "",
    f.dismissalTime ? `【解散予定】\n${f.dismissalTime}` : "",
    f.accommodation ? `【宿泊先】\n${f.accommodation}` : "",
    f.fee ? `【参加費】\n${f.fee}` : "",
    f.extraItems ? `【持ち物】\n${f.extraItems}` : "",
    f.lunch ? `【昼食】\n${f.lunch}` : "",
    f.notes ? `【注意事項】\n${f.notes}` : "",
    f.emergencyContact ? `【緊急連絡先】\n${f.emergencyContact}` : "",
    "ご不明な点がございましたら、緊急連絡先までお問い合わせください。\nよろしくお願いいたします。",
    "TokyoWAVES",
  ];
  return blocks.filter((block) => block !== "").join("\n\n");
}

function buildPrintSections(
  f: Omit<TemplateFields, "tournamentName">,
): ExpeditionGuidePrintSection[] {
  const meetingBody = [
    `集合場所：${f.meetingPlace}`,
    `集合時間：${f.meetingTime}`,
    f.departureTime ? `出発時間：${f.departureTime}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const targetLeaderBody = [
    f.targetGroup ? `対象：${f.targetGroup}` : "",
    f.leaders ? `引率：${f.leaders}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const sections: (ExpeditionGuidePrintSection | null)[] = [
    { heading: "日程・会場", body: `日程：${f.schedule}\n会場：${f.venue}` },
    targetLeaderBody ? { heading: "対象・引率", body: targetLeaderBody } : null,
    { heading: "集合・出発", body: meetingBody },
    f.dismissalTime ? { heading: "解散予定", body: f.dismissalTime } : null,
    f.accommodation ? { heading: "宿泊先", body: f.accommodation } : null,
    f.fee ? { heading: "参加費", body: f.fee } : null,
    f.extraItems ? { heading: "持ち物", body: f.extraItems } : null,
    f.lunch ? { heading: "昼食", body: f.lunch } : null,
    f.notes ? { heading: "注意事項", body: f.notes } : null,
    f.emergencyContact
      ? { heading: "緊急連絡先", body: f.emergencyContact }
      : null,
  ];

  return sections.filter((s): s is ExpeditionGuidePrintSection => s !== null);
}
