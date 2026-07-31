import { useEffect, useState } from "react";
import { getBrandContext, updateBrandContext } from "../../lib/instagramAiApi";
import {
  analyzeBrandContext,
  appendMissingFactsTemplate,
} from "../../lib/brandContextCompleteness";
import type { BrandContext } from "../../types/instagramAi";
import { POST_CATEGORIES } from "../../types/instagramAi";
import { TagListEditor } from "./TagListEditor";

type SaveState = "idle" | "saving" | "saved" | "error";

export function BrandContextScreen() {
  const [data, setData] = useState<BrandContext | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    getBrandContext()
      .then(setData)
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) {
    return <p className="text-sm font-semibold text-red-600">{loadError}</p>;
  }
  if (!data) {
    return <p className="text-sm text-gray-400">読み込み中...</p>;
  }

  const ratioFor = (category: string) =>
    data.contentRatioTargets.find((r) => r.category === category)
      ?.targetPercent ?? 0;

  const setRatio = (category: string, percent: number) => {
    const rest = data.contentRatioTargets.filter(
      (r) => r.category !== category,
    );
    setData({
      ...data,
      contentRatioTargets: [...rest, { category, targetPercent: percent }],
    });
  };

  const ratioTotal = POST_CATEGORIES.reduce(
    (sum, c) => sum + ratioFor(c),
    0,
  );
  const contextChecks = analyzeBrandContext(data.operatingGuide);
  const missingContextCount = contextChecks.filter(
    (item) => !item.confirmed,
  ).length;

  const handleSave = async () => {
    setSaveState("saving");
    setSaveError("");
    try {
      const updated = await updateBrandContext({
        operatingGuide: data.operatingGuide,
        brandColors: data.brandColors,
        contentRatioTargets: data.contentRatioTargets,
        kpiMetrics: data.kpiMetrics,
      });
      setData(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存に失敗しました。");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">
          ブランドコンテキスト設定
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ここで設定した内容は、投稿提案のたびにAIへそのまま渡されます。毎回聞き直す必要はありません。最終更新：
          {new Date(data.updatedAt).toLocaleString("ja-JP")}
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              投稿に必要な確定情報
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              文章から自動判定した目安です。不足した情報は、AIが推測せず投稿案を止める場合があります。
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              missingContextCount === 0
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {missingContextCount === 0
              ? "必要情報を確認済み"
              : `未確認 ${missingContextCount}項目`}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {contextChecks.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 rounded-md bg-white p-3"
            >
              <span
                aria-hidden="true"
                className={item.confirmed ? "text-green-600" : "text-yellow-600"}
              >
                {item.confirmed ? "✓" : "!"}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        {missingContextCount > 0 && (
          <button
            type="button"
            onClick={() =>
              setData({
                ...data,
                operatingGuide: appendMissingFactsTemplate(data.operatingGuide),
              })
            }
            className="mt-3 rounded-md border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-900 hover:bg-yellow-100"
          >
            不足項目テンプレートを運用ガイドへ追加
          </button>
        )}
        <p className="mt-2 text-xs text-gray-500">
          テンプレートを追加しても自動保存されません。内容を確認してから「保存する」を押してください。
        </p>
      </section>

      <div>
        <label
          htmlFor="operating-guide"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          運用ガイド（役割・ターゲット・ブランドイメージ・投稿方針など全文）
        </label>
        <textarea
          id="operating-guide"
          value={data.operatingGuide}
          onChange={(e) => setData({ ...data, operatingGuide: e.target.value })}
          rows={20}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none"
        />
      </div>

      <TagListEditor
        label="ブランドカラー"
        values={data.brandColors}
        onChange={(brandColors) => setData({ ...data, brandColors })}
        placeholder="例：紺"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          投稿比率の目標（合計{ratioTotal}%）
        </label>
        <div className="grid grid-cols-2 gap-3">
          {POST_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-sm text-gray-600">
                {category}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={ratioFor(category)}
                onChange={(e) =>
                  setRatio(category, Number(e.target.value))
                }
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          ))}
        </div>
        {ratioTotal !== 100 && (
          <p className="mt-1 text-xs text-yellow-700">
            合計が100%になっていません（現在{ratioTotal}%）。
          </p>
        )}
      </div>

      <TagListEditor
        label="評価指標（KPI）"
        values={data.kpiMetrics}
        onChange={(kpiMetrics) => setData({ ...data, kpiMetrics })}
        placeholder="例：体験申込み数"
      />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saveState === "saving" ? "保存中..." : "保存する"}
        </button>
        {saveState === "saved" && (
          <span className="text-sm font-semibold text-green-600">
            保存しました
          </span>
        )}
        {saveState === "error" && (
          <span className="text-sm font-semibold text-red-600">
            {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
