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
  isEmpty: boolean;
  onChange: (value: string) => void;
}

export interface ReviewGroup {
  id: string;
  groupLabel: string;
  items: ReviewItem[];
}

// 対戦カード（チームA・B）が未入力の試合の割合。
// 一定以上まとまって欠けている場合は、手入力ではなく「組み合わせ表等の追加アップロード」を
// 案内する目安として使う（1〜2件程度の抜けでは案内を出さない）。
export function teamNameGapRatio(matches: TimetableMatch[]): number {
  if (matches.length === 0) return 0;
  const missing = matches.filter(
    (m) => m.teamA.trim() === "" || m.teamB.trim() === "",
  ).length;
  return missing / matches.length;
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

function makeItem(
  id: string,
  label: string,
  value: string,
  placeholder: string,
  onChange: (value: string) => void,
): ReviewItem {
  return { id, label, value, placeholder, isEmpty: value.trim() === "", onChange };
}

// このツールが把握している「入力が必要になりうる項目」を、空欄かどうかに関わらず
// すべて生成する。空欄かどうか（isEmpty）は呼び出し側（要確認リストのフック）が
// 「一度でも要確認になった項目は、埋まっても表示し続ける」判断に使う。
export function buildReviewItems(params: BuildReviewItemsParams): ReviewGroup[] {
  const groups: ReviewGroup[] = [];

  if (tournamentHasData(params.tournament)) {
    const coverItems: ReviewItem[] = [];
    coverItems.push(
      makeItem(
        "tournament-name",
        "大会名",
        params.tournament.name,
        "例：第◯回東京都春季水球大会",
        params.onUpdateName,
      ),
    );
    params.tournament.days.forEach((day, dayIndex) => {
      coverItems.push(
        makeItem(
          `day-${day.id}-date`,
          `開催日${dayIndex + 1}`,
          day.date,
          "日付",
          (v) => params.onUpdateDayDate(day.id, v),
        ),
      );
      day.venues.forEach((venue) => {
        coverItems.push(
          makeItem(
            `venue-${venue.id}`,
            `${day.date ? formatDisplayDate(day.date) : `開催日${dayIndex + 1}`} 会場`,
            venue.name,
            "会場名",
            (v) => params.onUpdateVenueName(day.id, venue.id, v),
          ),
        );
      });
    });
    groups.push({ id: "cover", groupLabel: "大会情報", items: coverItems });
  }

  if (leaguesHasData(params.leagues)) {
    const leagueItems: ReviewItem[] = [];
    params.leagues.forEach((league) => {
      leagueItems.push(
        makeItem(
          `league-${league.id}-name`,
          "リーグ名",
          league.name,
          "例：Aリーグ",
          (v) => params.onUpdateLeagueName(league.id, v),
        ),
      );
      league.teams.forEach((team, teamIndex) => {
        leagueItems.push(
          makeItem(
            `team-${team.id}`,
            `${league.name || "リーグ"} チーム${teamIndex + 1}`,
            team.name,
            "チーム名",
            (v) => params.onUpdateTeamName(league.id, team.id, v),
          ),
        );
      });
    });
    groups.push({
      id: "league",
      groupLabel: "リーグ組み合わせ",
      items: leagueItems,
    });
  }

  const timetableGroups = new Map<string, ReviewItem[]>();
  params.matches.forEach((match) => {
    const matchLabel =
      match.no.trim() !== ""
        ? `No.${match.no}`
        : match.time.trim() !== ""
          ? match.time
          : "試合";
    const items: ReviewItem[] = [
      makeItem(`match-${match.id}-no`, `${matchLabel} 試合No.`, match.no, "No.", (v) =>
        params.onUpdateMatch(match.id, { no: v }),
      ),
      makeItem(
        `match-${match.id}-time`,
        `${matchLabel} 時間`,
        match.time,
        "例：09:12",
        (v) => params.onUpdateMatch(match.id, { time: v }),
      ),
      makeItem(
        `match-${match.id}-teamA`,
        `${matchLabel} チームA`,
        match.teamA,
        "チームA",
        (v) => params.onUpdateMatch(match.id, { teamA: v }),
      ),
      makeItem(
        `match-${match.id}-teamB`,
        `${matchLabel} チームB`,
        match.teamB,
        "チームB",
        (v) => params.onUpdateMatch(match.id, { teamB: v }),
      ),
    ];
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
      bracketItems.push(
        makeItem(
          `bracket-${i}-teamA`,
          `1回戦${i + 1} チームA`,
          slot.teamA,
          "チームA",
          (v) => params.onUpdateRound1Team(i, "teamA", v),
        ),
      );
      bracketItems.push(
        makeItem(
          `bracket-${i}-teamB`,
          `1回戦${i + 1} チームB`,
          slot.teamB,
          "チームB",
          (v) => params.onUpdateRound1Team(i, "teamB", v),
        ),
      );
    });
    groups.push({
      id: "tournament",
      groupLabel: "トーナメント表",
      items: bracketItems,
    });
  }

  return groups;
}
