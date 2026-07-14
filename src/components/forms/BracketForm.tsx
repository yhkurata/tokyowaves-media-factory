import type { BracketData, WinnerChoice } from "../../types/bracket";
import { getSemisSlots, getFinalSlot, getChampion } from "../../lib/bracket";
import { reviewFieldClass } from "../../lib/formStyles";

type Props = {
  data: BracketData;
  onUpdateRound1Team: (
    matchIndex: number,
    side: "teamA" | "teamB",
    value: string,
  ) => void;
  onSetRound1Winner: (matchIndex: number, winner: WinnerChoice) => void;
  onSetSemisWinner: (matchIndex: number, winner: WinnerChoice) => void;
  onSetFinalWinner: (winner: WinnerChoice) => void;
};

function WinnerRadio({
  name,
  teamA,
  teamB,
  value,
  onChange,
}: {
  name: string;
  teamA: string;
  teamB: string;
  value: WinnerChoice;
  onChange: (winner: WinnerChoice) => void;
}) {
  const disabled = !teamA.trim() || !teamB.trim();
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <span className="shrink-0 text-gray-400">勝者：</span>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name={name}
          checked={value === "A"}
          disabled={disabled}
          onChange={() => onChange("A")}
        />
        {teamA || "チームA"}
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name={name}
          checked={value === "B"}
          disabled={disabled}
          onChange={() => onChange("B")}
        />
        {teamB || "チームB"}
      </label>
    </div>
  );
}

export function BracketForm({
  data,
  onUpdateRound1Team,
  onSetRound1Winner,
  onSetSemisWinner,
  onSetFinalWinner,
}: Props) {
  const semisSlots = getSemisSlots(data.round1, data.round1Winners);
  const finalSlot = getFinalSlot(semisSlots, data.semisWinners);
  const champion = getChampion(finalSlot, data.finalWinner);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">トーナメント表</h2>

      <div className="space-y-3">
        <span className="text-sm font-semibold text-gray-700">
          1回戦（8チーム）
        </span>
        {data.round1.map((slot, i) => (
          <div key={i} className="space-y-2 rounded-md border border-gray-300 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={slot.teamA}
                onChange={(e) =>
                  onUpdateRound1Team(i, "teamA", e.target.value)
                }
                placeholder="チームA"
                className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(slot.teamA)}`}
              />
              <span className="shrink-0 text-xs text-gray-400">vs</span>
              <input
                type="text"
                value={slot.teamB}
                onChange={(e) =>
                  onUpdateRound1Team(i, "teamB", e.target.value)
                }
                placeholder="チームB"
                className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${reviewFieldClass(slot.teamB)}`}
              />
            </div>
            <WinnerRadio
              name={`round1-${i}`}
              teamA={slot.teamA}
              teamB={slot.teamB}
              value={data.round1Winners[i]}
              onChange={(w) => onSetRound1Winner(i, w)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <span className="text-sm font-semibold text-gray-700">準決勝</span>
        {semisSlots.map((slot, i) => (
          <div key={i} className="rounded-md border border-gray-300 p-2">
            <p className="mb-2 text-xs text-gray-500">
              {slot.teamA || "1回戦の勝者"} vs {slot.teamB || "1回戦の勝者"}
            </p>
            <WinnerRadio
              name={`semis-${i}`}
              teamA={slot.teamA}
              teamB={slot.teamB}
              value={data.semisWinners[i]}
              onChange={(w) => onSetSemisWinner(i, w)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <span className="text-sm font-semibold text-gray-700">決勝</span>
        <div className="rounded-md border border-gray-300 p-2">
          <p className="mb-2 text-xs text-gray-500">
            {finalSlot.teamA || "準決勝の勝者"} vs{" "}
            {finalSlot.teamB || "準決勝の勝者"}
          </p>
          <WinnerRadio
            name="final"
            teamA={finalSlot.teamA}
            teamB={finalSlot.teamB}
            value={data.finalWinner}
            onChange={onSetFinalWinner}
          />
        </div>
      </div>

      <div className="rounded-md bg-yellow-50 p-3 text-sm font-bold text-gray-800">
        🏆 優勝：{champion || "未定"}
      </div>
    </section>
  );
}
