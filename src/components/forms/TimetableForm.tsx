import type { TournamentDay, TournamentVenue } from "../../types/tournament";
import type { TimetableInfo, TimetableMatch } from "../../types/timetable";
import { formatDisplayDate } from "../../lib/tournamentSchedule";
import { reviewFieldClass } from "../../lib/formStyles";

const LEAGUE_OPTIONS = ["A", "B", "C", "D"];

type Props = {
  tournamentDays: TournamentDay[];
  selectedDay: TournamentDay | undefined;
  selectedVenue: TournamentVenue | undefined;
  onSelectDay: (dayId: string) => void;
  onSelectVenue: (venueId: string) => void;
  info: TimetableInfo;
  onUpdateInfo: (patch: Partial<TimetableInfo>) => void;
  matches: TimetableMatch[];
  onAddMatch: (date: string, venue: string) => void;
  onRemoveMatch: (id: string) => void;
  onUpdateMatch: (id: string, patch: Partial<TimetableMatch>) => void;
};

export function TimetableForm({
  tournamentDays,
  selectedDay,
  selectedVenue,
  onSelectDay,
  onSelectVenue,
  info,
  onUpdateInfo,
  matches,
  onAddMatch,
  onRemoveMatch,
  onUpdateMatch,
}: Props) {
  if (tournamentDays.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">タイムテーブル</h2>
        <p className="text-sm text-gray-500">
          先に「大会情報」タブで開催日・会場を登録してください。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">タイムテーブル</h2>

      <div>
        <span className="mb-1 block text-xs font-medium text-gray-700">
          開催日
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tournamentDays.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                selectedDay?.id === day.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {day.date ? formatDisplayDate(day.date) : "日付未設定"}
            </button>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div>
          <span className="mb-1 block text-xs font-medium text-gray-700">
            会場
          </span>
          {selectedDay.venues.length === 0 ? (
            <p className="text-xs text-gray-400">
              この日の会場が未登録です。「大会情報」タブで会場を追加してください。
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedDay.venues.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => onSelectVenue(venue.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    selectedVenue?.id === venue.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {venue.name || "会場名未設定"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          ラウンド（大会全体で共通）
        </label>
        <input
          type="text"
          value={info.round}
          onChange={(e) => onUpdateInfo({ round: e.target.value })}
          placeholder="例：予選リーグ"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {selectedDay && selectedVenue && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {formatDisplayDate(selectedDay.date)}・{selectedVenue.name}
              の試合一覧
            </span>
            <button
              type="button"
              onClick={() => onAddMatch(selectedDay.date, selectedVenue.name)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              + 試合を追加
            </button>
          </div>

          <div className="space-y-2">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-md border border-gray-300 p-2"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={match.no}
                    onChange={(e) =>
                      onUpdateMatch(match.id, { no: e.target.value })
                    }
                    placeholder="No."
                    title="試合No."
                    className={`w-12 shrink-0 rounded-md border px-1.5 py-1 text-center text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(match.no)}`}
                  />
                  <input
                    type="text"
                    value={match.time}
                    onChange={(e) =>
                      onUpdateMatch(match.id, { time: e.target.value })
                    }
                    placeholder="時間 例:09:12"
                    className={`w-20 shrink-0 rounded-md border px-2 py-1 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(match.time)}`}
                  />
                  <select
                    value={match.league}
                    onChange={(e) =>
                      onUpdateMatch(match.id, { league: e.target.value })
                    }
                    className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {LEAGUE_OPTIONS.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label className="ml-auto flex shrink-0 items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={match.isTokyoWaves}
                      onChange={(e) =>
                        onUpdateMatch(match.id, {
                          isTokyoWaves: e.target.checked,
                        })
                      }
                    />
                    東京WAVES
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveMatch(match.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={match.teamA}
                    onChange={(e) =>
                      onUpdateMatch(match.id, { teamA: e.target.value })
                    }
                    placeholder="チームA（要確認）"
                    className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(match.teamA)}`}
                  />
                  <span className="shrink-0 text-xs text-gray-400">vs</span>
                  <input
                    type="text"
                    value={match.teamB}
                    onChange={(e) =>
                      onUpdateMatch(match.id, { teamB: e.target.value })
                    }
                    placeholder="チームB（要確認）"
                    className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(match.teamB)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
