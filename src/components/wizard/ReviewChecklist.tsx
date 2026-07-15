import { forwardRef, useImperativeHandle } from "react";
import type { ReviewGroup } from "../../lib/reviewItems";
import {
  useReviewChecklist,
  type ReviewItemStatus,
} from "../../lib/useReviewChecklist";

type Props = {
  groups: ReviewGroup[];
};

export type ReviewChecklistHandle = {
  save: () => void;
};

const STATUS_STYLES: Record<ReviewItemStatus, { field: string; badge: string; label: string }> = {
  empty: {
    field: "border-yellow-400 bg-yellow-50 focus:bg-white",
    badge: "bg-yellow-100 text-yellow-800",
    label: "未入力",
  },
  unsaved: {
    field: "border-blue-400 bg-blue-50 focus:bg-white",
    badge: "bg-blue-100 text-blue-700",
    label: "未保存",
  },
  filled: {
    field: "border-gray-300 bg-white",
    badge: "bg-green-100 text-green-700",
    label: "入力済み",
  },
};

// Enterでは確定せず、次の入力欄へフォーカスを移すだけにする。
// 日本語入力の変換確定Enter（isComposing中）は無視しないと、変換のたびに
// 次の欄へ飛んでしまうので注意。
function focusNextField(current: HTMLElement) {
  const container = current.closest("[data-review-list]");
  if (!container) return;
  const fields = Array.from(
    container.querySelectorAll<HTMLElement>("[data-review-field]"),
  );
  const index = fields.indexOf(current);
  if (index >= 0 && index < fields.length - 1) {
    fields[index + 1].focus();
  }
}

function ReviewItemRow({
  label,
  value,
  placeholder,
  status,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  status: ReviewItemStatus;
  onChange: (value: string) => void;
}) {
  const style = STATUS_STYLES[status];
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-44 shrink-0 truncate text-sm font-semibold text-gray-800">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        data-review-field
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            focusNextField(e.currentTarget);
          }
        }}
        className={`min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${style.field}`}
      />
      <span
        className={`w-16 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold ${style.badge}`}
      >
        {style.label}
      </span>
    </div>
  );
}

export const ReviewChecklist = forwardRef<ReviewChecklistHandle, Props>(
  function ReviewChecklist({ groups: allGroups }, ref) {
    const { groups, pendingCount, hasUnsaved, setDraft, save } =
      useReviewChecklist(allGroups);

    useImperativeHandle(ref, () => ({ save }), [save]);

    const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-lg border-b border-yellow-200 bg-yellow-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-yellow-800">
              ⚠️ 要確認：{pendingCount > 0 ? `未入力${pendingCount}件・` : ""}
              合計{totalCount}件
            </p>
            <p className="mt-0.5 text-xs text-yellow-700">
              AIが読み取れなかった項目と、その後入力・修正した項目を表示しています。いつでも直せます。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasUnsaved && (
              <span className="text-xs font-semibold text-blue-700">
                未保存の変更があります
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={!hasUnsaved}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              保存
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100 px-4" data-review-list>
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
                    value={item.displayValue}
                    placeholder={item.placeholder}
                    status={item.status}
                    onChange={(v) => setDraft(item.id, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  },
);
