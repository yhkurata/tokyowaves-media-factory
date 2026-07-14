import { useEffect, useRef, useState } from "react";
import { useTournamentData } from "./state/useTournamentData";
import { useLeagueData } from "./state/useLeagueData";
import { useTimetableData } from "./state/useTimetableData";
import { useBracketData } from "./state/useBracketData";
import { StepIndicator, type WizardStep } from "./components/wizard/StepIndicator";
import { UploadStep } from "./components/wizard/UploadStep";
import { AnalyzingStep } from "./components/wizard/AnalyzingStep";
import { ConfirmStep } from "./components/wizard/ConfirmStep";
import { ExportStep } from "./components/wizard/ExportStep";
import { ProjectBar } from "./components/wizard/ProjectBar";
import { RestorePrompt } from "./components/wizard/RestorePrompt";
import {
  buildBracketData,
  buildLeagueGroups,
  buildTimetableInfoPatch,
  buildTimetableMatches,
  buildTournament,
  getMissingFieldLabels,
  type ExtractionResult,
} from "./lib/extraction";
import type { ProjectData } from "./lib/projectFile";
import { saveAutoSnapshot, loadAutoSnapshot, clearAutoSnapshot } from "./lib/autoSave";
import {
  tournamentHasData,
  leaguesHasData,
  timetableHasData,
  bracketHasData,
} from "./lib/templateSections";

const AUTO_SAVE_DEBOUNCE_MS = 800;

function snapshotHasAnyData(data: ProjectData): boolean {
  return (
    tournamentHasData(data.tournament) ||
    leaguesHasData(data.leagues) ||
    timetableHasData(data.matches) ||
    bracketHasData(data.bracket)
  );
}

type SupportedMediaType = "image/png" | "image/jpeg" | "application/pdf";

