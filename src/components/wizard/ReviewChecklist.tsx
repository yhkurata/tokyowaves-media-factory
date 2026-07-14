import type { ReviewGroup } from "../../lib/reviewItems";

type Props = {
  groups: ReviewGroup[];
  totalCount: number;
};

// 1件分の入力欄。フォーカスを外した瞬間に確定させる（＝入力中に自分自身が
// リストから消えてフォーカスを失う、という事故を防ぐため onBlur で確定する）。
function ReviewItemRow({
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
    <div className="flex items-center gap-3 py-2">
      <span className="w-44 shrink-0 truncate text-sm font-semibold text-gray-800">
        {label}
      </span>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => {
          if (e.target.value !== value) onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="min-w-0 flex-1 rounded-md border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
      />
    </div>
  );
}

export function ReviewChecklist({ groups, totalCount }: Props) {
  if (totalCount === 0) {
    return (
      <section className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">
          ✅ 要確認の項目はありません。下のプレビューを確認して、そのままPNG出力へ進めます。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-yellow-300 bg-white shadow-sm">
      <div className="rounded-t-lg border-b border-yellow-200 bg-yellow-50 px-4 py-3">
        <p className="text-sm font-bold text-yellow-800">
          ⚠️ 要確認：{totalCount}件
        </p>
        <p className="mt-0.5 text-xs text-yellow-700">
          AIが読み取れなかった項目だけを表示しています。ここだけ入力すれば完成です。
        </p>
      </div>
      <div className="divide-y divide-gray-100 px-4">
        {groups.map((group) => (
          <div key={group.id} className="py-3">
            <p className="mb-1 text-xs font-semibold text-gray-500">
              {group.groupLabel}
            </p>
            <div className="divide-y divide-gray-50">
              {group.items.map((item) => (
                <ReviewItemRow
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  placeholder={item.placeholder}
                  onChange={item.onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
