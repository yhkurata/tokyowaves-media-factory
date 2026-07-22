import { useState } from "react";
import type { ExpeditionGuideInput } from "../../types/expeditionGuide";
import {
  loadExpeditionGuideTemplates,
  saveExpeditionGuideTemplate,
} from "../../lib/expeditionGuideTemplates";

type Props = {
  currentInput: ExpeditionGuideInput;
  onLoadTemplate: (input: ExpeditionGuideInput) => void;
};

// 「この場所・この時間ならこの内容」をまるごと選んで復元するためのピッカー。
// 初回は大宮公園遠征・埼玉栄遠征のシードテンプレートから選べ、
// 使っていくうちに自分たちのテンプレートを増やしていける。
export function ExpeditionGuideTemplatePicker({
  currentInput,
  onLoadTemplate,
}: Props) {
  const [templates, setTemplates] = useState(() =>
    loadExpeditionGuideTemplates(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    // 期日・練習時間は毎回変わりうる／修正忘れが起きやすいため、
    // テンプレートを選んでも必ず空欄に戻し、その都度入力し直してもらう。
    // 持ち物・注意事項は場所によらず固定の定型文として運用するため、
    // テンプレートの内容で上書きせず今の入力をそのまま維持する。
    onLoadTemplate({
      ...template.input,
      schedule: "",
      practiceTime: "",
      extraItems: currentInput.extraItems,
      notes: currentInput.notes,
    });
  };

  const handleSave = () => {
    if (newName.trim() === "") return;
    const next = saveExpeditionGuideTemplate(newName, currentInput);
    setTemplates(next);
    setNewName("");
    setIsSaving(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
      <label className="text-sm font-medium text-gray-700">
        テンプレートから選ぶ
      </label>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) handleSelect(e.target.value);
          e.target.value = "";
        }}
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
            onClick={handleSave}
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
  );
}
