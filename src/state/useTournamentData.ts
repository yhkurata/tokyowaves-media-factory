import { useState } from "react";
import type { Tournament, TournamentDay } from "../types/tournament";

function createId() {
  return crypto.randomUUID();
}

const initialTournament: Tournament = {
  name: "",
  days: [],
};

export function useTournamentData() {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);

  const updateName = (name: string) => {
    setTournament((prev) => ({ ...prev, name }));
  };

  const addDay = () => {
    setTournament((prev) => ({
      ...prev,
      days: [...prev.days, { id: createId(), date: "", venues: [] }],
    }));
  };

  const removeDay = (dayId: string) => {
    setTournament((prev) => ({
      ...prev,
      days: prev.days.filter((day) => day.id !== dayId),
    }));
  };

  const updateDayDate = (dayId: string, date: string) => {
    setTournament((prev) => ({
      ...prev,
      days: prev.days.map((day) => (day.id === dayId ? { ...day, date } : day)),
    }));
  };

  const addVenue = (dayId: string) => {
    setTournament((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? { ...day, venues: [...day.venues, { id: createId(), name: "" }] }
          : day,
      ),
    }));
  };

  const removeVenue = (dayId: string, venueId: string) => {
    setTournament((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? { ...day, venues: day.venues.filter((v) => v.id !== venueId) }
          : day,
      ),
    }));
  };

  const updateVenueName = (dayId: string, venueId: string, name: string) => {
    setTournament((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              venues: day.venues.map((v) =>
                v.id === venueId ? { ...v, name } : v,
              ),
            }
          : day,
      ),
    }));
  };

  // AI解析結果の反映用：空の項目は既存の入力を残す（部分的な抽出結果で上書きしない）
  const replaceTournament = (next: { name: string; days: TournamentDay[] }) => {
    setTournament((prev) => ({
      name: next.name || prev.name,
      days: next.days.length > 0 ? next.days : prev.days,
    }));
  };

  // 保存済みプロジェクトの読み込み用：常に完全に置き換える
  const loadTournament = (next: Tournament) => {
    setTournament(next);
  };

  return {
    tournament,
    updateName,
    addDay,
    removeDay,
    updateDayDate,
    addVenue,
    removeVenue,
    updateVenueName,
    replaceTournament,
    loadTournament,
  };
}
