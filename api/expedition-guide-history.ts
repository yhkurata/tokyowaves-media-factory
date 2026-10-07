import type { VercelRequest, VercelResponse } from '@vercel/node';
import { historyRequest } from '../server/expeditionGuideHistoryHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const result = await historyRequest(req.method ?? '', req.query.id, req.body);
    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({ error: '共有履歴に接続できません。入力と文章は画面に残っています。時間をおいて再試行してください。' });
  }
}
