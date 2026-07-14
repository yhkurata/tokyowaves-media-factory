import { useState, type ReactNode } from "react";

type Props = {
  label: string;
  needsReview: boolean;
  hasData: boolean;
  defaultOpen: boolean;
  children: ReactNode;
};

export function AccordionSection({
  label,
  needsReview,
  hasData,
  defaultOpen,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-md border border-gray-300 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{label}</span>
          {needsReview && (
            <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800">
              ⚠️ 要確認
            </span>
          )}
          {!hasData && (
            <span className="text-xs text-gray-400">未入力</span>
          )}
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="border-t border-gray-200 p-4">{children}</div>}
    </section>
  );
}
