export interface Team {
  id: string;
  name: string;
  isTokyoWaves: boolean;
}

export interface LeagueGroup {
  id: string;
  name: string;
  teams: Team[];
}
