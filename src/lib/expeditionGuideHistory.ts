import type { ExpeditionGuideHistory, ExpeditionGuideHistoryPayload } from '../types/expeditionGuideHistory';

async function request<T>(method: string, payload?: ExpeditionGuideHistoryPayload, id?: string): Promise<T> {
  const res = await fetch(`/api/expedition-guide-history${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? '履歴の保存に失敗しました。');
  return body.result;
}
export const listGuideHistory = () => request<ExpeditionGuideHistory[]>('GET');
export const saveGuideHistory = (payload: ExpeditionGuideHistoryPayload, id?: string) => request<ExpeditionGuideHistory>(id ? 'PATCH' : 'POST', payload, id);
