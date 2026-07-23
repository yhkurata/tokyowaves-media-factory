import { useState } from "react";
import type { ExpeditionGuideInput } from "../../types/expeditionGuide";
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

// 「この場所・この時間ならこの内容」をまるごと選んで復元するためのピッカー。
// 初回は大宮公園遠征・埼玉栄遠征のシードテンプレートから選べ、
// 使っていくうちに自分たちのテンプレートを増やしていける（編集・削除も可能）。
export function ExpeditionGuideTemplatePicker({
  currentInput,
  onLoadTemplate,
}: Props) {
  const [templates, setTemplates] = useState(() =>
    loadExpeditionGuideTemplates(),
  );
  const [selectedId, setSelectedId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

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

  const handleSaveNew = () => {
    if (newName.trim() === "") return;
    const next = saveExpeditionGuideTemplate(newName, currentInput);
    setTemplates(next);
    setNewName("");
    setIsSaving(false);
  };

  const handleUpdateSelected = () => {
    if (!selectedTemplate) return;
    if (
      !window.confirm(
        `テンプレート「${selectedTemplate.name}」を今の内容で上書き保存しますか？`,
      )
    ) {
      return;
    }
    const next = updateExpeditionGuideTemplate(selectedTemplate.id, currentInput);
    setTemplates(next);
    setMessage(`「${selectedTemplate.name}」を今の内容で更新しました。`);
  };

  const handleDeleteSelected = () => {
    if (!selectedTemplate) return;
    if (!window.confirm(`テンプレート「${selectedTemplate.name}」を削除しますか？`)) {
      return;
    }
    const next = deleteExpeditionGuideTemplate(selectedTemplate.id);
    setTemplates(next);
    setSelectedId("");
    setMessage(`「${selectedTemplate.name}」を削除しました。`);
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
          className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="" disabled>
            選択してください
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
              onClick={handleUpdateSelected}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              今の内容で更新
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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
              onClick={handleSaveNew}
              disabled={newName.trim() === ""}
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
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            現在の内容を新しいテンプレートとして保存
          </button>
        )}
      </div>
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
