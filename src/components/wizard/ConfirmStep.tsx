import { useState } from "react";
import type { useTournamentData } from "../../state/useTournamentData";
import type { useLeagueData } from "../../state/useLeagueData";
import type { useTimetableData } from "../../state/useTimetableData";
import type { useBracketData } from "../../state/useBracketData";
import type { TournamentDay, TournamentVenue } from "../../types/tournament";
import type { TimetableMatch } from "../../types/timetable";
import { TournamentInfoForm } from "../forms/TournamentInfoForm";
import { LeagueForm } from "../forms/LeagueForm";
import { TimetableForm } from "../forms/TimetableForm";
import { BracketForm } from "../forms/BracketForm";
import { AccordionSection } from "./AccordionSection";
import { ReviewChecklist } from "./ReviewChecklist";
import { PreviewGallery } from "./PreviewGallery";
import { buildSections, buildExportUnits } from "../../lib/templateSections";
import { buildReviewItems, teamNameGapRatio } from "../../lib/reviewItems";

const TEAM_NAME_GAP_SUGGESTION_THRESHOLD = 0.3;

type AnalysisSummary = {
  matchCount: number;
  missingFields: string[];
};

type Props = {
  analysisSummary: AnalysisSummary | null;
  tournamentData: ReturnType<typeof useTournamentData>;
  leagueData: ReturnType<typeof useLeagueData>;
  timetableData: ReturnType<typeof useTimetableData>;
  bracketData: ReturnType<typeof useBracketData>;
  selectedDay: TournamentDay | undefined;
  selectedVenue: TournamentVenue | undefined;
  onSelectDay: (dayId: string) => void;
  onSelectVenue: (venueId: string) => void;
  scopedMatches: TimetableMatch[];
  onUpdateDayDate: (dayId: string, date: string) => void;
  onRemoveDay: (dayId: string) => void;
  onUpdateVenueName: (dayId: string, venueId: string, name: string) => void;
  onRemoveVenue: (dayId: string, venueId: string) => void;
  onProceedToExport: () => void;
  onAddMoreFiles: () => void;
};

