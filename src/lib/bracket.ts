import type { BracketMatchSlot, WinnerChoice } from "../types/bracket";

export function pickWinner(
  slot: { teamA: string; teamB: string },
  winner: WinnerChoice,
): string {
  if (winner === "A") return slot.teamA;
  if (winner === "B") return slot.teamB;
  return "";
}

export function getSemisSlots(
  round1: BracketMatchSlot[],
  round1Winners: WinnerChoice[],
): BracketMatchSlot[] {
  return [
    {
      teamA: pickWinner(round1[0], round1Winners[0]),
      teamB: pickWinner(round1[1], round1Winners[1]),
    },
    {
      teamA: pickWinner(round1[2], round1Winners[2]),
      teamB: pickWinner(round1[3], round1Winners[3]),
    },
  ];
}

export function getFinalSlot(
  semisSlots: BracketMatchSlot[],
  semisWinners: WinnerChoice[],
): BracketMatchSlot {
  return {
    teamA: pickWinner(semisSlots[0], semisWinners[0]),
    teamB: pickWinner(semisSlots[1], semisWinners[1]),
  };
}

export function getChampion(
  finalSlot: BracketMatchSlot,
  finalWinner: WinnerChoice,
): string {
  return pickWinner(finalSlot, finalWinner);
}
