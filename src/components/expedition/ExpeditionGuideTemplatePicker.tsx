import { useEffect, useState } from "react";
import type { ExpeditionGuideInput } from "../../types/expeditionGuide";
import type { ExpeditionGuideTemplate } from "../../types/expeditionGuideTemplate";
import {
  deleteExpeditionGuideTemplate,
  loadExpeditionGuideTemplates,
  saveExpeditionGuideTemplate,
  updateExpeditionGuideTemplate,
} from "../../lib/expeditionGuideTemplates";

type Props = {
  currentInput: ExpeditionGuideInput;
  onLoadTemplate: (input: ExpeditionGuideInput) => void;
};

// 旧バージョン（DB移行前）がテンプレートを保存していたlocalStorageキー。
// 各端末に取り込み未了のデータが残っている可能性があるため、起動時に
// チェックして「共有テンプレートに取り込む」を案内する。
const LEGACY_STORAGE_KEY = "tokyowaves-media-factory:expedition-guide-templates";

interface LegacyTemplate {
  name: string;
  input: ExpeditionGuideInput;
}

function readLegacyTemplates(): LegacyTemplate[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is LegacyTemplate =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Record<string, unknown>).name === "string" &&
        typeof (t as Record<string, unknown>).input === "object",
    );
  } catch {
    return [];
  }
}

// 「この場所・この時間ならこの内容」をまるごと選んで復元するためのピッカー。
// テンプレートはチーム全員（監督・部長等）で共有するデータとしてサーバー
// （Neon DB）に保存されており、誰かが保存・更新・削除すると全員の画面に
// 反映される。初回は大宮公園遠征・埼玉栄遠征等のシードテンプレートから選べ、
// 使っていくうちにチームのテンプレートを増やしていける（編集・削除も可能）。
export function ExpeditionGuideTemplatePicker({
  currentInput,
  onLoadTemplate,
}: Props) {
  const [templates, setTemplates] = useState<ExpeditionGuideTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [legacyCandidates, setLegacyCandidates] = useState<LegacyTemplate[]>(
    [],
  );
  const [isImporting, setIsImporting] = useState(false);

  const refresh = () => {
    setIsLoading(true);
    setLoadError("");
    return loadExpeditionGuideTemplates()
      .then((result) => {
        setTemplates(result);
        // この端末にDB未取り込みの旧テンプレート（localStorage時代の保存分）が
        // 無いか確認する。名前が共有テンプレートに既にあるものは、既に取り込み
        // 済みか元々重複していたものとみなしてスキップする。
        const existingNames = new Set(result.map((t) => t.name));
        const candidates = readLegacyTemplates().filter(
          (t) => !existingNames.has(t.name),
        );
        setLegacyCandidates(candidates);
        return result;
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "テンプレート一覧の取得に失敗しました。",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleImportLegacy = async () => {
    setIsImporting(true);
    setMessage("");
    try {
      for (const t of legacyCandidates) {
        await saveExpeditionGuideTemplate(t.name, t.input);
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      await refresh();
      setMessage(
        `この端末に保存されていたテンプレート${legacyCandidates.length}件を共有テンプレートに取り込みました。`,
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "テンプレートの取り込みに失敗しました。",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMessage("");
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    // 期日・練習時間は毎回変わりうる／修正忘れが起きやすいため、
    // テンプレートを選んでも必ず空欄に戻し、その都度入力し直してもらう。
    // それ以外（持ち物・その他を含む）はテンプレートごとに内容を独立させたいため、
    // テンプレートの内容をそのまま反映する。
    onLoadTemplate({
      ...template.input,
      schedule: "",
      practiceTime: "",
    });
  };

  const handleSaveNew = async () => {
    if (newName.trim() === "") return;
    setIsBusy(true);
    setMessage("");
    try {
      await saveExpeditionGuideTemplate(newName, currentInput);
      await refresh();
      setMessage(`「${newName.trim()}」を保存しました。`);
      setNewName("");
      setIsSaving(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "テンプレートの保存に失敗しました。",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateSelected = async () => {
    if (!selectedTemplate) return;
    if (
      !window.confirm(
        `テンプレート「${selectedTemplate.name}」を今の内容で上書き保存しますか？`,
      )
    ) {
      return;
    }
    setIsBusy(true);
    setMessage("");
    try {
      await updateExpeditionGuideTemplate(selectedTemplate.id, currentInput);
      await refresh();
      setMessage(`「${selectedTemplate.name}」を今の内容で更新しました。`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "テンプレートの更新に失敗しました。",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedTemplate) return;
    if (!window.confirm(`テンプレート「${selectedTemplate.name}」を削除しますか？`)) {
      return;
    }
    setIsBusy(true);
    setMessage("");
    try {
      await deleteExpeditionGuideTemplate(selectedTemplate.id);
      await refresh();
      setMessage(`「${selectedTemplate.name}」を削除しました。`);
      setSelectedId("");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "テンプレートの削除に失敗しました。",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          テンプレートから選ぶ
        </label>
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={isLoading || isBusy}
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        >
          <option value="" disabled>
            {isLoading ? "読み込み中…" : "選択してください"}
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {selectedTemplate && (
          <>
            <button
              type="button"
              onClick={() => void handleUpdateSelected()}
              disabled={isBusy}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              今の内容で更新
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              disabled={isBusy}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              削除
            </button>
          </>
        )}

        {isSaving ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="テンプレート名（例：大宮公園遠征）"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSaveNew()}
              disabled={newName.trim() === "" || isBusy}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSaving(false);
                setNewName("");
              }}
              className="text-xs text-gray-500 hover:underline"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSaving(true)}
            disabled={isBusy}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            現在の内容を新しいテンプレートとして保存
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        テンプレートはチーム共有です。保存・更新・削除は他のメンバーの画面にも反映されます。
      </p>
      {legacyCandidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          <span>
            この端末にだけ保存されていた旧テンプレートが{legacyCandidates.length}
            件見つかりました（{legacyCandidates.map((t) => t.name).join("・")}）。
          </span>
          <button
            type="button"
            onClick={() => void handleImportLegacy()}
            disabled={isImporting}
            className="rounded-md bg-amber-600 px-2.5 py-1 font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isImporting ? "取り込み中…" : "共有テンプレートに取り込む"}
          </button>
        </div>
      )}
      {loadError && <p className="text-xs text-red-600">{loadError}</p>}
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
