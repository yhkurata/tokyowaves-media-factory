import type { useExpeditionGuideData } from "../../state/useExpeditionGuideData";
import type { ExpeditionGuideOutput } from "../../types/expeditionGuide";
import { isAdminMode } from "../../lib/adminMode";
import { StepHeader } from "../sticker/StepHeader";
import { ExpeditionGuideForm } from "./ExpeditionGuideForm";
import { ExpeditionGuideOutputPanel } from "./ExpeditionGuideOutputPanel";
import { useEffect, useState } from 'react';
import { listGuideHistory, saveGuideHistory } from '../../lib/expeditionGuideHistory';
import type { ExpeditionGuideHistory } from '../../types/expeditionGuideHistory';
import { ExpeditionGuideHistoryPanel } from './ExpeditionGuideHistoryPanel';

type Props = {
  data: ReturnType<typeof useExpeditionGuideData>;
};

export function ExpeditionGuideScreen({ data }: Props) {
  const isAdmin = isAdminMode();
  const [rows, setRows] = useState<ExpeditionGuideHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string>();
  const [message, setMessage] = useState('');
  const refresh = async () => {
    setLoading(true);
    try { setRows(await listGuideHistory()); }
    catch (err) { setMessage(err instanceof Error ? err.message : '履歴を取得できません。'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const persist = async (output: ExpeditionGuideOutput, id?: string) => {
    setSaving(true);
    try {
      const saved = await saveGuideHistory({ input: data.input, output }, id);
      setActiveId(saved.id);
      setRows(prev => [saved, ...prev.filter(row => row.id !== saved.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200));
      setMessage('共有履歴に保存しました。');
    } catch (err) { setMessage(err instanceof Error ? err.message : '保存に失敗しました。文章は画面に残っています。'); }
    finally { setSaving(false); }
  };
  const loadHistory = (row: ExpeditionGuideHistory, quote: boolean) => {
    if (saving) return;
    if (!window.confirm('現在の入力・文章を選んだ履歴に置き換えてよろしいですか？ 未保存の編集は失われます。')) return;
    data.loadTemplate(row.input);
    data.setOutput(row.output);
    setActiveId(quote ? undefined : row.id);
    setMessage(quote ? '引用しました。編集後に「新しい履歴として保存」を押してください。' : '履歴を開きました。編集後に「履歴を更新」を押してください。');
  };

  const handleApplyEnhance = (patch: Partial<ExpeditionGuideOutput>) => {
    if (!data.output) return;
    data.setOutput({ ...data.output, ...patch });
  };

  const handleEditField = (field: "line" | "email", value: string) => {
    if (!data.output) return;
    data.setOutput({ ...data.output, [field]: value });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <ExpeditionGuideHistoryPanel rows={rows} loading={loading} onRefresh={() => void refresh()} onOpen={row => loadHistory(row, false)} onQuote={row => loadHistory(row, true)} />
      {message && <p role="status" className="text-sm text-blue-700">{message}</p>}
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
            onLoadTemplate={input => { if (saving) return; data.loadTemplate(input); data.setOutput(null); setActiveId(undefined); }}
            onGenerate={() => { if (saving) return; setActiveId(undefined); void persist(data.generate()); }}
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
            <button type="button" disabled={saving} className="mb-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => {
              if (!data.output) return;
              if (activeId && !window.confirm('共有履歴を現在の入力・文章で更新してよろしいですか？')) return;
              void persist(data.output, activeId);
            }}>{saving ? '履歴を保存中…' : activeId ? '履歴を更新' : '新しい履歴として保存'}</button>
            <ExpeditionGuideOutputPanel
              fields={data.input}
              output={data.output}
              isAdmin={isAdmin}
              onApplyEnhance={handleApplyEnhance}
              onEditField={handleEditField}
            />
          </div>
        </div>
      )}
    </div>
  );
}
