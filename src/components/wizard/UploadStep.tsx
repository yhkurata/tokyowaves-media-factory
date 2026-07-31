import { useRef, useState } from "react";
import { fileToDataUrl } from "../../lib/imageFile";
import { isAdminMode } from "../../lib/adminMode";
import {
  formatEstimateLabel,
  type ApiCallCostEstimate,
} from "../../lib/apiCostEstimate";

export type SupportedMediaType = "image/png" | "image/jpeg" | "application/pdf";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 8;

function mediaTypeForFile(file: File): SupportedMediaType | null {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/jpeg") return "image/jpeg";
  if (file.type === "application/pdf") return "application/pdf";
  return null;
}

async function fetchExtractEstimate(
  files: File[],
): Promise<ApiCallCostEstimate> {
  const encoded = await Promise.all(
    files.map(async (file) => ({
      mediaType: mediaTypeForFile(file),
      dataBase64: (await fileToDataUrl(file)).split(",")[1] ?? "",
    })),
  );
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "estimate", files: encoded }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "見積もりに失敗しました。");
  }
  const body = await res.json();
  return body.result as ApiCallCostEstimate;
}

// 一般ユーザーは実行前に必ず概算コストの確認を挟む（Media Factory全体のAI課金
// ルールに統一）。管理者（?admin=1）はこの確認をスキップして即実行できる。
type RequestState = "idle" | "estimating" | "confirming";

type Props = {
  errorMessage: string;
  onAnalyze: (files: File[]) => void;
  isSupplement?: boolean;
};

export function UploadStep({ errorMessage, onAnalyze, isSupplement }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [estimate, setEstimate] = useState<ApiCallCostEstimate | null>(null);
  const [estimateError, setEstimateError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const admin = isAdminMode();

  const resetConfirmState = () => {
    setRequestState("idle");
    setEstimate(null);
    setEstimateError("");
  };

  const handleSelectFiles = (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    resetConfirmState();
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

  const handleClickAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    if (admin) {
      onAnalyze(selectedFiles);
      return;
    }
    setRequestState("estimating");
    setEstimateError("");
    try {
      const result = await fetchExtractEstimate(selectedFiles);
      setEstimate(result);
    } catch (err) {
      setEstimate(null);
      setEstimateError(
        err instanceof Error ? err.message : "見積もりに失敗しました。",
      );
    }
    setRequestState("confirming");
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

        {selectedFiles.length > 0 && requestState === "idle" && (
          <button
            type="button"
            onClick={() => void handleClickAnalyze()}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {isSupplement ? "追加の資料を解析して統合する" : "資料を解析する"}
          </button>
        )}

        {requestState === "estimating" && (
          <p className="text-sm text-gray-500">概算コストを計算しています...</p>
        )}

        {requestState === "confirming" && (
          <div className="w-full space-y-2 rounded-md bg-yellow-50 p-3 text-left">
            <p className="text-sm font-semibold text-yellow-900">
              {estimate
                ? formatEstimateLabel(estimate)
                : "推定コストを取得できませんでした（実行は可能です）"}
            </p>
            {estimate && (
              <p className="text-xs text-yellow-700">
                入力{estimate.estimatedInputTokens}トークン（実測）／出力約
                {estimate.estimatedOutputTokens}トークン（既定値・試合数により変動）
              </p>
            )}
            {estimateError && (
              <p className="text-xs text-yellow-700">{estimateError}</p>
            )}
            <p className="text-xs text-yellow-800">
              Claude APIを呼び出します。実行しますか？
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onAnalyze(selectedFiles)}
                className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                実行する
              </button>
              <button
                type="button"
                onClick={resetConfirmState}
                className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
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
