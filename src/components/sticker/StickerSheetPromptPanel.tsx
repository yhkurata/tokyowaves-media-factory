import { useRef, useState } from "react";
import type {
  CharacterSettings,
  StickerBatch,
  StickerCandidate,
} from "../../types/sticker";
import { buildSheetGenerationPrompt } from "../../lib/stickerSheetPrompt";
import { fileToDataUrl } from "../../lib/imageFile";
import { splitStickerSheet } from "../../lib/stickerSheetSplit";
import { CopyableBlock } from "./CopyableBlock";

type Props = {
  characterSettings: CharacterSettings;
  batches: StickerBatch[];
  candidates: StickerCandidate[];
  onAssignCompletedImages: (
    assignments: { id: string; imageDataUrl: string }[],
  ) => void;
};

export function StickerSheetPromptPanel({
  characterSettings,
  batches,
  candidates,
  onAssignCompletedImages,
}: Props) {
  const sortedBatches = [...batches].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    sortedBatches[0]?.id ?? "",
  );
  const [prompt, setPrompt] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignedCount, setAssignedCount] = useState(0);
  const [squareify, setSquareify] = useState(true);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  if (sortedBatches.length === 0) return null;

  const selectedBatch =
    sortedBatches.find((b) => b.id === selectedBatchId) ?? sortedBatches[0];
  const batchCandidates = candidates.filter(
    (c) => c.batchId === selectedBatch.id,
  );

  const handleGenerate = () => {
    setPrompt(buildSheetGenerationPrompt(characterSettings, batchCandidates));
  };

  const handleSheetResultSelected = async (file: File | undefined) => {
    if (!file) return;
    setAssignError("");
    setAssignedCount(0);
    setIsAssigning(true);
    try {
      const sheetDataUrl = await fileToDataUrl(file);
      const pieces = await splitStickerSheet(sheetDataUrl, { squareify });
      if (pieces.length !== batchCandidates.length) {
        setAssignError(
          `シートは4×4（16分割）を想定していますが、このバッチの候補数は${batchCandidates.length}件のため一致しません。`,
        );
        return;
      }
      onAssignCompletedImages(
        batchCandidates.map((candidate, i) => ({
          id: candidate.id,
          imageDataUrl: pieces[i],
        })),
      );
      setAssignedCount(pieces.length);
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "シート画像の分割に失敗しました。",
      );
    } finally {
      setIsAssigning(false);
      if (sheetInputRef.current) sheetInputRef.current.value = "";
    }
  };

  return (
    <section className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-700">
        まとめてシート画像を生成するプロンプト
      </h2>
      <p className="text-xs text-gray-500">
        候補ごとに1件ずつChatGPTへ依頼する代わりに、選んだ企画バッチの内容を
        まとめて1枚のシート画像として生成してもらうための指示文を作成します
        （すでに生成済みの内容から組み立てるだけなので、追加費用はかかりません）。
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          対象の企画バッチ
        </label>
        <select
          value={selectedBatch.id}
          onChange={(e) => {
            setSelectedBatchId(e.target.value);
            setPrompt("");
          }}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          {sortedBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {new Date(batch.createdAt).toLocaleString("ja-JP")}（
              {batch.requestedCount}件）
            </option>
          ))}
        </select>
      </div>

      <p className="whitespace-pre-wrap text-xs text-gray-500">
        指示内容：{selectedBatch.instruction}
      </p>
      <p className="text-xs text-gray-500">
        このバッチの候補数：{batchCandidates.length}件
      </p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={batchCandidates.length === 0}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        シート生成プロンプトを作成
      </button>

      {prompt && (
        <CopyableBlock label="ChatGPT貼り付け用プロンプト（英語）" text={prompt} />
      )}

      <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold text-gray-600">
          ChatGPTで生成したシート画像を、このバッチの{batchCandidates.length}件の完成画像として登録
        </p>
        <p className="text-xs text-gray-500">
          「シート画像を分割して追加」（ライブラリ用）とは別に、生成されたシートを
          4×4に分割し、このバッチの各候補（プロンプトと同じ並び順）の完成画像として
          そのまま登録します。
        </p>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={squareify}
            onChange={(e) => setSquareify(e.target.checked)}
          />
          正方形に整える（余白を追加、絵柄は切れません）
        </label>
        <button
          type="button"
          onClick={() => sheetInputRef.current?.click()}
          disabled={isAssigning || batchCandidates.length !== 16}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isAssigning ? "分割・登録中..." : "シート画像をアップロードして完成画像に登録"}
        </button>
        <input
          ref={sheetInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => void handleSheetResultSelected(e.target.files?.[0])}
        />
        {batchCandidates.length !== 16 && (
          <p className="text-xs text-yellow-700">
            このバッチは{batchCandidates.length}件のため、4×4固定の分割とは件数が一致しません。
          </p>
        )}
        {assignError && (
          <p className="text-xs font-semibold text-red-600">{assignError}</p>
        )}
        {assignedCount > 0 && (
          <p className="text-xs font-semibold text-green-700">
            {assignedCount}件の完成画像を登録しました。
          </p>
        )}
      </div>
    </section>
  );
}
