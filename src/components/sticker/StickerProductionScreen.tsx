import { useState } from "react";
import type { useStickerData } from "../../state/useStickerData";
import type { StickerGender, StickerPlan } from "../../types/sticker";
import { StickerLibraryPanel } from "./StickerLibraryPanel";
import { StickerInstructionForm } from "./StickerInstructionForm";
import { StickerCandidateCard } from "./StickerCandidateCard";
import { StickerSheetPromptPanel } from "./StickerSheetPromptPanel";
import { dataUrlToBlob } from "../../lib/imageFile";
import { deliverAsZip, type ExportedFile } from "../../lib/exportDelivery";
import { estimateBatchCost } from "../../lib/stickerCostEstimate";

type Props = {
  stickerData: ReturnType<typeof useStickerData>;
};

function sanitizeFilenamePart(text: string): string {
  const safe = text.replace(/[\\/:*?"<>|]/g, "").trim();
  return safe === "" ? "スタンプ" : safe.slice(0, 20);
}

export function StickerProductionScreen({ stickerData }: Props) {
  const { data } = stickerData;
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

  const handleZipExport = async () => {
    const targets = data.candidates.filter(
      (c) => c.lineFormattedImageDataUrl,
    );
    if (targets.length === 0) return;
    setIsZipping(true);
    setZipError("");
    try {
      const files: ExportedFile[] = targets.map((c, i) => ({
        filename: `${String(i + 1).padStart(2, "0")}_${sanitizeFilenamePart(c.plan.phrase)}.png`,
        blob: dataUrlToBlob(c.lineFormattedImageDataUrl as string),
      }));
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
    (c) => c.lineFormattedImageDataUrl,
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">スタンプ制作</h1>
        <p className="mt-1 text-sm text-gray-500">
          既存のWAVESキャラクターを基準に、自由な指示からLINEスタンプ案を一括企画します。
        </p>
      </div>

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

      <StickerSheetPromptPanel
        characterSettings={data.characterSettings}
        batches={data.batches}
        candidates={data.candidates}
      />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">
            スタンプ候補一覧（{data.candidates.length}件）
          </h2>
          <button
            type="button"
            onClick={() => void handleZipExport()}
            disabled={completedCount === 0 || isZipping}
            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isZipping
              ? "出力中..."
              : `LINE形式画像をZIP出力（${completedCount}件）`}
          </button>
        </div>
        {zipError && (
          <p className="text-xs font-semibold text-red-600">{zipError}</p>
        )}

        {data.candidates.length === 0 ? (
          <p className="text-xs text-gray-400">
            まだ候補がありません。上のフォームから企画を生成してください。
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
  );
}
