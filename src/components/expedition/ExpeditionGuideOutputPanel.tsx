import { useState } from "react";
import type {
  ExpeditionGuideInput,
  ExpeditionGuideOutput,
} from "../../types/expeditionGuide";
import { PrintDocumentTemplate } from "../print/PrintDocumentTemplate";
import { ExpeditionGuideEnhancePanel } from "./ExpeditionGuideEnhancePanel";

type Props = {
  fields: ExpeditionGuideInput;
  output: ExpeditionGuideOutput;
  isAdmin: boolean;
  onApplyEnhance: (patch: Partial<ExpeditionGuideOutput>) => void;
  onEditField: (field: "line" | "email", value: string) => void;
};

// LINE用・メール用は「作成→コピーして貼るだけ」ではなく、送る直前にひと言だけ
// 手直ししたいことが多いため、テキストをその場で直接編集できるようにしている
// （去年の文面をコピペして手で編集していた感覚に近い形にするため）。
function EditableTextBlock({
  label,
  text,
  onChange,
}: {
  label: string;
  text: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
      />
    </div>
  );
}

export function ExpeditionGuideOutputPanel({
  fields,
  output,
  isAdmin,
  onApplyEnhance,
  onEditField,
}: Props) {
  return (
    <div className="space-y-6">
      {isAdmin && (
        <ExpeditionGuideEnhancePanel
          fields={fields}
          currentOutput={output}
          onApply={onApplyEnhance}
        />
      )}

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <EditableTextBlock
          label="① LINE用文章"
          text={output.line}
          onChange={(value) => onEditField("line", value)}
        />
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <EditableTextBlock
          label="② メール用文章"
          text={output.email}
          onChange={(value) => onEditField("email", value)}
        />
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">
            ③ 印刷用（A4）
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            印刷する
          </button>
        </div>
        <div className="overflow-x-auto rounded-md bg-gray-100 p-6">
          <PrintDocumentTemplate
            title={output.printTitle}
            dateLabel={output.printDateLabel}
            sections={output.printSections}
          />
        </div>
      </div>
    </div>
  );
}
