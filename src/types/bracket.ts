export type WinnerChoice = "A" | "B" | null;

export interface BracketMatchSlot {
  teamA: string;
  teamB: string;
}

export interface BracketData {
  round1: BracketMatchSlot[]; // 4試合・8チーム
  round1Winners: WinnerChoice[]; // 4
  semisWinners: WinnerChoice[]; // 2
  finalWinner: WinnerChoice;
}
