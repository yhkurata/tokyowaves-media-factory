import { useState } from "react";
import type {
  CharacterSettings,
  StickerBatch,
  StickerCandidate,
} from "../../types/sticker";
import { buildSheetGenerationPrompt } from "../../lib/stickerSheetPrompt";
import { CopyableBlock } from "./CopyableBlock";

type Props = {
  characterSettings: CharacterSettings;
  batches: StickerBatch[];
  candidates: StickerCandidate[];
};

export function StickerSheetPromptPanel({
  characterSettings,
  batches,
  candidates,
}: Props) {
  const sortedBatches = [...batches].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const [selectedBatchId, setSelectedBatchId] = useState(
    sortedBatches[0]?.id ?? "",
  );
  const [prompt, setPrompt] = useState("");

  if (sortedBatches.length === 0) return null;

  const selectedBatch =
    sortedBatches.find((b) => b.id === selectedBatchId) ?? sortedBatches[0];
  const batchCandidates = candidates.filter(
    (c) => c.batchId === selectedBatch.id,
  );

  const handleGenerate = () => {
    setPrompt(buildSheetGenerationPrompt(characterSettings, batchCandidates));
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
              {batch.requestedCount}件）：{batch.instruction.slice(0, 30)}
            </option>
          ))}
        </select>
      </div>

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
    </section>
  );
}
