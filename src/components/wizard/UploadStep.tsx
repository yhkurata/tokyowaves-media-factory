import { useRef, useState } from "react";

export type SupportedMediaType = "image/png" | "image/jpeg" | "application/pdf";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 8;

function mediaTypeForFile(file: File): SupportedMediaType | null {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/jpeg") return "image/jpeg";
  if (file.type === "application/pdf") return "application/pdf";
  return null;
}

type Props = {
  errorMessage: string;
  onAnalyze: (files: File[]) => void;
  isSupplement?: boolean;
};

export function UploadStep({ errorMessage, onAnalyze, isSupplement }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFiles = (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }
    if (files.length > MAX_FILES) {
      setLocalError(`一度に添付できるのは最大${MAX_FILES}ファイルまでです。`);
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    for (const file of files) {
      if (!mediaTypeForFile(file)) {
        setLocalError(
          `「${file.name}」はPNG・JPEG・PDFのいずれでもありません。対応形式のファイルのみ選択してください。`,
        );
        setSelectedFiles([]);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setLocalError(`「${file.name}」のサイズが大きすぎます（1ファイル20MBまで）。`);
        setSelectedFiles([]);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }
    setLocalError("");
    setSelectedFiles(files);
  };

  return (
    <section className="mx-auto max-w-xl rounded-md border border-gray-300 bg-white p-8 text-center">
      <h2 className="text-lg font-bold text-gray-900">
        {isSupplement ? "追加の資料をアップロード" : "大会資料をアップロード"}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        PNG・JPEG・PDFを選択してください（最大{MAX_FILES}ファイルまで同時に添付できます）。
      </p>
      <div className="mt-3 rounded-md bg-blue-50 p-3 text-left text-xs text-blue-900">
        <p className="font-semibold">対戦カード（チーム名）まで自動入力するには：</p>
        <p className="mt-1">
          タイムテーブル・リーグ組み合わせ表・トーナメント表など、大会の資料をまとめて選択してください。試合No.を手がかりに資料同士を自動で照合し、チーム名まで埋めます。
        </p>
        {isSupplement && (
          <p className="mt-1 font-semibold">
            すでに入力済みの内容は上書きされません。空欄だけが自動的に埋まります。
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          onChange={(e) => handleSelectFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-6 py-3 text-sm font-semibold text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
        >
          📁 ファイルを選択
        </button>
        {selectedFiles.length > 0 && (
          <ul className="text-xs text-gray-500">
            {selectedFiles.map((file) => (
              <li key={file.name}>選択中のファイル：{file.name}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => selectedFiles.length > 0 && onAnalyze(selectedFiles)}
          disabled={selectedFiles.length === 0}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSupplement ? "追加の資料を解析して統合する" : "資料を解析する"}
        </button>
      </div>

      {(localError || errorMessage) && (
        <p className="mt-4 text-xs font-semibold text-red-600">
          {localError || errorMessage}
        </p>
      )}

      <p className="mt-6 text-xs text-gray-400">
        ※ このステップでAPI利用料が発生します。ファイルを選ぶだけでは解析は始まりません。
      </p>
    </section>
  );
}
