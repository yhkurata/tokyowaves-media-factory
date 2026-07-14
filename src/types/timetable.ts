export interface TimetableMatch {
  id: string;
  date: string; // ISO形式 "YYYY-MM-DD"。所属する大会日（TournamentDay.date）に対応
  venue: string; // 会場名。所属する会場（TournamentVenue.name）に対応
  time: string;
  league: string;
  no: string;
  teamA: string;
  teamB: string;
  isTokyoWaves: boolean;
}

export interface TimetableInfo {
  round: string;
}
