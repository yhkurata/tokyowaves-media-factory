import { useState } from "react";
import type { useStickerData } from "../../state/useStickerData";
import {
  isCharacterSettingsEmpty,
  type StickerGender,
  type StickerPlan,
} from "../../types/sticker";
import { StickerLibraryPanel } from "./StickerLibraryPanel";
import { StickerInstructionForm } from "./StickerInstructionForm";
import { StickerCandidateCard } from "./StickerCandidateCard";
import { StickerSheetPromptPanel } from "./StickerSheetPromptPanel";
import { StepHeader } from "./StepHeader";
import { dataUrlToBlob } from "../../lib/imageFile";
import { deliverAsZip, type ExportedFile } from "../../lib/exportDelivery";
import { estimateBatchCost } from "../../lib/stickerCostEstimate";
import { convertToLineStickerFormat } from "../../lib/lineStickerFormat";

type Props = {
  stickerData: ReturnType<typeof useStickerData>;
  onGoToCharacterSettings: () => void;
};

function sanitizeFilenamePart(text: string): string {
  const safe = text.replace(/[\\/:*?"<>|]/g, "").trim();
  return safe === "" ? "スタンプ" : safe.slice(0, 20);
}

export function StickerProductionScreen({
  stickerData,
  onGoToCharacterSettings,
}: Props) {
  const { data } = stickerData;
  const characterSettingsMissing = isCharacterSettingsEmpty(
    data.characterSettings,
  );
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);
  const [zipError, setZipError] = useState("");
  const [isZipping, setIsZipping] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const referenceImageDataUrls = data.library
    .filter((item) => selectedLibraryIds.includes(item.id))
    .map((item) => item.imageDataUrl);

  const existingCandidateSummaries = data.candidates.map((c) => ({
    phrase: c.plan.phrase,
    scene: c.plan.scene,
  }));

  const handleGenerated = (
    plans: StickerPlan[],
    meta: { instruction: string; requestedCount: 8 | 16 | 24 | 32 | 40 },
  ) => {
    const estimate = estimateBatchCost(
      meta.requestedCount,
      referenceImageDataUrls.length,
    );
    stickerData.addBatchWithCandidates(
      {
        instruction: meta.instruction,
        requestedCount: meta.requestedCount,
        baseStickerIds: selectedLibraryIds,
        estimatedCostYen: estimate.label,
      },
      plans,
    );
  };

  // 完成画像があるものは、LINE形式へ未変換でもここでまとめて変換してからZIPに詰める。
  // 1件ずつカードを開いて「LINEスタンプ形式に変換」を押す手間を無くすための一括操作。
  const handleZipExport = async () => {
    const targets = data.candidates.filter((c) => c.completedImageDataUrl);
    if (targets.length === 0) return;
    setIsZipping(true);
    setZipError("");
    try {
      const files: ExportedFile[] = [];
      for (let i = 0; i < targets.length; i++) {
        const candidate = targets[i];
        const lineFormatted =
          candidate.lineFormattedImageDataUrl ??
          (await convertToLineStickerFormat(
            candidate.completedImageDataUrl as string,
          ));
        if (!candidate.lineFormattedImageDataUrl) {
          stickerData.updateCandidate(candidate.id, {
            lineFormattedImageDataUrl: lineFormatted,
          });
        }
        files.push({
          filename: `${String(i + 1).padStart(2, "0")}_${sanitizeFilenamePart(candidate.plan.phrase)}.png`,
          blob: dataUrlToBlob(lineFormatted),
        });
      }
      await deliverAsZip(files, "LINEスタンプ完成画像.zip");
    } catch (err) {
      setZipError(
        err instanceof Error ? err.message : "ZIP出力に失敗しました。",
      );
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = data.candidates.filter(
    (c) => c.completedImageDataUrl,
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">スタンプ制作</h1>
        <p className="mt-1 text-sm text-gray-500">
          既存のWAVESキャラクターを基準に、自由な指示からLINEスタンプ案を一括企画します。
        </p>
      </div>

      {characterSettingsMissing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800">
            準備：まだキャラクター設定がありません。先に登録してください。
          </p>
          <button
            type="button"
            onClick={onGoToCharacterSettings}
            className="shrink-0 rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-400"
          >
            キャラクター設定へ
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-800">
            準備：キャラクター設定は登録済みです。
          </p>
          <button
            type="button"
            onClick={onGoToCharacterSettings}
            className="text-xs font-semibold text-green-700 underline hover:no-underline"
          >
            内容を確認・修正する
          </button>
        </div>
      )}

      <div className="space-y-3">
        <StepHeader
          step={1}
          title="企画する"
          description="参考画像を選び（任意）、自由な指示からスタンプ案をAIに考えてもらいます。"
        />
        <StickerLibraryPanel
          library={data.library}
          selectedIds={selectedLibraryIds}
          onToggleSelect={toggleSelect}
          onAdd={(items) =>
            stickerData.addLibraryItems(
              items as { imageDataUrl: string; label: string; gender: StickerGender }[],
            )
          }
          onUpdateItem={stickerData.updateLibraryItem}
          onRemove={(id) => {
            stickerData.removeLibraryItem(id);
            setSelectedLibraryIds((prev) => prev.filter((x) => x !== id));
          }}
        />
        <StickerInstructionForm
          characterSettings={data.characterSettings}
          referenceImageDataUrls={referenceImageDataUrls}
          existingCandidates={existingCandidateSummaries}
          onGenerated={handleGenerated}
        />
      </div>

      <StickerSheetPromptPanel
        characterSettings={data.characterSettings}
        batches={data.batches}
        candidates={data.candidates}
        projects={stickerData.workspace.projects}
        activeProjectId={stickerData.workspace.activeProjectId}
        onAssignCompletedImages={(assignments) => {
          for (const { id, imageDataUrl } of assignments) {
            stickerData.updateCandidate(id, {
              completedImageDataUrl: imageDataUrl,
              status: "completed",
            });
          }
        }}
        onCopyBatchToProject={stickerData.copyBatchToProject}
      />

      <div className="space-y-3">
        <StepHeader
          step={4}
          title="完成品を確認・保存する"
          description="完成画像をLINEの規定サイズに変換し、まとめてZIPで保存します。"
        />
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">
              スタンプ候補一覧（{data.candidates.length}件）
            </h3>
            <button
              type="button"
              onClick={() => void handleZipExport()}
              disabled={completedCount === 0 || isZipping}
              className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isZipping
                ? "変換・出力中..."
                : `完成画像を一括変換してZIP保存（${completedCount}件）`}
            </button>
          </div>
          {zipError && (
            <p className="text-xs font-semibold text-red-600">{zipError}</p>
          )}

          {data.candidates.length === 0 ? (
            <p className="text-xs text-gray-400">
              まだ候補がありません。STEP1で企画を生成してください。
            </p>
          ) : (
            <div className="space-y-2">
              {data.candidates.map((candidate) => (
                <StickerCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isOpen={openCandidateId === candidate.id}
                  onToggle={() =>
                    setOpenCandidateId(
                      openCandidateId === candidate.id ? null : candidate.id,
                    )
                  }
                  onUpdatePlan={(patch) =>
                    stickerData.updateCandidatePlan(candidate.id, patch)
                  }
                  onUpdateStatus={(status) =>
                    stickerData.updateCandidate(candidate.id, { status })
                  }
                  onUploadCompletedImage={(dataUrl) =>
                    stickerData.updateCandidate(candidate.id, {
                      completedImageDataUrl: dataUrl,
                    })
                  }
                  onSetLineFormattedImage={(dataUrl) =>
                    stickerData.updateCandidate(candidate.id, {
                      lineFormattedImageDataUrl: dataUrl,
                    })
                  }
                  onDelete={() => stickerData.removeCandidate(candidate.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
