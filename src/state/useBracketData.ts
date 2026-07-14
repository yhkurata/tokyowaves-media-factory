import { useState } from "react";
import type { BracketData, WinnerChoice } from "../types/bracket";

const initialData: BracketData = {
  round1: [
    { teamA: "", teamB: "" },
    { teamA: "", teamB: "" },
    { teamA: "", teamB: "" },
    { teamA: "", teamB: "" },
  ],
  round1Winners: [null, null, null, null],
  semisWinners: [null, null],
  finalWinner: null,
};

export function useBracketData() {
  const [data, setData] = useState<BracketData>(initialData);

  const updateRound1Team = (
    matchIndex: number,
    side: "teamA" | "teamB",
    value: string,
  ) => {
    setData((prev) => ({
      ...prev,
      round1: prev.round1.map((slot, i) =>
        i === matchIndex ? { ...slot, [side]: value } : slot,
      ),
    }));
  };

  const setRound1Winner = (matchIndex: number, winner: WinnerChoice) => {
    setData((prev) => ({
      ...prev,
      round1Winners: prev.round1Winners.map((w, i) =>
        i === matchIndex ? winner : w,
      ),
    }));
  };

  const setSemisWinner = (matchIndex: number, winner: WinnerChoice) => {
    setData((prev) => ({
      ...prev,
      semisWinners: prev.semisWinners.map((w, i) =>
        i === matchIndex ? winner : w,
      ),
    }));
  };

  const setFinalWinner = (winner: WinnerChoice) => {
    setData((prev) => ({ ...prev, finalWinner: winner }));
  };

  // 保存済みプロジェクトの読み込み用：常に完全に置き換える
  const loadBracket = (next: BracketData) => {
    setData(next);
  };

  return {
    data,
    updateRound1Team,
    setRound1Winner,
    setSemisWinner,
    setFinalWinner,
    loadBracket,
  };
}
