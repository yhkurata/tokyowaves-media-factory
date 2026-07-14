import type { Tournament } from "../../types/tournament";
import type { LeagueGroup } from "../../types/league";
import type { BracketData } from "../../types/bracket";
import type { ExportUnit } from "../../lib/templateSections";
import { PostImageTemplate } from "../preview/PostImageTemplate";
import { LeagueBoardTemplate } from "../preview/LeagueBoardTemplate";
import { TimetableTemplate } from "../preview/TimetableTemplate";
import { TournamentTemplate } from "../preview/TournamentTemplate";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";

const PREVIEW_SCALE = 0.4;

// ファイル名の先頭の連番と拡張子を外して、見出しとして使う（例："01_表紙.png" → "表紙"）
function titleForUnit(unit: ExportUnit): string {
  return unit.filename.replace(/^\d+_/, "").replace(/\.png$/, "");
}

type Props = {
  units: ExportUnit[];
  tournament: Tournament;
  leagues: LeagueGroup[];
  bracket: BracketData;
  timetableRound: string;
};

export function PreviewGallery({
  units,
  tournament,
  leagues,
  bracket,
  timetableRound,
}: Props) {
  if (units.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        まだ完成イメージがありません。PDFや画像をアップロードして解析するか、下の「詳細編集」から手入力してください。
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-gray-700">完成イメージ</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {units.map((unit) => (
          <div key={unit.id} className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">
              {titleForUnit(unit)}
            </p>
            <div
              style={{
                width: IMAGE_WIDTH * PREVIEW_SCALE,
                height: IMAGE_HEIGHT * PREVIEW_SCALE,
                overflow: "hidden",
              }}
              className="rounded-md border border-gray-200 shadow-sm"
            >
              <div
                style={{
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                }}
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
