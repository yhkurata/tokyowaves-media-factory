export type BrandContextCheck = {
  id: string;
  label: string;
  description: string;
  confirmed: boolean;
  template: string;
};

const CHECK_DEFINITIONS = [
  {
    id: "eligibility",
    label: "参加対象・参加条件",
    description: "対象学年や泳力など、参加できる条件",
    patterns: [/対象/, /25\s*m/i],
    template: "- 参加対象・条件：",
  },
  {
    id: "schedule",
    label: "基本の開催日程",
    description: "通常の曜日や、休止日がある場合の注意",
    patterns: [/毎週.*(?:土|日|月|火|水|木|金)曜/, /開催.*(?:土|日|月|火|水|木|金)曜/],
    template: "- 基本の開催日程：\n- 開催しない日の確認方法：",
  },
  {
    id: "application",
    label: "申込み・問い合わせ方法",
    description: "フォーム、DM、LINEなどの正式な窓口",
    patterns: [/申(?:し)?込(?:み|む|方法)/, /問い合わせ/, /応募方法/, /(?:DM|LINE|メール|電話|フォーム)/i],
    template: "- 体験申込み方法：\n- 問い合わせ先：",
  },
  {
    id: "venue",
    label: "会場・アクセス",
    description: "施設名、住所、最寄り駅などの具体的な場所",
    patterns: [/会場/, /練習場所/, /施設名/, /最寄り駅/, /アクセス/, /住所/],
    template: "- 会場名：\n- 住所・最寄り駅：",
  },
  {
    id: "fees",
    label: "料金・費用",
    description: "体験料、入会金、月謝など。無料の場合も明記",
    patterns: [/料金/, /費用/, /体験料/, /入会金/, /月謝/, /無料/],
    template: "- 体験料金：\n- 入会後の主な費用：",
  },
  {
    id: "preparation",
    label: "持ち物・保護者の見学",
    description: "当日の持ち物と、保護者が見学できるか",
    patterns: [/持ち物/, /見学/],
    template: "- 当日の持ち物：\n- 保護者の見学：",
  },
] as const;

export function analyzeBrandContext(operatingGuide: string): BrandContextCheck[] {
  return CHECK_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    confirmed: definition.patterns.some((pattern) => pattern.test(operatingGuide)),
    template: definition.template,
  }));
}

export function appendMissingFactsTemplate(operatingGuide: string): string {
  if (operatingGuide.includes("【確定済み運用情報】")) {
    return operatingGuide;
  }

  const missing = analyzeBrandContext(operatingGuide).filter(
    (item) => !item.confirmed,
  );
  if (missing.length === 0) {
    return operatingGuide;
  }

  const separator = operatingGuide.trim() ? "\n\n" : "";
  return `${operatingGuide.trimEnd()}${separator}【確定済み運用情報】\n※空欄を確認し、確定した事実だけを入力してください。\n${missing
    .map((item) => item.template)
    .join("\n")}`;
}
