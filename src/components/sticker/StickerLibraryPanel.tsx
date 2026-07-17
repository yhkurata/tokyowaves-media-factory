import { useRef, useState } from "react";
import type { StickerGender, StickerLibraryItem } from "../../types/sticker";
import { fileToDataUrl } from "../../lib/imageFile";
import { recognizeStickerPhrases } from "../../lib/stickerApi";
import { estimateRecognizeCost } from "../../lib/stickerCostEstimate";

const GENDER_LABELS: Record<StickerGender, string> = {
  boy: "男の子",
  girl: "女の子",
  unspecified: "未設定",
};

type PendingUpload = {
  dataUrls: string[];
};

type Props = {
  library: StickerLibraryItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onAdd: (
    items: { imageDataUrl: string; label: string; gender: StickerGender }[],
  ) => void;
  onUpdateItem: (
    id: string,
    patch: Partial<Pick<StickerLibraryItem, "label" | "gender">>,
  ) => void;
  onRemove: (id: string) => void;
};

export function StickerLibraryPanel({
  library,
  selectedIds,
  onToggleSelect,
  onAdd,
  onUpdateItem,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState("");

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(
      Array.from(files).map((file) => fileToDataUrl(file)),
    );
    setPending({ dataUrls });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRecognizeAndAdd = async () => {
    if (!pending) return;
    setIsRecognizing(true);
    setError("");
    try {
      const recognized = await recognizeStickerPhrases(pending.dataUrls);
      onAdd(
        pending.dataUrls.map((imageDataUrl, i) => ({
          imageDataUrl,
          label: recognized.find((r) => r.index === i)?.recognizedPhrase ?? "",
          gender: "unspecified" as const,
        })),
      );
      setPending(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "セリフの自動認識に失敗しました。",
      );
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleAddWithoutRecognition = () => {
    if (!pending) return;
    onAdd(
      pending.dataUrls.map((imageDataUrl) => ({
        imageDataUrl,
        label: "",
        gender: "unspecified" as const,
      })),
    );
    setPending(null);
  };

  return (
    <section className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">
          既存スタンプライブラリ
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            ＋画像を追加
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
      </div>

      {pending && (
        <div className="space-y-2 rounded-md border border-yellow-300 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            {pending.dataUrls.length}枚を追加します。セリフを自動認識しますか？（
            {estimateRecognizeCost(pending.dataUrls.length).label}）
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRecognizeAndAdd()}
              disabled={isRecognizing}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isRecognizing ? "認識中..." : "認識して追加する"}
            </button>
            <button
              type="button"
              onClick={handleAddWithoutRecognition}
              disabled={isRecognizing}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              認識せずに追加（後で手入力）
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              disabled={isRecognizing}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {library.length === 0 ? (
        <p className="text-xs text-gray-400">
          まだスタンプが登録されていません。既存のWAVESスタンプ画像を追加してください。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {library.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-md border-2 p-2 ${
                  selected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleSelect(item.id)}
                  className="block w-full"
                >
                  <img
                    src={item.imageDataUrl}
                    alt={item.label || "スタンプ画像"}
                    className="mx-auto h-24 w-full rounded bg-white object-contain"
                  />
                </button>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) =>
                    onUpdateItem(item.id, { label: e.target.value })
                  }
                  placeholder="セリフ／メモ"
                  className="mt-2 w-full rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between gap-1">
                  <select
                    value={item.gender}
                    onChange={(e) =>
                      onUpdateItem(item.id, {
                        gender: e.target.value as StickerGender,
                      })
                    }
                    className="min-w-0 flex-1 rounded border border-gray-300 px-1 py-0.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {(Object.keys(GENDER_LABELS) as StickerGender[]).map(
                      (g) => (
                        <option key={g} value={g}>
                          {GENDER_LABELS[g]}
                        </option>
                      ),
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
                {selected && (
                  <p className="mt-1 text-center text-xs font-semibold text-blue-600">
                    参考画像に選択中
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
