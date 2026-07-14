import type { Tournament } from "../types/tournament";
import type { LeagueGroup } from "../types/league";
import type { TimetableMatch } from "../types/timetable";
import type { BracketData } from "../types/bracket";
import { formatFilenameDate } from "./tournamentSchedule";

export interface AppState {
  tournament: Tournament;
  leagues: LeagueGroup[];
  matches: TimetableMatch[];
  bracket: BracketData;
}

export type ExportUnitKind = "cover" | "league" | "timetable" | "tournament";

export interface ExportUnit {
  id: string;
  kind: ExportUnitKind;
  filename: string;
  // timetable用の追加情報
  date?: string;
  venue?: string;
  matches?: TimetableMatch[];
}

export interface TemplateSectionMeta {
  id: string;
  label: string;
  hasData: boolean;
  needsReview: boolean;
}

export function tournamentHasData(tournament: Tournament) {
  return tournament.name.trim() !== "" || tournament.days.length > 0;
}

export function tournamentNeedsReview(tournament: Tournament) {
  if (tournament.name.trim() === "") return true;
  return tournament.days.some(
    (day) =>
      day.date === "" ||
      day.venues.length === 0 ||
      day.venues.some((v) => v.name.trim() === ""),
  );
}

export function leaguesHasData(leagues: LeagueGroup[]) {
  return leagues.some((league) => league.teams.some((t) => t.name.trim() !== ""));
}

export function leaguesNeedsReview(leagues: LeagueGroup[]) {
  if (!leaguesHasData(leagues)) return false;
  return leagues.some(
    (league) =>
      league.name.trim() === "" ||
      league.teams.some((t) => t.name.trim() === ""),
  );
}

export function timetableHasData(matches: TimetableMatch[]) {
  return matches.length > 0;
}

export function timetableNeedsReview(matches: TimetableMatch[]) {
  return matches.some(
    (m) =>
      m.teamA.trim() === "" ||
      m.teamB.trim() === "" ||
      m.time.trim() === "" ||
      m.no.trim() === "",
  );
}

export function bracketHasData(data: BracketData) {
  return data.round1.some(
    (slot) => slot.teamA.trim() !== "" || slot.teamB.trim() !== "",
  );
}

export function bracketNeedsReview(data: BracketData) {
  if (!bracketHasData(data)) return false;
  return data.round1.some(
    (slot) => slot.teamA.trim() === "" || slot.teamB.trim() === "",
  );
}

export function buildSections(state: AppState): TemplateSectionMeta[] {
  return [
    {
      id: "cover",
      label: "大会情報",
      hasData: tournamentHasData(state.tournament),
      needsReview: tournamentNeedsReview(state.tournament),
    },
    {
      id: "league",
      label: "リーグ組み合わせ",
      hasData: leaguesHasData(state.leagues),
      needsReview: leaguesNeedsReview(state.leagues),
    },
    {
      id: "timetable",
      label: "タイムテーブル",
      hasData: timetableHasData(state.matches),
      needsReview: timetableNeedsReview(state.matches),
    },
    {
      id: "tournament",
      label: "トーナメント表",
      hasData: bracketHasData(state.bracket),
      needsReview: bracketNeedsReview(state.bracket),
    },
  ];
}

type PendingUnit = Omit<ExportUnit, "filename"> & { baseName: string };

export function buildExportUnits(state: AppState): ExportUnit[] {
  const pending: PendingUnit[] = [];

  if (tournamentHasData(state.tournament)) {
    pending.push({ id: "cover", kind: "cover", baseName: "表紙" });
  }

  if (leaguesHasData(state.leagues)) {
    pending.push({
      id: "league",
      kind: "league",
      baseName: "リーグ組み合わせ",
    });
  }

  for (const day of state.tournament.days) {
    for (const venue of day.venues) {
      const scoped = state.matches.filter(
        (m) => m.date === day.date && m.venue === venue.name,
      );
      if (scoped.length === 0) continue;
      pending.push({
        id: `timetable-${day.id}-${venue.id}`,
        kind: "timetable",
        date: day.date,
        venue: venue.name,
        matches: scoped,
        baseName: `タイムテーブル_${formatFilenameDate(day.date)}_${venue.name}`,
      });
    }
  }

  if (bracketHasData(state.bracket)) {
    pending.push({
      id: "tournament",
      kind: "tournament",
      baseName: "トーナメント表",
    });
  }

  // 番号付き・内容が分かるファイル名にする（例："01_表紙.png"）
  const numberWidth = Math.max(2, String(pending.length).length);
  const units: ExportUnit[] = pending.map((unit, index) => {
    const { baseName, ...rest } = unit;
    const number = String(index + 1).padStart(numberWidth, "0");
    return { ...rest, filename: `${number}_${baseName}.png` };
  });

  return units;
}
