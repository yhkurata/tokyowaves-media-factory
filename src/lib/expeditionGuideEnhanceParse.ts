import type {
  ExpeditionGuideOutput,
  ExpeditionGuidePrintSection,
} from "../types/expeditionGuide";

const SECTION_MARKERS = [
  "LINE",
  "MAIL",
  "PRINT_TITLE",
  "PRINT_DATE",
  "PRINT_SECTIONS",
] as const;

type SectionMarker = (typeof SECTION_MARKERS)[number];

const MARKER_RE = /===\s*(LINE|MAIL|PRINT_TITLE|PRINT_DATE|PRINT_SECTIONS)\s*===/g;

function splitByMarkers(text: string): Partial<Record<SectionMarker, string>> {
  const matches = [...text.matchAll(MARKER_RE)];
  const bodies: Partial<Record<SectionMarker, string>> = {};

  for (let i = 0; i < matches.length; i++) {
    const marker = matches[i][1] as SectionMarker;
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    bodies[marker] = text.slice(start, end).trim();
  }

  return bodies;
}

function parsePrintSections(body: string): ExpeditionGuidePrintSection[] {
  const sections: ExpeditionGuidePrintSection[] = [];
  const headingRe = /【([^】]+)】\n?([\s\S]*?)(?=\n\s*【|$)/g;
  for (const match of body.matchAll(headingRe)) {
    const heading = match[1].trim();
    const sectionBody = match[2].trim();
    if (heading !== "") sections.push({ heading, body: sectionBody });
  }
  return sections;
}

export interface ExpeditionGuideEnhanceParseResult {
  output: Partial<ExpeditionGuideOutput>;
  matchedKeys: string[];
}

// Claude.ai / ChatGPTの無料Webチャットから貼り付けられた回答をパースする。
// APIの構造化出力ではなく自由記述のテキストなので、マーカーが見つかった項目だけを
// 反映し、見つからない項目はそのまま（＝更新しない）にする。
export function parseExpeditionGuideEnhanceReply(
  text: string,
): ExpeditionGuideEnhanceParseResult {
  const bodies = splitByMarkers(text);
  const output: Partial<ExpeditionGuideOutput> = {};
  const matchedKeys: string[] = [];

  if (bodies.LINE) {
    output.line = bodies.LINE;
    matchedKeys.push("LINE用文章");
  }
  if (bodies.MAIL) {
    output.email = bodies.MAIL;
    matchedKeys.push("メール用文章");
  }
  if (bodies.PRINT_TITLE) {
    output.printTitle = bodies.PRINT_TITLE;
    matchedKeys.push("印刷用タイトル");
  }
  if (bodies.PRINT_DATE) {
    output.printDateLabel = bodies.PRINT_DATE;
    matchedKeys.push("印刷用日付");
  }
  if (bodies.PRINT_SECTIONS) {
    const sections = parsePrintSections(bodies.PRINT_SECTIONS);
    if (sections.length > 0) {
      output.printSections = sections;
      matchedKeys.push("印刷用セクション");
    }
  }

  return { output, matchedKeys };
}
