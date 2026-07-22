import type { useExpeditionGuideData } from "../../state/useExpeditionGuideData";
import type { ExpeditionGuideOutput } from "../../types/expeditionGuide";
import { isAdminMode } from "../../lib/adminMode";
import { StepHeader } from "../sticker/StepHeader";
import { ExpeditionGuideForm } from "./ExpeditionGuideForm";
import { ExpeditionGuideOutputPanel } from "./ExpeditionGuideOutputPanel";

type Props = {
  data: ReturnType<typeof useExpeditionGuideData>;
};

export function ExpeditionGuideScreen({ data }: Props) {
  const isAdmin = isAdminMode();

  const handleApplyEnhance = (patch: Partial<ExpeditionGuideOutput>) => {
    if (!data.output) return;
    data.setOutput({ ...data.output, ...patch });
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
            onLoadTemplate={data.loadTemplate}
            onGenerate={data.generate}
          />
        </div>
      </div>

      {data.output && (
        <div>
          <StepHeader
            step={2}
            title="出力"
            description={
              isAdmin
                ? "LINE・メール・印刷用（A4）を確認・コピーできます。管理者用のAI強化パネルも使えます。"
                : "LINE・メール・印刷用（A4）を確認・コピーできます。"
            }
          />
          <div className="mt-3">
            <ExpeditionGuideOutputPanel
              fields={data.input}
              output={data.output}
              isAdmin={isAdmin}
              onApplyEnhance={handleApplyEnhance}
            />
          </div>
        </div>
      )}
    </div>
  );
}
