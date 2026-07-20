import { useRef, useState } from "react";
import type { CharacterSettings } from "../../types/sticker";
import { fileToDataUrl } from "../../lib/imageFile";
import { analyzeCharacterFromImages } from "../../lib/stickerApi";
import { estimateCharacterAnalysisCost } from "../../lib/stickerCostEstimate";

type Props = {
  settings: CharacterSettings;
  onUpdate: (patch: Partial<CharacterSettings>) => void;
};

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

type AnalysisState = "idle" | "confirming" | "loading" | "error";

function CharacterAnalysisPanel({
  onApply,
}: {
  onApply: (result: {
    characterFeatures: string;
    face: string;
    hairStyle: string;
    hat: string;
    logo: string;
    colorScheme: string;
    artStyle: string;
    mustNotChange: string[];
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [state, setState] = useState<AnalysisState>("idle");
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(
      Array.from(files).map((file) => fileToDataUrl(file)),
    );
    setImageDataUrls(dataUrls);
    setApplied(false);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    setState("loading");
    setError("");
    try {
      const result = await analyzeCharacterFromImages(imageDataUrls);
      onApply(result);
      setApplied(true);
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました。");
      setState("error");
    }
  };

  const estimate = estimateCharacterAnalysisCost(imageDataUrls.length);

  return (
    <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-4">
      <div>
        <p className="text-sm font-bold text-blue-900">
          キャラクターのイラストからAIで自動解析（初回はここから）
        </p>
        <p className="mt-1 text-xs text-blue-800">
          キャラクターが写っている画像を1枚以上アップロードすると、キャラクター特徴・顔・髪型・帽子・ロゴ・配色・絵柄・変えてはいけない要素をAIが解析し、下のフォームに自動入力します。既存のスタンプ画像に限らず、イラストや設定資料・写真などでも構いません。内容は後から自由に修正できます。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          画像を選択
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
        {imageDataUrls.length > 0 && (
          <span className="text-xs text-blue-800">
            {imageDataUrls.length}枚を選択中
          </span>
        )}
      </div>

      {imageDataUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageDataUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`参考画像${i + 1}`}
              className="h-16 w-16 rounded border border-blue-200 bg-white object-contain"
            />
          ))}
        </div>
      )}

      {imageDataUrls.length > 0 &&
        (state !== "confirming" ? (
          <button
            type="button"
            onClick={() => setState("confirming")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            AIで解析する
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              Claude APIを呼び出します（料金が発生します）。概算：{estimate.label}
            </p>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              実行する
            </button>
            <button
              type="button"
              onClick={() => setState("idle")}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        ))}

      {state === "loading" && (
        <p className="text-sm text-gray-500">AIが解析中...</p>
      )}
      {applied && (
        <p className="text-sm font-semibold text-green-700">
          解析結果を下のフォームに反映しました。内容を確認・修正してください。
        </p>
      )}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

export function CharacterSettingsScreen({ settings, onUpdate }: Props) {
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    if (newRule.trim() === "") return;
    onUpdate({ mustNotChange: [...settings.mustNotChange, newRule.trim()] });
    setNewRule("");
  };

  const removeRule = (index: number) => {
    onUpdate({
      mustNotChange: settings.mustNotChange.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">キャラクター設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          ここで保存した内容は、スタンプ企画を生成するたびに毎回AIへ渡され、キャラクターの統一感を保つために使われます。
        </p>
      </div>

      <CharacterAnalysisPanel onApply={(result) => onUpdate(result)} />

      <div className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
        <TextField
          label="キャラクター特徴"
          value={settings.characterFeatures}
          placeholder="例：TokyoWAVESの水球クラブ公式マスコット。明るく元気な少年"
          onChange={(v) => onUpdate({ characterFeatures: v })}
        />
        <TextField
          label="顔の特徴"
          value={settings.face}
          placeholder="例：丸みのある大きな目、健康的な肌の色"
          onChange={(v) => onUpdate({ face: v })}
        />
        <TextField
          label="髪型"
          value={settings.hairStyle}
          placeholder="例：黒髪の短髪"
          onChange={(v) => onUpdate({ hairStyle: v })}
        />
        <TextField
          label="帽子"
          value={settings.hat}
          placeholder="例：紺と黄色のWAVES水球帽（常に着用）"
          onChange={(v) => onUpdate({ hat: v })}
        />
        <TextField
          label="ロゴ"
          value={settings.logo}
          placeholder="例：水球帽側面にWAVESロゴ"
          onChange={(v) => onUpdate({ logo: v })}
        />
        <TextField
          label="配色"
          value={settings.colorScheme}
          placeholder="例：紺・青・黄色を中心とした配色"
          onChange={(v) => onUpdate({ colorScheme: v })}
        />
        <TextField
          label="絵柄・作風"
          value={settings.artStyle}
          placeholder="例：明るく親しみやすいアニメ調、太めの輪郭線"
          onChange={(v) => onUpdate({ artStyle: v })}
        />
        <TextField
          label="表情の特徴"
          value={settings.expressionNotes}
          placeholder="例：目を大きく、口を大きく開けて感情を分かりやすく表現する"
          onChange={(v) => onUpdate({ expressionNotes: v })}
        />
        <TextField
          label="男の子版・女の子版の違い"
          value={settings.boyGirlDifference}
          placeholder="例：女の子版は髪が長く、リボン付きの水球帽を着用"
          onChange={(v) => onUpdate({ boyGirlDifference: v })}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            変えてはいけない要素
          </label>
          <div className="space-y-1.5">
            {settings.mustNotChange.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-800">
                  {rule}
                </span>
                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addRule();
                }
              }}
              placeholder="例：WAVESの水球帽は必ず着用する"
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addRule}
              className="shrink-0 rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              ＋追加
            </button>
          </div>
        </div>

        <TextField
          label="その他自由記述"
          value={settings.freeNotes}
          placeholder="その他、伝えておきたい特徴があれば自由に記述してください"
          onChange={(v) => onUpdate({ freeNotes: v })}
        />
      </div>
    </div>
  );
}
