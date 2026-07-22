import type { useExpeditionGuideData } from "../../state/useExpeditionGuideData";
import type { ExpeditionGuideEnhanceMode } from "../../types/expeditionGuide";
import { enhanceExpeditionGuide } from "../../lib/expeditionGuideApi";
import { StepHeader } from "../sticker/StepHeader";
import { ExpeditionGuideForm } from "./ExpeditionGuideForm";
import { ExpeditionGuideOutputPanel } from "./ExpeditionGuideOutputPanel";

type Props = {
  data: ReturnType<typeof useExpeditionGuideData>;
};

export function ExpeditionGuideScreen({ data }: Props) {
  const handleEnhance = async (mode: ExpeditionGuideEnhanceMode) => {
    if (!data.output) return;
    const next = await enhanceExpeditionGuide(data.input, data.output, mode);
    data.setOutput(next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <StepHeader
          step={1}
          title="遠征情報を入力する"
          description="基本項目（大会名・日程・集合場所・集合時間・会場）以外は空欄でもOKです。"
        />
        <div className="mt-3">
          <ExpeditionGuideForm
            input={data.input}
            onUpdateField={data.updateField}
            onGenerate={data.generate}
          />
        </div>
      </div>

      {data.output && (
        <div>
          <StepHeader
            step={2}
            title="出力"
            description="LINE・メール・印刷用（A4）を確認・コピーできます。必要ならAIで内容を強化できます。"
          />
          <div className="mt-3">
            <ExpeditionGuideOutputPanel
              output={data.output}
              onEnhance={handleEnhance}
            />
          </div>
        </div>
      )}
    </div>
  );
}
