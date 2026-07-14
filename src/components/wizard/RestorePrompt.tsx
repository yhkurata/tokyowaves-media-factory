type Props = {
  savedAt: string;
  onRestore: () => void;
  onDiscard: () => void;
};

export function RestorePrompt({ savedAt, onRestore, onDiscard }: Props) {
  const formatted = new Date(savedAt).toLocaleString("ja-JP");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-lg">
        <h2 className="text-base font-bold text-gray-900">
          前回の作業内容が残っています
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {formatted} 時点の入力内容が自動保存されています。復元しますか？
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            破棄して新規作成
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            復元する
          </button>
        </div>
      </div>
    </div>
  );
}
