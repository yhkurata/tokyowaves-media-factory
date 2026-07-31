import { useState } from "react";
import {
  isCharacterSettingsEmpty,
  type CharacterSettings,
  type StickerPlan,
} from "../../types/sticker";
import { generateStickerPlans, estimateStickerPlanCost } from "../../lib/stickerApi";
import {
  formatEstimateLabel,
  type ApiCallCostEstimate,
} from "../../lib/apiCostEstimate";
import { isAdminMode } from "../../lib/adminMode";

const ALLOWED_COUNTS = [8, 16, 24, 32, 40] as const;

// 一般ユーザーは実行前に必ず概算コストの確認を挟む（Media Factory全体のAI課金
// ルールに統一）。管理者（?admin=1）はこの確認をスキップして即実行できる。
type RequestState = "idle" | "estimating" | "confirming" | "loading" | "error";

type Props = {
  characterSettings: CharacterSettings;
  referenceImageDataUrls: string[];
  existingCandidates: { phrase: string; scene: string }[];
  onGenerated: (
    plans: StickerPlan[],
    meta: { instruction: string; requestedCount: 8 | 16 | 24 | 32 | 40 },
    // 確認ダイアログで取得済みの見積もり（実行前にcount_tokensで実測済み）を
    // そのまま渡す。バッチの記録用ラベルとして再利用し、二重に計算しない。
    // 管理者実行時は確認ダイアログ自体をスキップするためnull。
    estimate: ApiCallCostEstimate | null,
  ) => void;
};

export function StickerInstructionForm({
  characterSettings,
  referenceImageDataUrls,
  existingCandidates,
  onGenerated,
}: Props) {
  const [instruction, setInstruction] = useState(
    "既存の男の子版を参考に、敬語・丁寧語を中心とした新しいスタンプ案を考えて。セリフだけでなく、表情・ポーズ・構図・背景演出も変えてください。",
  );
  const [requestedCount, setRequestedCount] =
    useState<(typeof ALLOWED_COUNTS)[number]>(16);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<ApiCallCostEstimate | null>(null);
  const admin = isAdminMode();

  const characterSettingsMissing = isCharacterSettingsEmpty(characterSettings);

  const handleGenerate = async () => {
    setRequestState("loading");
    setError("");
    try {
      const plans = await generateStickerPlans({
        instruction,
        requestedCount,
        characterSettings,
        referenceImageDataUrls,
        existingCandidates,
      });
      onGenerated(plans, { instruction, requestedCount }, estimate);
      setRequestState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "企画の生成に失敗しました。");
      setRequestState("error");
    }
  };

  const handleClickGenerate = async () => {
    if (admin) {
      void handleGenerate();
      return;
    }
    setRequestState("estimating");
    setError("");
    try {
      const result = await estimateStickerPlanCost({
        instruction,
        requestedCount,
        characterSettings,
        referenceImageDataUrls,
        existingCandidates,
      });
      setEstimate(result);
    } catch (err) {
      setEstimate(null);
      setError(err instanceof Error ? err.message : "見積もりに失敗しました。");
    }
    setRequestState("confirming");
  };

  return (
    <section className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-700">新しいスタンプを企画する</h2>

      <p className="text-xs text-gray-500">
        参考画像：
        {referenceImageDataUrls.length > 0
          ? `${referenceImageDataUrls.length}枚を選択中（上のライブラリでチェック）`
          : "未選択（ライブラリから参考にする画像を選んでください。任意）"}
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          自由指示
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          placeholder="例：保護者同士で使いやすいスタンプを考えて／試合や練習で使えるスタンプを作って／このセリフに合う表情とポーズを考えて　など、自由に指示してください"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">件数</label>
        <select
          value={requestedCount}
          onChange={(e) =>
            setRequestedCount(
              Number(e.target.value) as (typeof ALLOWED_COUNTS)[number],
            )
          }
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          {ALLOWED_COUNTS.map((count) => (
            <option key={count} value={count}>
              {count}件
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          （LINEの入稿枚数に合わせた選択肢です）
        </span>
      </div>

      {characterSettingsMissing ? (
        <p className="text-xs font-semibold text-yellow-700">
          ※ 上の「キャラクター設定」を先に済ませてください。
        </p>
      ) : requestState === "idle" ? (
        <button
          type="button"
          onClick={() => void handleClickGenerate()}
          disabled={instruction.trim() === ""}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          企画を生成する
        </button>
      ) : requestState === "estimating" ? (
        <p className="text-sm text-gray-500">概算コストを計算しています...</p>
      ) : requestState === "confirming" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            {estimate
              ? formatEstimateLabel(estimate)
              : "推定コストを取得できませんでした（実行は可能です）"}
            ・Claude APIを呼び出します。実行しますか？
          </p>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            実行する
          </button>
          <button
            type="button"
            onClick={() => {
              setRequestState("idle");
              setEstimate(null);
            }}
            className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      ) : null}

      {requestState === "loading" && (
        <p className="text-sm text-gray-500">
          AIが{requestedCount}件を企画中...（拡張思考を使うため数十秒〜数分かかります）
        </p>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </section>
  );
}
