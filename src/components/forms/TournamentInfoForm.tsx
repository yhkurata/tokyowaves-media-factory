import type { Tournament } from "../../types/tournament";
import { reviewFieldClass } from "../../lib/formStyles";

type Props = {
  tournament: Tournament;
  onUpdateName: (name: string) => void;
  onAddDay: () => void;
  onRemoveDay: (dayId: string) => void;
  onUpdateDayDate: (dayId: string, date: string) => void;
  onAddVenue: (dayId: string) => void;
  onRemoveVenue: (dayId: string, venueId: string) => void;
  onUpdateVenueName: (dayId: string, venueId: string, name: string) => void;
};

export function TournamentInfoForm({
  tournament,
  onUpdateName,
  onAddDay,
  onRemoveDay,
  onUpdateDayDate,
  onAddVenue,
  onRemoveVenue,
  onUpdateVenueName,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">大会情報</h2>

      <div>
        <label
          htmlFor="tournament-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          大会名
        </label>
        <input
          id="tournament-name"
          type="text"
          value={tournament.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="例：第◯回東京都春季水球大会"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            開催日・会場
          </span>
          <button
            type="button"
            onClick={onAddDay}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            ＋開催日を追加
          </button>
        </div>

        {tournament.days.length === 0 && (
          <p className="text-xs text-gray-400">
            開催日がまだ登録されていません。大会は複数日・複数会場に対応しています。
          </p>
        )}

        {tournament.days.map((day) => (
          <div
            key={day.id}
            className="space-y-2 rounded-md border border-gray-300 p-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={day.date}
                onChange={(e) => onUpdateDayDate(day.id, e.target.value)}
                className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(day.date)}`}
              />
              <button
                type="button"
                onClick={() => onRemoveDay(day.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                この日を削除
              </button>
            </div>

            <div className="space-y-1.5 pl-2">
              <span className="text-xs font-medium text-gray-500">会場</span>
              {day.venues.map((venue) => (
                <div key={venue.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={venue.name}
                    onChange={(e) =>
                      onUpdateVenueName(day.id, venue.id, e.target.value)
                    }
                    placeholder="会場名（例：前橋南高校）"
                    className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(venue.name)}`}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveVenue(day.id, venue.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onAddVenue(day.id)}
                className="rounded-md border border-blue-300 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                ＋会場を追加
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
