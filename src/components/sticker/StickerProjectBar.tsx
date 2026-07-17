import { useRef, useState } from "react";
import {
  buildStickerWorkspace,
  parseStickerWorkspace,
  serializeStickerWorkspace,
  stickerWorkspaceFilename,
  StickerProjectFileParseError,
} from "../../lib/stickerProjectFile";
import { triggerBlobDownload } from "../../lib/exportImage";
import type {
  StickerWorkspace,
  StickerWorkspaceSnapshot,
} from "../../types/sticker";

type Props = {
  snapshot: StickerWorkspaceSnapshot;
  onLoad: (data: StickerWorkspace) => void;
};

export function StickerProjectBar({ snapshot, onLoad }: Props) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const data = buildStickerWorkspace(snapshot);
    const json = serializeStickerWorkspace(data);
    const blob = new Blob([json], { type: "application/json" });
    triggerBlobDownload(blob, stickerWorkspaceFilename());
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const data = parseStickerWorkspace(text);
      onLoad(data);
    } catch (err) {
      setError(
        err instanceof StickerProjectFileParseError
          ? err.message
          : "読み込みに失敗しました。ファイルを確認してください。",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={handleSave}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        💾 保存
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        📂 読み込む
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => void handleFileSelected(e.target.files?.[0])}
      />
      {error && (
        <span className="text-xs font-semibold text-red-600">{error}</span>
      )}
    </div>
  );
}
