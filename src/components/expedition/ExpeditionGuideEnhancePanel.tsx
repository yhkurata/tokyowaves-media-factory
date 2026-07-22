import { useState } from "react";
import type {
  ExpeditionGuideEnhanceMode,
  ExpeditionGuideInput,
  ExpeditionGuideOutput,
} from "../../types/expeditionGuide";
import { buildExpeditionGuideEnhancePrompt } from "../../lib/expeditionGuideEnhancePrompt";
import { parseExpeditionGuideEnhanceReply } from "../../lib/expeditionGuideEnhanceParse";
import { CopyableBlock } from "../sticker/CopyableBlock";

const ENHANCE_OPTIONS: { mode: ExpeditionGuideEnhanceMode; label: string }[] = [
  { mode: "improve", label: "文章を自然に改善" },
  { mode: "suggest-notes", label: "注意事項を提案" },
  { mode: "beginner-supplement", label: "初参加向けの補足を追加" },
  { mode: "parent-tone", label: "保護者向けの表現へ変更" },
];

type Props = {
  fields: ExpeditionGuideInput;
  currentOutput: ExpeditionGuideOutput;
  onApply: (patch: Partial<ExpeditionGuideOutput>) => void;
};

// 管理者限定のAI強化パネル。サーバーAPIは一切呼ばない：
// コピー用プロンプトを表示し、管理者がClaude.ai/ChatGPTの無料Webチャットに
// 自分で貼り付けて実行し、返ってきた回答をこのパネルに貼り戻す方式。
export function ExpeditionGuideEnhancePanel({
  fields,
  currentOutput,
  onApply,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSelectMode = (mode: ExpeditionGuideEnhanceMode) => {
    setPrompt(buildExpeditionGuideEnhancePrompt(fields, currentOutput, mode));
    setMessage("");
    setError("");
  };

  const handleApplyReply = () => {
    const { output, matchedKeys } = parseExpeditionGuideEnhanceReply(reply);
    if (matchedKeys.length === 0) {
      setError(
        "貼り付けた内容から形式を認識できませんでした。AIの回答をそのまま（前後の説明文を含めずに）貼り付けてください。",
      );
      setMessage("");
      return;
    }
    onApply(output);
    setError("");
    setMessage(`反映しました：${matchedKeys.join("・")}`);
    setReply("");
  };

  return (
    <section className="space-y-3 rounded-md border border-purple-300 bg-purple-50 p-4">
      <p className="text-sm font-semibold text-purple-900">
        AIで強化する（管理者用）
      </p>
      <p className="text-xs text-purple-700">
        APIは使いません。下のプロンプトをコピーしてClaude.aiまたはChatGPT（無料のWebチャット）に貼り付けて実行し、返ってきた回答をコピーしてこのページに貼り戻してください。
      </p>

      <div className="flex flex-wrap gap-2">
        {ENHANCE_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleSelectMode(mode)}
            className="rounded-md border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
          >
            {label}
          </button>
        ))}
      </div>

      {prompt && (
        <>
          <CopyableBlock label="① コピーしてClaude.ai / ChatGPTに貼り付ける" text={prompt} />

          <div>
            <label className="mb-1 block text-xs font-semibold text-purple-900">
              ② AIの回答をここに貼り付ける
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={6}
              placeholder="===LINE=== から始まるAIの回答をそのまま貼り付けてください"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyReply}
            disabled={reply.trim() === ""}
            className="rounded-md bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            反映する
          </button>

          {message && (
            <p className="text-xs font-semibold text-green-700">{message}</p>
          )}
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
