import type {
  ProposalCandidate,
  ProposalResult,
} from "./instagramProposalSchema.js";

export interface ProposalSafetyWarning {
  candidateIndex: number;
  field: "contact" | "date" | "time" | "price";
  message: string;
  detectedValue: string;
}

function publicFacingText(candidate: ProposalCandidate) {
  return [
    candidate.plan.firstSlideCopy,
    ...candidate.plan.pageStructure.map((page) => page.content),
    candidate.plan.caption,
    candidate.plan.cta,
    candidate.plan.postTime,
    candidate.plan.postTimeReason,
  ].join("\n");
}

function findUnsupportedMatches(
  text: string,
  sourceText: string,
  pattern: RegExp,
) {
  return Array.from(text.matchAll(pattern))
    .map((match) => match[0])
    .filter(
      (value, index, values) =>
        !sourceText.toLocaleLowerCase().includes(value.toLocaleLowerCase()) &&
        values.indexOf(value) === index,
    );
}

export function validateProposalSafety(
  candidates: ProposalResult["candidates"],
  confirmedSourceText: string,
): ProposalSafetyWarning[] {
  const warnings: ProposalSafetyWarning[] = [];
  const source = confirmedSourceText.trim();

  candidates.forEach((candidate, candidateIndex) => {
    const text = publicFacingText(candidate);
    const contactMatches = findUnsupportedMatches(
      text,
      source,
      /\bDM\b|ダイレクトメッセージ|公式LINE|LINE公式|申込フォーム|申し込みフォーム|プロフィール(?:の)?リンク|メール|電話/giu,
    );
    const dateMatches = findUnsupportedMatches(
      text,
      source,
      /(?:20\d{2}年)?\d{1,2}月\d{1,2}日|(?:今週|来週|再来週)の?[月火水木金土日]曜日/gu,
    );
    const timeMatches = findUnsupportedMatches(
      text,
      source,
      /(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[〜～-]\s*(?:[01]?\d|2[0-3]):[0-5]\d)?/gu,
    );
    const priceMatches = findUnsupportedMatches(
      text,
      source,
      /(?:無料|\d[\d,]*\s*円)/gu,
    );

    for (const detectedValue of contactMatches) {
      warnings.push({
        candidateIndex,
        field: "contact",
        detectedValue,
        message: `確認済み情報にない申込・連絡方法「${detectedValue}」が含まれています。`,
      });
    }
    for (const detectedValue of dateMatches) {
      warnings.push({
        candidateIndex,
        field: "date",
        detectedValue,
        message: `確認済み情報にない日付「${detectedValue}」が含まれています。`,
      });
    }
    for (const detectedValue of timeMatches) {
      warnings.push({
        candidateIndex,
        field: "time",
        detectedValue,
        message: `確認済み情報にない時刻「${detectedValue}」が含まれています。`,
      });
    }
    for (const detectedValue of priceMatches) {
      warnings.push({
        candidateIndex,
        field: "price",
        detectedValue,
        message: `確認済み情報にない料金表現「${detectedValue}」が含まれています。`,
      });
    }
  });

  return warnings;
}

