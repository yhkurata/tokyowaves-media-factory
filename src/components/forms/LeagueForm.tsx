import type { LeagueGroup } from "../../types/league";

type Props = {
  leagues: LeagueGroup[];
  onAddLeague: () => void;
  onRemoveLeague: (leagueId: string) => void;
  onUpdateLeagueName: (leagueId: string, name: string) => void;
  onAddTeam: (leagueId: string) => void;
  onRemoveTeam: (leagueId: string, teamId: string) => void;
  onUpdateTeamName: (leagueId: string, teamId: string, name: string) => void;
  onSetTeamIsTokyoWaves: (
    leagueId: string,
    teamId: string,
    isTokyoWaves: boolean,
  ) => void;
};

export function LeagueForm({
  leagues,
  onAddLeague,
  onRemoveLeague,
  onUpdateLeagueName,
  onAddTeam,
  onRemoveTeam,
  onUpdateTeamName,
  onSetTeamIsTokyoWaves,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">リーグ組み合わせ</h2>
        <button
          type="button"
          onClick={onAddLeague}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + リーグを追加
        </button>
      </div>

      <div className="space-y-4">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="rounded-md border border-gray-300 p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={league.name}
                onChange={(e) => onUpdateLeagueName(league.id, e.target.value)}
                placeholder="例：Aリーグ"
                className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm font-semibold focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onRemoveLeague(league.id)}
                className="shrink-0 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                リーグ削除
              </button>
            </div>

            <div className="space-y-2">
              {league.teams.map((team, index) => (
                <div key={team.id} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs text-gray-400">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) =>
                      onUpdateTeamName(league.id, team.id, e.target.value)
                    }
                    placeholder="チーム名"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={team.isTokyoWaves}
                      onChange={(e) =>
                        onSetTeamIsTokyoWaves(
                          league.id,
                          team.id,
                          e.target.checked,
                        )
                      }
                    />
                    東京WAVES
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveTeam(league.id, team.id)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAddTeam(league.id)}
              className="mt-2 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              + チームを追加
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