function mediaTypeForFile(file: File): SupportedMediaType | null {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/jpeg") return "image/jpeg";
  if (file.type === "application/pdf") return "application/pdf";
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface AnalysisSummary {
  matchCount: number;
  missingFields: string[];
}

function App() {
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisSummary, setAnalysisSummary] =
    useState<AnalysisSummary | null>(null);

  const tournamentData = useTournamentData();
  const { tournament } = tournamentData;
  const leagueData = useLeagueData();
  const timetableData = useTimetableData();
  const bracketData = useBracketData();

  // 起動時に自動保存データがあれば復元確認を出す。復元/破棄が決まるまで自動保存自体は止めておく
  // （破棄を選んだのに直後の自動保存で復元プロンプト用データが上書きされるのを防ぐため）。
  const [pendingRestore] = useState<ProjectData | null>(() => {
    const snapshot = loadAutoSnapshot();
    return snapshot && snapshotHasAnyData(snapshot) ? snapshot : null;
  });
  const [restorePromptOpen, setRestorePromptOpen] = useState(
    pendingRestore !== null,
  );

  const [selectedDayId, setSelectedDayId] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState("");

  const selectedDay =
    tournament.days.find((d) => d.id === selectedDayId) ?? tournament.days[0];
  const selectedVenue =
    selectedDay?.venues.find((v) => v.id === selectedVenueId) ??
    selectedDay?.venues[0];

  const scopedMatches = timetableData.matches.filter(
    (m) => m.date === selectedDay?.date && m.venue === selectedVenue?.name,
  );

  // 「確認・編集」タブでの日付・会場の変更/削除を、タイムテーブル側の試合データへ連動させる
  const handleUpdateDayDate = (dayId: string, date: string) => {
    const day = tournament.days.find((d) => d.id === dayId);
    if (day) timetableData.renameDate(day.date, date);
    tournamentData.updateDayDate(dayId, date);
  };

  const handleRemoveDay = (dayId: string) => {
    const day = tournament.days.find((d) => d.id === dayId);
    if (day) timetableData.removeMatchesForDate(day.date);
    tournamentData.removeDay(dayId);
  };

  const handleUpdateVenueName = (
    dayId: string,
    venueId: string,
    name: string,
  ) => {
    const day = tournament.days.find((d) => d.id === dayId);
    const venue = day?.venues.find((v) => v.id === venueId);
    if (day && venue) timetableData.renameVenue(day.date, venue.name, name);
    tournamentData.updateVenueName(dayId, venueId, name);
  };

  const handleRemoveVenue = (dayId: string, venueId: string) => {
    const day = tournament.days.find((d) => d.id === dayId);
    const venue = day?.venues.find((v) => v.id === venueId);
    if (day && venue) timetableData.removeMatchesForVenue(day.date, venue.name);
    tournamentData.removeVenue(dayId, venueId);
  };

  const handleLoadProject = (data: ProjectData) => {
    tournamentData.loadTournament(data.tournament);
    leagueData.loadLeagues(data.leagues);
    timetableData.updateInfo(data.timetableInfo);
    timetableData.replaceMatches(data.matches);
    bracketData.loadBracket(data.bracket);
    setSelectedDayId("");
    setSelectedVenueId("");
    setAnalysisError("");
    setAnalysisSummary(null);
    setWizardStep("confirm");
  };

  const handleRestoreAutoSave = () => {
    if (pendingRestore) handleLoadProject(pendingRestore);
    setRestorePromptOpen(false);
  };

  const handleDiscardAutoSave = () => {
    clearAutoSnapshot();
    setRestorePromptOpen(false);
  };

  // 入力内容を自動保存する（復元プロンプトの応答が済むまでは待機）
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (restorePromptOpen) return;
    if (autoSaveTimeoutRef.current !== undefined) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      saveAutoSnapshot({
        tournament,
        leagues: leagueData.leagues,
        timetableInfo: timetableData.info,
        matches: timetableData.matches,
        bracket: bracketData.data,
      });
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => {
      if (autoSaveTimeoutRef.current !== undefined) {
        window.clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    restorePromptOpen,
    tournament,
    leagueData.leagues,
    timetableData.info,
    timetableData.matches,
    bracketData.data,
  ]);

  const handleAnalyze = async (files: File[]) => {
    const attachments = files
      .map((file) => ({ file, mediaType: mediaTypeForFile(file) }))
      .filter(
        (a): a is { file: File; mediaType: SupportedMediaType } =>
          a.mediaType !== null,
      );
    if (attachments.length === 0) return;

    setAnalysisError("");
    setAnalysisSummary(null);
    setWizardStep("analyzing");

    try {
      const encoded = await Promise.all(
        attachments.map(async ({ file, mediaType }) => ({
          mediaType,
          dataBase64: await fileToBase64(file),
        })),
      );
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: encoded }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "解析に失敗しました。");
      }
      const result = payload.result as ExtractionResult;

      tournamentData.replaceTournament(buildTournament(result));
      timetableData.updateInfo(buildTimetableInfoPatch(result));
      if (result.leagues.length > 0) {
        leagueData.replaceLeagues(buildLeagueGroups(result));
      }
      if (result.matches.length > 0) {
        timetableData.replaceMatches(buildTimetableMatches(result));
      }
      const bracket = buildBracketData(result);
      if (bracket) {
        bracketData.loadBracket(bracket);
      }

      setAnalysisSummary({
        matchCount: result.matches.length,
        missingFields: getMissingFieldLabels(result),
      });
      setWizardStep("confirm");
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "解析中に不明なエラーが発生しました。",
      );
      setWizardStep("upload");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {restorePromptOpen && pendingRestore && (
        <RestorePrompt
          savedAt={pendingRestore.savedAt}
          onRestore={handleRestoreAutoSave}
          onDiscard={handleDiscardAutoSave}
        />
      )}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          TokyoWAVES Media Factory
        </h1>
        <ProjectBar
          snapshot={{
            tournament,
            leagues: leagueData.leagues,
            timetableInfo: timetableData.info,
            matches: timetableData.matches,
            bracket: bracketData.data,
          }}
          onLoad={handleLoadProject}
        />
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-6">
        <StepIndicator current={wizardStep} />
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {wizardStep === "upload" && (
          <UploadStep errorMessage={analysisError} onAnalyze={handleAnalyze} />
        )}

        {wizardStep === "analyzing" && <AnalyzingStep />}

        {wizardStep === "confirm" && (
          <ConfirmStep
            analysisSummary={analysisSummary}
            tournamentData={tournamentData}
            leagueData={leagueData}
            timetableData={timetableData}
            bracketData={bracketData}
            selectedDay={selectedDay}
            selectedVenue={selectedVenue}
            onSelectDay={(dayId) => {
              setSelectedDayId(dayId);
              setSelectedVenueId("");
            }}
            onSelectVenue={setSelectedVenueId}
            scopedMatches={scopedMatches}
            onUpdateDayDate={handleUpdateDayDate}
            onRemoveDay={handleRemoveDay}
            onUpdateVenueName={handleUpdateVenueName}
            onRemoveVenue={handleRemoveVenue}
            onProceedToExport={() => setWizardStep("export")}
          />
        )}

        {wizardStep === "export" && (
          <ExportStep
            tournament={tournament}
            leagues={leagueData.leagues}
            matches={timetableData.matches}
            bracket={bracketData.data}
            timetableRound={timetableData.info.round}
            onBackToConfirm={() => setWizardStep("confirm")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
