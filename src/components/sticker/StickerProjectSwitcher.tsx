import { useState } from "react";
import type { StickerCharacterProject } from "../../types/sticker";

// 複数キャラクター管理のUI:プロジェクトの切り替え・新規作成・名前変更・削除を提供する。
type Props = {
  projects: StickerCharacterProject[];
  activeProjectId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function StickerProjectSwitcher({
  projects,
  activeProjectId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const canDelete = projects.length > 1;

  const handleCreate = () => {
    const name = newName.trim();
    if (name === "") return;
    onCreate(name);
    setNewName("");
    setCreating(false);
  };

  const startRenaming = () => {
    setRenameValue(activeProject?.name ?? "");
    setRenaming(true);
  };

  const handleRename = () => {
    const name = renameValue.trim();
    if (name === "") return;
    onRename(activeProjectId, name);
    setRenaming(false);
  };

  const handleDelete = () => {
    onDelete(activeProjectId);
    setConfirmingDelete(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {renaming ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            autoFocus
            className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleRename}
            disabled={renameValue.trim() === ""}
            className="whitespace-nowrap rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => setRenaming(false)}
            className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            取消
          </button>
        </div>
      ) : (
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
      )}

      {!renaming && (
        <button
          type="button"
          onClick={startRenaming}
          className="whitespace-nowrap rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          名前変更
        </button>
      )}

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
            className="whitespace-nowrap rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          ＋新規プロジェクト
        </button>
      )}

      {canDelete &&
        (confirmingDelete ? (
          <div className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1">
            <span className="text-xs text-red-700">
              「{activeProject?.name}」を削除しますか？元に戻せません。
            </span>
            <button
              type="button"
              onClick={handleDelete}
              className="whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
            >
              削除する
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        ))}
    </div>
  );
}
