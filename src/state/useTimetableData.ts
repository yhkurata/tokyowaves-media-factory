import { useState } from "react";
import type { TimetableInfo, TimetableMatch } from "../types/timetable";

function createId() {
  return crypto.randomUUID();
}

function createMatch(date: string, venue: string, no: number): TimetableMatch {
  return {
    id: createId(),
    date,
    venue,
    time: "",
    league: "A",
    no: String(no),
    teamA: "",
    teamB: "",
    isTokyoWaves: false,
  };
}

const initialInfo: TimetableInfo = {
  round: "予選リーグ",
};

export function useTimetableData() {
  const [info, setInfo] = useState<TimetableInfo>(initialInfo);
  const [matches, setMatches] = useState<TimetableMatch[]>([]);

  const updateInfo = (patch: Partial<TimetableInfo>) => {
    setInfo((prev) => ({ ...prev, ...patch }));
  };

  const addMatch = (date: string, venue: string) => {
    setMatches((prev) => {
      const sameSlot = prev.filter((m) => m.date === date && m.venue === venue);
      return [...prev, createMatch(date, venue, sameSlot.length + 1)];
    });
  };

  const removeMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMatch = (id: string, patch: Partial<TimetableMatch>) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const replaceMatches = (next: TimetableMatch[]) => {
    setMatches(next);
  };

  // AI解析結果の反映用：試合No.をキーに、既存の値は残したまま空欄だけを埋める。
  // タイムテーブルと組み合わせ表など、複数の資料を別々のタイミングで解析しても
  // 後から解析した結果が先に入力済みの内容を上書きしないようにするための統合ロジック。
  const mergeMatches = (incoming: TimetableMatch[]) => {
    setMatches((prev) => {
      const indexByNo = new Map<string, number>();
      prev.forEach((m, i) => {
        if (m.no.trim() !== "") indexByNo.set(m.no.trim(), i);
      });

      const next = [...prev];
      const appended: TimetableMatch[] = [];

      incoming.forEach((inc) => {
        const key = inc.no.trim();
        const existingIndex = key !== "" ? indexByNo.get(key) : undefined;
        if (existingIndex === undefined) {
          appended.push(inc);
          return;
        }
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          date: existing.date || inc.date,
          venue: existing.venue || inc.venue,
          time: existing.time || inc.time,
          league: existing.league || inc.league,
          teamA: existing.teamA || inc.teamA,
          teamB: existing.teamB || inc.teamB,
        };
      });

      return [...next, ...appended];
    });
  };

  const renameDate = (oldDate: string, newDate: string) => {
    if (oldDate === newDate) return;
    setMatches((prev) =>
      prev.map((m) => (m.date === oldDate ? { ...m, date: newDate } : m)),
    );
  };

  const renameVenue = (date: string, oldVenue: string, newVenue: string) => {
    if (oldVenue === newVenue) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.date === date && m.venue === oldVenue ? { ...m, venue: newVenue } : m,
      ),
    );
  };

  const removeMatchesForDate = (date: string) => {
    setMatches((prev) => prev.filter((m) => m.date !== date));
  };

  const removeMatchesForVenue = (date: string, venue: string) => {
    setMatches((prev) =>
      prev.filter((m) => !(m.date === date && m.venue === venue)),
    );
  };

  return {
    info,
    updateInfo,
    matches,
    addMatch,
    removeMatch,
    updateMatch,
    replaceMatches,
    mergeMatches,
    renameDate,
    renameVenue,
    removeMatchesForDate,
    removeMatchesForVenue,
  };
}
