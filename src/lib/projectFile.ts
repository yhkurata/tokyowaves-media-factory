import type { Tournament } from "../types/tournament";
import type { LeagueGroup } from "../types/league";
import type { TimetableInfo, TimetableMatch } from "../types/timetable";
import type { BracketData } from "../types/bracket";

/**
 * 大会プロジェクトの保存・読込用フォーマット。
 * バージョンを持たせておくことで、将来フィールドを追加・変更した際に
 * 古い保存ファイルを読み込む際の移行処理を挟めるようにしてある。
 */
export interface ProjectData {
  formatVersion: 1;
  savedAt: string;
  tournament: Tournament;
  leagues: LeagueGroup[];
  timetableInfo: TimetableInfo;
  matches: TimetableMatch[];
  bracket: BracketData;
}

export type ProjectSnapshot = Omit<ProjectData, "formatVersion" | "savedAt">;

export function buildProjectData(snapshot: ProjectSnapshot): ProjectData {
  return {
    formatVersion: 1,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };
}

export function serializeProjectData(data: ProjectData): string {
  return JSON.stringify(data, null, 2);
}

export class ProjectFileParseError extends Error {}

export function parseProjectData(text: string): ProjectData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ProjectFileParseError("JSONとして読み込めませんでした。ファイルが壊れている可能性があります。");
  }

  if (typeof raw !== "object" || raw === null) {
    throw new ProjectFileParseError("プロジェクトファイルの形式が不正です。");
  }
  const obj = raw as Record<string, unknown>;

  if (obj.formatVersion !== 1) {
    throw new ProjectFileParseError(
      "対応していない形式のファイルです（formatVersionが不明）。",
    );
  }
  if (
    typeof obj.tournament !== "object" ||
    !Array.isArray(obj.leagues) ||
    typeof obj.timetableInfo !== "object" ||
    !Array.isArray(obj.matches) ||
    typeof obj.bracket !== "object"
  ) {
    throw new ProjectFileParseError("プロジェクトファイルの内容が不足しています。");
  }

  return obj as unknown as ProjectData;
}

export function projectFilename(tournamentName: string): string {
  const safe = tournamentName.trim() || "大会データ";
  const date = new Date().toISOString().slice(0, 10);
  return `${safe}_${date}.json`;
}