export function ConfirmStep({
  analysisSummary,
  tournamentData,
  leagueData,
  timetableData,
  bracketData,
  selectedDay,
  selectedVenue,
  onSelectDay,
  onSelectVenue,
  scopedMatches,
  onUpdateDayDate,
  onRemoveDay,
  onUpdateVenueName,
  onRemoveVenue,
  onProceedToExport,
  onAddMoreFiles,
}: Props) {
  const [detailedEditOpen, setDetailedEditOpen] = useState(false);
  const { tournament } = tournamentData;

  const state = {
    tournament,
    leagues: leagueData.leagues,
    matches: timetableData.matches,
    bracket: bracketData.data,
  };

  const reviewGroups = buildReviewItems({
    tournament,
    leagues: leagueData.leagues,
    matches: timetableData.matches,
    bracket: bracketData.data,
    onUpdateName: tournamentData.updateName,
    onUpdateDayDate,
    onUpdateVenueName,
    onUpdateLeagueName: leagueData.updateLeagueName,
    onUpdateTeamName: leagueData.updateTeamName,
    onUpdateMatch: timetableData.updateMatch,
    onUpdateRound1Team: bracketData.updateRound1Team,
  });
  const reviewItemCount = reviewGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  const units = buildExportUnits(state);
  const sections = buildSections(state);
  const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]));

  const showTeamNameGapSuggestion =
    teamNameGapRatio(timetableData.matches) >= TEAM_NAME_GAP_SUGGESTION_THRESHOLD;

  return (
    <div className="space-y-6">
      {analysisSummary && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-gray-800">
          <p className="font-semibold text-blue-900">
            AIが{analysisSummary.matchCount}試合を自動入力しました。
          </p>
          {analysisSummary.missingFields.length > 0 ? (
            <p className="mt-1 text-gray-700">
              資料から読み取れなかった項目：
              <span className="font-semibold text-yellow-700">
                {" "}
                {analysisSummary.missingFields.join("・")}
              </span>
              　→　下の「要確認」リストだけ埋めてください。
            </p>
          ) : (
            <p className="mt-1 text-gray-700">
              主要な項目はすべて自動入力できました。プレビューに間違いがないかだけ確認してください。
            </p>
          )}
        </div>
      )}

      {showTeamNameGapSuggestion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
          <p>
            対戦カード（チーム名）が多くの試合で未入力です。
            <br />
            リーグ組み合わせ表・トーナメント表など、チーム名が載った資料を追加でアップロードすると、AIが試合No.をもとに自動で埋めます。手入力する前にお試しください。
          </p>
          <button
            type="button"
            onClick={onAddMoreFiles}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            ＋ 資料を追加する
          </button>
        </div>
      )}

      <ReviewChecklist groups={reviewGroups} totalCount={reviewItemCount} />

      <PreviewGallery
        units={units}
        tournament={tournament}
        leagues={leagueData.leagues}
        bracket={bracketData.data}
        timetableRound={timetableData.info.round}
      />

      <details
        open={detailedEditOpen}
        onToggle={(e) => setDetailedEditOpen(e.currentTarget.open)}
        className="rounded-lg border border-gray-200 bg-white"
      >
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900">
          詳細編集（開催日・会場・チームの追加や削除など）
        </summary>
        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
          <AccordionSection
            label={sectionById.cover.label}
            needsReview={sectionById.cover.needsReview}
            hasData={sectionById.cover.hasData}
            defaultOpen={false}
          >
            <TournamentInfoForm
              tournament={tournament}
              onUpdateName={tournamentData.updateName}
              onAddDay={tournamentData.addDay}
              onRemoveDay={onRemoveDay}
              onUpdateDayDate={onUpdateDayDate}
              onAddVenue={tournamentData.addVenue}
              onRemoveVenue={onRemoveVenue}
              onUpdateVenueName={onUpdateVenueName}
            />
          </AccordionSection>

          <AccordionSection
            label={sectionById.league.label}
            needsReview={sectionById.league.needsReview}
            hasData={sectionById.league.hasData}
            defaultOpen={false}
          >
            <LeagueForm
              leagues={leagueData.leagues}
              onAddLeague={leagueData.addLeague}
              onRemoveLeague={leagueData.removeLeague}
              onUpdateLeagueName={leagueData.updateLeagueName}
              onAddTeam={leagueData.addTeam}
              onRemoveTeam={leagueData.removeTeam}
              onUpdateTeamName={leagueData.updateTeamName}
              onSetTeamIsTokyoWaves={leagueData.setTeamIsTokyoWaves}
            />
          </AccordionSection>

          <AccordionSection
            label={sectionById.timetable.label}
            needsReview={sectionById.timetable.needsReview}
            hasData={sectionById.timetable.hasData}
            defaultOpen={false}
          >
            <TimetableForm
              tournamentDays={tournament.days}
              selectedDay={selectedDay}
              selectedVenue={selectedVenue}
              onSelectDay={onSelectDay}
              onSelectVenue={onSelectVenue}
              info={timetableData.info}
              onUpdateInfo={timetableData.updateInfo}
              matches={scopedMatches}
              onAddMatch={timetableData.addMatch}
              onRemoveMatch={timetableData.removeMatch}
              onUpdateMatch={timetableData.updateMatch}
            />
          </AccordionSection>

          <AccordionSection
            label={sectionById.tournament.label}
            needsReview={sectionById.tournament.needsReview}
            hasData={sectionById.tournament.hasData}
            defaultOpen={false}
          >
            <BracketForm
              data={bracketData.data}
              onUpdateRound1Team={bracketData.updateRound1Team}
              onSetRound1Winner={bracketData.setRound1Winner}
              onSetSemisWinner={bracketData.setSemisWinner}
              onSetFinalWinner={bracketData.setFinalWinner}
            />
          </AccordionSection>
        </div>
      </details>

      <div className="flex items-center justify-end gap-3 pt-2">
        {reviewItemCount > 0 && (
          <span className="text-xs text-yellow-700">
            要確認が{reviewItemCount}件残っています
          </span>
        )}
        <button
          type="button"
          onClick={onProceedToExport}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          ④ PNG出力へ進む
        </button>
      </div>
    </div>
  );
}
