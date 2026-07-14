import type { Tournament } from "../types/tournament";
import type { LeagueGroup } from "../types/league";
import type { TimetableMatch } from "../types/timetable";
import type { BracketData } from "../types/bracket";
import { formatDisplayDate } from "./tournamentSchedule";
import { tournamentHasData, leaguesHasData, bracketHasData } from "./templateSections";

export interface ReviewItem {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export interface ReviewGroup {
  id: string;
  groupLabel: string;
  items: ReviewItem[];
}

interface BuildReviewItemsParams {
  tournament: Tournament;
  leagues: LeagueGroup[];
  matches: TimetableMatch[];
  bracket: BracketData;
  onUpdateName: (name: string) => void;
  onUpdateDayDate: (dayId: string, date: string) => void;
  onUpdateVenueName: (dayId: string, venueId: string, name: string) => void;
  onUpdateLeagueName: (leagueId: string, name: string) => void;
  onUpdateTeamName: (leagueId: string, teamId: string, name: string) => void;
  onUpdateMatch: (id: string, patch: Partial<TimetableMatch>) => void;
  onUpdateRound1Team: (
    matchIndex: number,
    side: "teamA" | "teamB",
    value: string,
  ) => void;
}

// AIが自動入力できなかった項目だけを、確認・編集すべき最小限のチェックリストとして抽出する。
// まだ何も入力されていないセクション（テンプレートを使う予定がない）は対象外にする。
export function buildReviewItems(params: BuildReviewItemsParams): ReviewGroup[] {
  const groups: ReviewGroup[] = [];

  if (tournamentHasData(params.tournament)) {
    const coverItems: ReviewItem[] = [];
    if (params.tournament.name.trim() === "") {
      coverItems.push({
        id: "tournament-name",
        label: "大会名",
        value: params.tournament.name,
        placeholder: "例：第◯回東京都春季水球大会",
        onChange: params.onUpdateName,
      });
    }
    params.tournament.days.forEach((day, dayIndex) => {
      if (day.date.trim() === "") {
        coverItems.push({
          id: `day-${day.id}-date`,
          label: `開催日${dayIndex + 1}`,
          value: day.date,
          placeholder: "日付",
          onChange: (v) => params.onUpdateDayDate(day.id, v),
        });
      }
      day.venues.forEach((venue) => {
        if (venue.name.trim() === "") {
          coverItems.push({
            id: `venue-${venue.id}`,
            label: `${day.date ? formatDisplayDate(day.date) : `開催日${dayIndex + 1}`} 会場`,
            value: venue.name,
            placeholder: "会場名",
            onChange: (v) => params.onUpdateVenueName(day.id, venue.id, v),
          });
        }
      });
    });
    if (coverItems.length > 0) {
      groups.push({ id: "cover", groupLabel: "大会情報", items: coverItems });
    }
  }

  if (leaguesHasData(params.leagues)) {
    const leagueItems: ReviewItem[] = [];
    params.leagues.forEach((league) => {
      if (league.name.trim() === "") {
        leagueItems.push({
          id: `league-${league.id}-name`,
          label: "リーグ名",
          value: league.name,
          placeholder: "例：Aリーグ",
          onChange: (v) => params.onUpdateLeagueName(league.id, v),
        });
      }
      league.teams.forEach((team, teamIndex) => {
        if (team.name.trim() === "") {
          leagueItems.push({
            id: `team-${team.id}`,
            label: `${league.name || "リーグ"} チーム${teamIndex + 1}`,
            value: team.name,
            placeholder: "チーム名",
            onChange: (v) => params.onUpdateTeamName(league.id, team.id, v),
          });
        }
      });
    });
    if (leagueItems.length > 0) {
      groups.push({
        id: "league",
        groupLabel: "リーグ組み合わせ",
        items: leagueItems,
      });
    }
  }

  const timetableGroups = new Map<string, ReviewItem[]>();
  params.matches.forEach((match) => {
    const matchLabel =
      match.no.trim() !== ""
        ? `No.${match.no}`
        : match.time.trim() !== ""
          ? match.time
          : "試合";
    const items: ReviewItem[] = [];
    if (match.no.trim() === "") {
      items.push({
        id: `match-${match.id}-no`,
        label: `${matchLabel} 試合No.`,
        value: match.no,
        placeholder: "No.",
        onChange: (v) => params.onUpdateMatch(match.id, { no: v }),
      });
    }
    if (match.time.trim() === "") {
      items.push({
        id: `match-${match.id}-time`,
        label: `${matchLabel} 時間`,
        value: match.time,
        placeholder: "例：09:12",
        onChange: (v) => params.onUpdateMatch(match.id, { time: v }),
      });
    }
    if (match.teamA.trim() === "") {
      items.push({
        id: `match-${match.id}-teamA`,
        label: `${matchLabel} チームA`,
        value: match.teamA,
        placeholder: "チームA",
        onChange: (v) => params.onUpdateMatch(match.id, { teamA: v }),
      });
    }
    if (match.teamB.trim() === "") {
      items.push({
        id: `match-${match.id}-teamB`,
        label: `${matchLabel} チームB`,
        value: match.teamB,
        placeholder: "チームB",
        onChange: (v) => params.onUpdateMatch(match.id, { teamB: v }),
      });
    }
    if (items.length === 0) return;
    const key = `${match.date}__${match.venue}`;
    timetableGroups.set(key, [...(timetableGroups.get(key) ?? []), ...items]);
  });
  timetableGroups.forEach((items, key) => {
    const [date, venue] = key.split("__");
    groups.push({
      id: `timetable-${key}`,
      groupLabel: `タイムテーブル：${date ? formatDisplayDate(date) : "日付未定"}${venue ? `・${venue}` : ""}`,
      items,
    });
  });

  if (bracketHasData(params.bracket)) {
    const bracketItems: ReviewItem[] = [];
    params.bracket.round1.forEach((slot, i) => {
      if (slot.teamA.trim() === "") {
        bracketItems.push({
          id: `bracket-${i}-teamA`,
          label: `1回戦${i + 1} チームA`,
          value: slot.teamA,
          placeholder: "チームA",
          onChange: (v) => params.onUpdateRound1Team(i, "teamA", v),
        });
      }
      if (slot.teamB.trim() === "") {
        bracketItems.push({
          id: `bracket-${i}-teamB`,
          label: `1回戦${i + 1} チームB`,
          value: slot.teamB,
          placeholder: "チームB",
          onChange: (v) => params.onUpdateRound1Team(i, "teamB", v),
        });
      }
    });
    if (bracketItems.length > 0) {
      groups.push({
        id: "tournament",
        groupLabel: "トーナメント表",
        items: bracketItems,
      });
    }
  }

  return groups;
}
