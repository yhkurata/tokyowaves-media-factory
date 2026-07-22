import { useRef, useState } from "react";
import {
  buildProjectData,
  parseProjectData,
  projectFilename,
  serializeProjectData,
  ProjectFileParseError,
  type ProjectSnapshot,
  type ProjectData,
} from "../../lib/projectFile";
import { triggerBlobDownload } from "../../lib/exportImage";

type Props = {
  snapshot: ProjectSnapshot;
  onLoad: (data: ProjectData) => void;
};

export function ProjectBar({ snapshot, onLoad }: Props) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const data = buildProjectData(snapshot);
    const json = serializeProjectData(data);
    const blob = new Blob([json], { type: "application/json" });
    triggerBlobDownload(blob, projectFilename(snapshot.tournament.name));
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const data = parseProjectData(text);
      onLoad(data);
    } catch (err) {
      setError(
        err instanceof ProjectFileParseError
          ? err.message
          : "読み込みに失敗しました。ファイルを確認してください。",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={handleSave}
        className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        💾 プロジェクトを保存
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        📂 プロジェクトを読み込む
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
