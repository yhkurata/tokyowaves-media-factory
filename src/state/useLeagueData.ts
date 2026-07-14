import { useState } from "react";
import type { LeagueGroup } from "../types/league";

function createId() {
  return crypto.randomUUID();
}

function createTeam() {
  return { id: createId(), name: "", isTokyoWaves: false };
}

function createLeague(index: number): LeagueGroup {
  return {
    id: createId(),
    name: `${String.fromCharCode(65 + index)}リーグ`,
    teams: [createTeam()],
  };
}

export function useLeagueData() {
  const [leagues, setLeagues] = useState<LeagueGroup[]>([createLeague(0)]);

  const addLeague = () => {
    setLeagues((prev) => [...prev, createLeague(prev.length)]);
  };

  const removeLeague = (leagueId: string) => {
    setLeagues((prev) => prev.filter((league) => league.id !== leagueId));
  };

  const updateLeagueName = (leagueId: string, name: string) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId ? { ...league, name } : league,
      ),
    );
  };

  const addTeam = (leagueId: string) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? { ...league, teams: [...league.teams, createTeam()] }
          : league,
      ),
    );
  };

  const removeTeam = (leagueId: string, teamId: string) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? {
              ...league,
              teams: league.teams.filter((team) => team.id !== teamId),
            }
          : league,
      ),
    );
  };

  const updateTeamName = (leagueId: string, teamId: string, name: string) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? {
              ...league,
              teams: league.teams.map((team) =>
                team.id === teamId ? { ...team, name } : team,
              ),
            }
          : league,
      ),
    );
  };

  const setTeamIsTokyoWaves = (
    leagueId: string,
    teamId: string,
    isTokyoWaves: boolean,
  ) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? {
              ...league,
              teams: league.teams.map((team) =>
                team.id === teamId ? { ...team, isTokyoWaves } : team,
              ),
            }
          : league,
      ),
    );
  };

  // AI解析結果の反映用：抽出できなかった場合は空にせず初期状態を維持する
  const replaceLeagues = (next: LeagueGroup[]) => {
    setLeagues(next.length > 0 ? next : [createLeague(0)]);
  };

  // 保存済みプロジェクトの読み込み用：空配列も含めて常に完全に置き換える
  const loadLeagues = (next: LeagueGroup[]) => {
    setLeagues(next);
  };

  return {
    leagues,
    addLeague,
    removeLeague,
    updateLeagueName,
    addTeam,
    removeTeam,
    updateTeamName,
    setTeamIsTokyoWaves,
    replaceLeagues,
    loadLeagues,
  };
}
