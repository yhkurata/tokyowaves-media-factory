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
    renameDate,
    renameVenue,
    removeMatchesForDate,
    removeMatchesForVenue,
  };
}
