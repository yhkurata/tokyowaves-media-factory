import { useState } from "react";
import type { ExpeditionGuideEnhanceMode } from "../../types/expeditionGuide";

const ENHANCE_OPTIONS: { mode: ExpeditionGuideEnhanceMode; label: string }[] = [
  { mode: "improve", label: "文章を自然に改善" },
  { mode: "suggest-notes", label: "注意事項を提案" },
  { mode: "beginner-supplement", label: "初参加向けの補足を追加" },
  { mode: "parent-tone", label: "保護者向けの表現へ変更" },
];

type Props = {
  onEnhance: (mode: ExpeditionGuideEnhanceMode) => Promise<void>;
};

// 遠征要項AIの唯一のAI呼び出し窓口。基本の要項生成はテンプレートエンジンで
// APIを使わずに完結するため、ここのボタンを押したときだけ料金が発生する。
export function ExpeditionGuideEnhancePanel({ onEnhance }: Props) {
  const [loadingMode, setLoadingMode] =
    useState<ExpeditionGuideEnhanceMode | null>(null);
  const [error, setError] = useState("");

  const handleClick = async (mode: ExpeditionGuideEnhanceMode) => {
    setLoadingMode(mode);
    setError("");
    try {
      await onEnhance(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "強化に失敗しました。");
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <section className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">AIで強化する（任意）</p>
      <p className="text-xs text-blue-700">
        押すたびにClaude APIを呼び出します（料金が発生します）。3形式すべてに反映されます。
      </p>
      <div className="flex flex-wrap gap-2">
        {ENHANCE_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => void handleClick(mode)}
            disabled={loadingMode !== null}
            className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMode === mode ? "実行中..." : label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </section>
  );
}
