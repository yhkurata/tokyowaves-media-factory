import type {
  ExpeditionGuideEnhanceMode,
  ExpeditionGuideOutput,
} from "../../types/expeditionGuide";
import { CopyableBlock } from "../sticker/CopyableBlock";
import { PrintDocumentTemplate } from "../print/PrintDocumentTemplate";
import { ExpeditionGuideEnhancePanel } from "./ExpeditionGuideEnhancePanel";

type Props = {
  output: ExpeditionGuideOutput;
  onEnhance: (mode: ExpeditionGuideEnhanceMode) => Promise<void>;
};

export function ExpeditionGuideOutputPanel({ output, onEnhance }: Props) {
  return (
    <div className="space-y-6">
      <ExpeditionGuideEnhancePanel onEnhance={onEnhance} />

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <CopyableBlock label="① LINE用文章" text={output.line} />
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <CopyableBlock label="② メール用文章" text={output.email} />
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
