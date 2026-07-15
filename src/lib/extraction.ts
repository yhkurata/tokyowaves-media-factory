import type { Tournament, TournamentDay } from "../types/tournament";
import type { LeagueGroup, Team } from "../types/league";
import type { TimetableInfo, TimetableMatch } from "../types/timetable";
import type { BracketData } from "../types/bracket";

export interface ExtractedLeague {
  name: string;
  teams: string[];
}

export interface ExtractedMatch {
  date: string | null;
  venue: string | null;
  time: string | null;
  league: string | null;
  no: string | null;
  teamA: string | null;
  teamB: string | null;
}

export interface ExtractedBracketSlot {
  teamA: string | null;
  teamB: string | null;
}

export interface ExtractionResult {
  tournamentName: string | null;
  category: string | null;
  leagues: ExtractedLeague[];
  matches: ExtractedMatch[];
  bracket: ExtractedBracketSlot[];
}

// 資料によって「東京WAVES」の表記ゆれ（例："東京WAVS" のような1文字抜け、
// 全角/半角、スペースの有無）があるため、緩めに判定する。
// 「東京」または「TOKYO」と「WAV」（WAVE/WAVES/WAVS等に共通）が両方含まれていれば
// 自チームとみなす。
function isTokyoWaves(name: string) {
  const normalized = name.replace(/\s+/g, "").toUpperCase();
  return (
    (normalized.includes("東京") || normalized.includes("TOKYO")) &&
    normalized.includes("WAV")
  );
}

const TOKYO_WAVES_CANONICAL_NAME = "東京WAVES";

// 自チームと判定した場合は、資料の表記ゆれ（例："東京WAVS"）に関わらず
// 正式名称で表示する。他チームの名前は資料の表記をそのまま尊重する。
function normalizeTeamName(name: string) {
  return isTokyoWaves(name) ? TOKYO_WAVES_CANONICAL_NAME : name;
}

function createId() {
  return crypto.randomUUID();
}

export function buildDaysFromMatches(matches: ExtractedMatch[]): TournamentDay[] {
  const dateToVenues = new Map<string, Set<string>>();
  for (const match of matches) {
    if (!match.date) continue;
    if (!dateToVenues.has(match.date)) {
      dateToVenues.set(match.date, new Set());
    }
    if (match.venue) {
      dateToVenues.get(match.date)!.add(match.venue);
    }
  }

  return Array.from(dateToVenues.keys())
    .sort()
    .map((date) => ({
      id: createId(),
      date,
      venues: Array.from(dateToVenues.get(date)!).map((name) => ({
        id: createId(),
        name,
      })),
    }));
}

export function buildTournament(result: ExtractionResult): Tournament {
  return {
    name: result.tournamentName ?? "",
    days: buildDaysFromMatches(result.matches),
  };
}

export function buildTimetableInfoPatch(
  result: ExtractionResult,
): Partial<TimetableInfo> {
  const patch: Partial<TimetableInfo> = {};
  if (result.category) patch.round = result.category;
  return patch;
}

export function buildLeagueGroups(result: ExtractionResult): LeagueGroup[] {
  return result.leagues.map((league) => ({
    id: createId(),
    name: league.name,
    teams: league.teams.map(
      (name): Team => ({
        id: createId(),
        name: normalizeTeamName(name),
        isTokyoWaves: isTokyoWaves(name),
      }),
    ),
  }));
}

export function buildTimetableMatches(
  result: ExtractionResult,
): TimetableMatch[] {
  return result.matches.map((match, index) => ({
    id: createId(),
    date: match.date ?? "",
    venue: match.venue ?? "",
    time: match.time ?? "",
    league: match.league ?? "A",
    no: match.no ?? String(index + 1),
    teamA: normalizeTeamName(match.teamA ?? ""),
    teamB: normalizeTeamName(match.teamB ?? ""),
    isTokyoWaves:
      isTokyoWaves(match.teamA ?? "") || isTokyoWaves(match.teamB ?? ""),
  }));
}

// 8チーム・1回戦4試合のシンプルなトーナメント形式にきっちり当てはまる場合のみ
// Claudeがbracketを返す。それ以外（プール制・多段階など）は空配列で返ってくるため、
// その場合はnullを返し、既存のトーナメント表データを上書きしない。
export function buildBracketData(result: ExtractionResult): BracketData | null {
  if (result.bracket.length !== 4) return null;
  return {
    round1: result.bracket.map((slot) => ({
      teamA: normalizeTeamName(slot.teamA ?? ""),
      teamB: normalizeTeamName(slot.teamB ?? ""),
    })),
    round1Winners: [null, null, null, null],
    semisWinners: [null, null],
    finalWinner: null,
  };
}

export function getMissingFieldLabels(result: ExtractionResult): string[] {
  const labels: string[] = [];
  if (!result.tournamentName) labels.push("大会名");
  if (!result.category) labels.push("区分／カテゴリ");
  if (result.leagues.length === 0) labels.push("リーグ・チーム");

  if (result.matches.length === 0) {
    labels.push("試合一覧（タイムテーブル）");
  } else {
    if (result.matches.some((m) => !m.date || !m.venue)) {
      labels.push("一部の試合の日付／会場");
    }
    if (result.matches.some((m) => !m.teamA || !m.teamB)) {
      labels.push("一部の試合のチーム名（対戦カード）");
    }
  }

  return labels;
}
