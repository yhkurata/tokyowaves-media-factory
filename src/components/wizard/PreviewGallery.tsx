import type { Tournament } from "../../types/tournament";
import type { LeagueGroup } from "../../types/league";
import type { BracketData } from "../../types/bracket";
import type { ExportUnit } from "../../lib/templateSections";
import { PostImageTemplate } from "../preview/PostImageTemplate";
import { LeagueBoardTemplate } from "../preview/LeagueBoardTemplate";
import { TimetableTemplate } from "../preview/TimetableTemplate";
import { TournamentTemplate } from "../preview/TournamentTemplate";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import type { Theme } from "../preview/theme";

const PREVIEW_SCALE = 0.4;

const THEME_OPTIONS: { id: Theme; label: string }[] = [
  { id: "standard", label: "標準" },
  { id: "water", label: "ウォーター" },
];

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
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function PreviewGallery({
  units,
  tournament,
  leagues,
  bracket,
  timetableRound,
  theme,
  onThemeChange,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-700">完成イメージ</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">
            デザイン（タイムテーブル・リーグ組み合わせ・トーナメント表）：
          </span>
          <div className="flex rounded-md border border-gray-300 bg-white p-0.5">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onThemeChange(option.id)}
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  theme === option.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
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
                  <LeagueBoardTemplate leagues={leagues} theme={theme} />
                )}
                {unit.kind === "timetable" && (
                  <TimetableTemplate
                    date={unit.date ?? ""}
                    venue={unit.venue ?? ""}
                    round={timetableRound}
                    matches={unit.matches ?? []}
                    theme={theme}
                  />
                )}
                {unit.kind === "tournament" && (
                  <TournamentTemplate data={bracket} theme={theme} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
