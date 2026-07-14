import { useMemo, useRef, useState } from "react";
import type { Tournament } from "../../types/tournament";
import type { LeagueGroup } from "../../types/league";
import type { TimetableMatch } from "../../types/timetable";
import type { BracketData } from "../../types/bracket";
import { buildExportUnits } from "../../lib/templateSections";
import { renderNodeToPngBlob } from "../../lib/exportImage";
import { deliverAsZip, type ExportedFile } from "../../lib/exportDelivery";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { PostImageTemplate } from "../preview/PostImageTemplate";
import { LeagueBoardTemplate } from "../preview/LeagueBoardTemplate";
import { TimetableTemplate } from "../preview/TimetableTemplate";
import { TournamentTemplate } from "../preview/TournamentTemplate";

type Props = {
  tournament: Tournament;
  leagues: LeagueGroup[];
  matches: TimetableMatch[];
  bracket: BracketData;
  timetableRound: string;
  onBackToConfirm: () => void;
};

type UnitStatus = "pending" | "exporting" | "done" | "error";

export function ExportStep({
  tournament,
  leagues,
  matches,
  bracket,
  timetableRound,
  onBackToConfirm,
}: Props) {
  const units = useMemo(
    () => buildExportUnits({ tournament, leagues, matches, bracket }),
    [tournament, leagues, matches, bracket],
  );
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [statuses, setStatuses] = useState<Record<string, UnitStatus>>(() =>
    Object.fromEntries(units.map((u) => [u.id, "pending" as UnitStatus])),
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleExportAll = async () => {
    setIsRunning(true);

    // フェーズ1：全ユニットをPNG Blobとして描画する（配信方式に依存しない）
    const rendered: ExportedFile[] = [];
    for (const unit of units) {
      setStatuses((prev) => ({ ...prev, [unit.id]: "exporting" }));
      const node = nodeRefs.current[unit.id];
      if (!node) {
        setStatuses((prev) => ({ ...prev, [unit.id]: "error" }));
        continue;
      }
      try {
        const blob = await renderNodeToPngBlob(node, IMAGE_WIDTH, IMAGE_HEIGHT);
        rendered.push({ filename: unit.filename, blob });
        setStatuses((prev) => ({ ...prev, [unit.id]: "done" }));
      } catch (err) {
        console.error(`PNG生成に失敗しました: ${unit.filename}`, err);
        setStatuses((prev) => ({ ...prev, [unit.id]: "error" }));
      }
    }

    // フェーズ2：配信（ZIPにまとめて1回のダウンロードにする）
    const zipFilename = `${tournament.name.trim() || "tokyowaves"}_投稿画像一式.zip`;
    await deliverAsZip(rendered, zipFilename);

    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      <section className="mx-auto max-w-xl rounded-md border border-gray-300 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">PNG一括出力</h2>
        <p className="mt-1 text-sm text-gray-500">
          入力済みのテンプレート{units.length}件を1つのZIPファイルにまとめてダウンロードします。
        </p>

        {units.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            出力できるデータがありません。「③
            確認・編集」に戻って内容を入力してください。
          </p>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {units.map((unit) => (
              <li key={unit.id} className="flex items-center gap-2 text-sm">
                <span>
                  {statuses[unit.id] === "done" && "✅"}
                  {statuses[unit.id] === "exporting" && "⏳"}
                  {statuses[unit.id] === "error" && "⚠️"}
                  {statuses[unit.id] === "pending" && "⬜"}
                </span>
                <span className="text-gray-700">{unit.filename}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToConfirm}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            ③ 確認・編集に戻る
          </button>
          <button
            type="button"
            onClick={() => void handleExportAll()}
            disabled={units.length === 0 || isRunning}
            className="rounded-md bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "出力中..." : "ZIPで一括出力する"}
          </button>
        </div>
      </section>

      {/* 画面外に実寸で描画し、順番にPNG化する（ユーザーには見えない） */}
      <div
        aria-hidden
        style={{ position: "fixed", top: 0, left: -99999, width: IMAGE_WIDTH }}
      >
        {units.map((unit) => (
          <div
            key={unit.id}
            ref={(el) => {
              nodeRefs.current[unit.id] = el;
            }}
            style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
          >
            {unit.kind === "cover" && (
              <PostImageTemplate tournament={tournament} />
            )}
            {unit.kind === "league" && (
              <LeagueBoardTemplate leagues={leagues} />
            )}
            {unit.kind === "timetable" && (
              <TimetableTemplate
                date={unit.date ?? ""}
                venue={unit.venue ?? ""}
                round={timetableRound}
                matches={unit.matches ?? []}
              />
            )}
            {unit.kind === "tournament" && (
              <TournamentTemplate data={bracket} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
