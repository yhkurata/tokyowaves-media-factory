export interface TournamentVenue {
  id: string;
  name: string;
}

export interface TournamentDay {
  id: string;
  date: string; // ISO形式 "YYYY-MM-DD"
  venues: TournamentVenue[];
}

export interface Tournament {
  name: string;
  days: TournamentDay[];
}
