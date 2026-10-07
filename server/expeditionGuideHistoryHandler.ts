import { desc, eq } from 'drizzle-orm';
import { getDb } from './db/client.js';
import { expeditionGuideHistory } from './db/schema.js';
import { createEmptyExpeditionGuideInput } from '../src/types/expeditionGuide.js';
import type { ExpeditionGuideHistoryPayload } from '../src/types/expeditionGuideHistory.js';

export function isHistoryPayload(value: unknown): value is ExpeditionGuideHistoryPayload {
  if (!value || typeof value !== 'object') return false;
  const { input, output } = value as Record<string, unknown>;
  if (!input || typeof input !== 'object' || !output || typeof output !== 'object') return false;
  const i = input as Record<string, unknown>;
  const o = output as Record<string, unknown>;
  return Object.keys(createEmptyExpeditionGuideInput()).every(k => typeof i[k] === 'string' && (i[k] as string).length <= 50000)
    && ['line', 'email', 'printTitle', 'printDateLabel'].every(k => typeof o[k] === 'string' && (o[k] as string).length <= 100000)
    && Array.isArray(o.printSections) && o.printSections.length <= 100
    && o.printSections.every(s => s && typeof s === 'object' && typeof s.heading === 'string' && typeof s.body === 'string' && s.body.length <= 100000);
}

// Generation stays local; these operations only persist complete, editable snapshots.
export async function historyRequest(method: string, id: unknown, body: unknown) {
  if (method === 'GET') {
    const result = await getDb().select().from(expeditionGuideHistory).orderBy(desc(expeditionGuideHistory.createdAt)).limit(200);
    return { status: 200, body: { result } };
  }
  if (method !== 'POST' && method !== 'PATCH') return { status: 405, body: { error: 'GET・POST・PATCHのみ対応しています。' } };
  if (!isHistoryPayload(body)) return { status: 400, body: { error: '履歴の形式が不正です。' } };
  if (method === 'PATCH' && (typeof id !== 'string' || !id)) return { status: 400, body: { error: '履歴IDが必要です。' } };
  const values = { input: body.input, output: body.output, updatedAt: new Date() };
  const [result] = method === 'POST'
    ? await getDb().insert(expeditionGuideHistory).values({ ...values, id: crypto.randomUUID() }).returning()
    : await getDb().update(expeditionGuideHistory).set(values).where(eq(expeditionGuideHistory.id, id as string)).returning();
  return result ? { status: method === 'POST' ? 201 : 200, body: { result } } : { status: 404, body: { error: '履歴が見つかりません。' } };
}
