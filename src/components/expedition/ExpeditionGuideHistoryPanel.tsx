import type { ExpeditionGuideHistory } from '../../types/expeditionGuideHistory';

export function ExpeditionGuideHistoryPanel({ rows, loading, onRefresh, onOpen, onQuote }: {
  rows: ExpeditionGuideHistory[]; loading: boolean; onRefresh: () => void;
  onOpen: (row: ExpeditionGuideHistory) => void; onQuote: (row: ExpeditionGuideHistory) => void;
}) {
  return <section className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex items-center justify-between"><h2 className="font-semibold">共有の作成履歴</h2><button type="button" disabled={loading} onClick={onRefresh} className="text-sm text-blue-600">{loading ? '読み込み中…' : '再読み込み'}</button></div>
    <p className="text-xs text-gray-500">最新200件。引用は日時も含めてすべて引き継ぎ、元の履歴は変更しません。</p>
    {!loading && !rows.length && <p className="text-sm text-gray-500">まだ履歴がありません。</p>}
    <div className="max-h-96 overflow-y-auto space-y-2">{rows.map(row => <div key={row.id} className="rounded border border-gray-200 p-3">
      <p className="break-words font-medium">{row.input.tournamentName || 'タイトル未記入'}</p>
      <p className="text-xs text-gray-500 whitespace-pre-wrap">{row.input.schedule || '期日未記入'} · 作成 {new Date(row.createdAt).toLocaleString('ja-JP')} · 更新 {new Date(row.updatedAt).toLocaleString('ja-JP')}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-blue-600"><button type="button" onClick={() => onOpen(row)}>確認・編集</button><button type="button" onClick={() => onQuote(row)}>引用して新規作成</button></div>
    </div>)}</div>
  </section>;
}
