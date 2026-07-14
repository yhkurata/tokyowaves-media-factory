import type { TournamentDay } from "../types/tournament";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}(${WEEKDAY_LABELS[parsed.getDay()]})`;
}

// ファイル名用（"/" 等のOS予約文字を含まない、番号付きファイル名で使う表記）
export function formatFilenameDate(isoDate: string): string {
  if (!isoDate) return "";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

export function getDateRangeLabel(days: TournamentDay[]): string {
  const validDates = days
    .map((d) => d.date)
    .filter((d) => d.length > 0)
    .sort();
  if (validDates.length === 0) return "開催日未入力";
  if (validDates.length === 1) return formatDisplayDate(validDates[0]);
  return `${formatDisplayDate(validDates[0])}〜${formatDisplayDate(validDates[validDates.length - 1])}`;
}

export function getVenueSummaryLabel(days: TournamentDay[]): string {
  const names = Array.from(
    new Set(
      days.flatMap((d) => d.venues.map((v) => v.name)).filter((n) => n.length > 0),
    ),
  );
  if (names.length === 0) return "会場未入力";
  return names.join("・");
}
