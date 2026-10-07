import type { Plugin } from 'vite';
import { historyRequest } from './expeditionGuideHistoryHandler.js';

export function expeditionGuideHistoryApiPlugin(): Plugin {
  return { name: 'expedition-guide-history', configureServer(server) {
    server.middlewares.use('/api/expedition-guide-history', (req, res) => {
      void (async () => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        try {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk.toString();
            if (Buffer.byteLength(raw) > 1024 * 1024) { res.statusCode = 413; res.end(JSON.stringify({ error: '履歴が大きすぎます。' })); return; }
          }
          const id = new URL(req.url ?? '/', 'http://localhost').searchParams.get('id');
          const result = await historyRequest(req.method ?? '', id, raw ? JSON.parse(raw) : undefined);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.body));
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: '共有履歴に接続できません。時間をおいて再試行してください。' }));
        }
      })();
    });
  } };
}
