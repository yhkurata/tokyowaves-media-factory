import { useState } from "react";
import type { StickerCandidate, StickerCandidateStatus } from "../../types/sticker";
import { fileToDataUrl } from "../../lib/imageFile";
import { convertToLineStickerFormat } from "../../lib/lineStickerFormat";

const STATUS_LABELS: Record<StickerCandidateStatus, string> = {
  proposed: "提案中",
  adopted: "採用",
  rejected: "却下",
  completed: "完成",
};

const STATUS_COLORS: Record<StickerCandidateStatus, string> = {
  proposed: "bg-gray-100 text-gray-600",
  adopted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  completed: "bg-green-100 text-green-700",
};

function CopyableBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
        {text}
      </pre>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-xs font-semibold text-gray-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

type Props = {
  candidate: StickerCandidate;
  isOpen: boolean;
  onToggle: () => void;
  onUpdatePlan: (patch: Partial<StickerCandidate["plan"]>) => void;
  onUpdateStatus: (status: StickerCandidateStatus) => void;
  onUploadCompletedImage: (dataUrl: string) => void;
  onSetLineFormattedImage: (dataUrl: string) => void;
  onDelete: () => void;
};

export function StickerCandidateCard({
  candidate,
  isOpen,
  onToggle,
  onUpdatePlan,
  onUpdateStatus,
  onUploadCompletedImage,
  onSetLineFormattedImage,
  onDelete,
}: Props) {
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const { plan } = candidate;

  const handleUploadCompleted = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onUploadCompletedImage(dataUrl);
    onUpdateStatus("completed");
  };

  const handleConvertToLineFormat = async () => {
    if (!candidate.completedImageDataUrl) return;
    setConverting(true);
    setConvertError("");
    try {
      const converted = await convertToLineStickerFormat(
        candidate.completedImageDataUrl,
      );
      onSetLineFormattedImage(converted);
    } catch (err) {
      setConvertError(
        err instanceof Error ? err.message : "LINE形式への変換に失敗しました。",
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {candidate.completedImageDataUrl ? (
          <img
            src={candidate.completedImageDataUrl}
            alt={plan.phrase}
            className="h-12 w-12 shrink-0 rounded bg-gray-50 object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
            未生成
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[candidate.status]}`}
            >
              {STATUS_LABELS[candidate.status]}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">
            {plan.phrase || "（セリフ未設定）"}
          </p>
        </div>
        <span className="shrink-0 text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">状態：</label>
            <select
              value={candidate.status}
              onChange={(e) =>
                onUpdateStatus(e.target.value as StickerCandidateStatus)
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              {(Object.keys(STATUS_LABELS) as StickerCandidateStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Field
              label="セリフ"
              value={plan.phrase}
              onChange={(v) => onUpdatePlan({ phrase: v })}
            />
            <Field
              label="利用場面"
              value={plan.scene}
              onChange={(v) => onUpdatePlan({ scene: v })}
            />
            <Field
              label="感情"
              value={plan.emotion}
              onChange={(v) => onUpdatePlan({ emotion: v })}
            />
            <Field
              label="表情"
              value={plan.expression}
              onChange={(v) => onUpdatePlan({ expression: v })}
            />
            <Field
              label="ポーズ"
              value={plan.pose}
              onChange={(v) => onUpdatePlan({ pose: v })}
            />
            <Field
              label="手の動き"
              value={plan.handGesture}
              onChange={(v) => onUpdatePlan({ handGesture: v })}
            />
            <Field
              label="体の向き"
              value={plan.bodyOrientation}
              onChange={(v) => onUpdatePlan({ bodyOrientation: v })}
            />
            <Field
              label="小物"
              value={plan.props}
              onChange={(v) => onUpdatePlan({ props: v })}
            />
            <Field
              label="背景演出"
              value={plan.backgroundEffect}
              onChange={(v) => onUpdatePlan({ backgroundEffect: v })}
            />
            <Field
              label="水しぶき"
              value={plan.splash}
              onChange={(v) => onUpdatePlan({ splash: v })}
            />
            <Field
              label="効果線"
              value={plan.effectLines}
              onChange={(v) => onUpdatePlan({ effectLines: v })}
            />
            <Field
              label="文字の雰囲気"
              value={plan.textStyle}
              onChange={(v) => onUpdatePlan({ textStyle: v })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={plan.hasBall}
              onChange={(e) => onUpdatePlan({ hasBall: e.target.checked })}
            />
            水球ボールを持たせる／描く
          </label>

          <div>
            <label className="mb-0.5 block text-xs font-semibold text-gray-500">
              既存スタンプ・他候補との差別化ポイント
            </label>
            <textarea
              value={plan.differentiationNote}
              onChange={(e) =>
                onUpdatePlan({ differentiationNote: e.target.value })
              }
              rows={2}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <CopyableBlock
            label="画像編集プロンプト（ChatGPT貼り付け用・英語）"
            text={plan.imageGenPrompt}
          />

          <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-bold text-gray-600">完成画像の管理</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                完成画像をアップロード
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => void handleUploadCompleted(e.target.files?.[0])}
                />
              </label>
              {candidate.completedImageDataUrl && (
                <button
                  type="button"
                  onClick={() => void handleConvertToLineFormat()}
                  disabled={converting}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {converting ? "変換中..." : "LINEスタンプ形式に変換（370×320以内）"}
                </button>
              )}
            </div>
            {convertError && (
              <p className="text-xs font-semibold text-red-600">{convertError}</p>
            )}
            <div className="flex items-center gap-4">
              {candidate.completedImageDataUrl && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">完成画像</p>
                  <img
                    src={candidate.completedImageDataUrl}
                    alt="完成画像"
                    className="h-24 rounded border border-gray-200 bg-white object-contain"
                  />
                </div>
              )}
              {candidate.lineFormattedImageDataUrl && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">LINE形式（370×320以内）</p>
                  <img
                    src={candidate.lineFormattedImageDataUrl}
                    alt="LINE形式画像"
                    className="h-24 rounded border border-gray-200 bg-white object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
