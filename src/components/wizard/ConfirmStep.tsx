import type { ReactNode } from "react";
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
import { PostImageTemplate } from "../preview/PostImageTemplate";
import { LeagueBoardTemplate } from "../preview/LeagueBoardTemplate";
import { TimetableTemplate } from "../preview/TimetableTemplate";
import { TournamentTemplate } from "../preview/TournamentTemplate";
import { AccordionSection } from "./AccordionSection";
import { buildSections } from "../../lib/templateSections";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";

const PREVIEW_SCALE = 0.28;

function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: IMAGE_WIDTH * PREVIEW_SCALE,
        height: IMAGE_HEIGHT * PREVIEW_SCALE,
        overflow: "hidden",
      }}
      className="shrink-0 border border-gray-300 shadow-sm"
    >
      <div
        style={{
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

type Props = {
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
};

export function ConfirmStep({
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
}: Props) {
  const { tournament } = tournamentData;
  const sections = buildSections({
    tournament,
    leagues: leagueData.leagues,
    matches: timetableData.matches,
    bracket: bracketData.data,
  });
  const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        セクションをスクロールして確認・修正してください。要確認の項目があるセクションは自動的に開いています。
      </p>

      <AccordionSection
        label={sectionById.cover.label}
        needsReview={sectionById.cover.needsReview}
        hasData={sectionById.cover.hasData}
        defaultOpen={sectionById.cover.hasData || sectionById.cover.needsReview}
      >
        <div className="flex flex-wrap gap-6">
          <div className="w-full max-w-md">
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
          </div>
          <PreviewFrame>
            <PostImageTemplate tournament={tournament} />
          </PreviewFrame>
        </div>
      </AccordionSection>

      <AccordionSection
        label={sectionById.league.label}
        needsReview={sectionById.league.needsReview}
        hasData={sectionById.league.hasData}
        defaultOpen={sectionById.league.hasData || sectionById.league.needsReview}
      >
        <div className="flex flex-wrap gap-6">
          <div className="w-full max-w-md">
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
          </div>
          <PreviewFrame>
            <LeagueBoardTemplate leagues={leagueData.leagues} />
          </PreviewFrame>
        </div>
      </AccordionSection>

      <AccordionSection
        label={sectionById.timetable.label}
        needsReview={sectionById.timetable.needsReview}
        hasData={sectionById.timetable.hasData}
        defaultOpen={
          sectionById.timetable.hasData || sectionById.timetable.needsReview
        }
      >
        <div className="flex flex-wrap gap-6">
          <div className="w-full max-w-md">
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
          </div>
          <PreviewFrame>
            <TimetableTemplate
              date={selectedDay?.date ?? ""}
              venue={selectedVenue?.name ?? ""}
              round={timetableData.info.round}
              matches={scopedMatches}
            />
          </PreviewFrame>
        </div>
      </AccordionSection>

      <AccordionSection
        label={sectionById.tournament.label}
        needsReview={sectionById.tournament.needsReview}
        hasData={sectionById.tournament.hasData}
        defaultOpen={
          sectionById.tournament.hasData || sectionById.tournament.needsReview
        }
      >
        <div className="flex flex-wrap gap-6">
          <div className="w-full max-w-md">
            <BracketForm
              data={bracketData.data}
              onUpdateRound1Team={bracketData.updateRound1Team}
              onSetRound1Winner={bracketData.setRound1Winner}
              onSetSemisWinner={bracketData.setSemisWinner}
              onSetFinalWinner={bracketData.setFinalWinner}
            />
          </div>
          <PreviewFrame>
            <TournamentTemplate data={bracketData.data} />
          </PreviewFrame>
        </div>
      </AccordionSection>

      <div className="flex justify-end pt-2">
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
