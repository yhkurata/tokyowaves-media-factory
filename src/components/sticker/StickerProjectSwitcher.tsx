import { useState } from "react";
import type { StickerCharacterProject } from "../../types/sticker";

// 複数キャラクター管理の最小限UI:プロジェクトの切り替えと新規作成だけを提供する。
// 名前変更・削除などの本格的な管理画面は別途作る想定。
type Props = {
  projects: StickerCharacterProject[];
  activeProjectId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
};

export function StickerProjectSwitcher({
  projects,
  activeProjectId,
  onSwitch,
  onCreate,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (name === "") return;
    onCreate(name);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeProjectId}
        onChange={(e) => onSwitch(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {creating ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="プロジェクト名"
            autoFocus
            className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={newName.trim() === ""}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          ＋新規プロジェクト
        </button>
      )}
    </div>
  );
}
