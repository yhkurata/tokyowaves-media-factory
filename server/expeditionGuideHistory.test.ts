import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHistoryPayload, historyRequest } from './expeditionGuideHistoryHandler.js';
import { createEmptyExpeditionGuideInput } from '../src/types/expeditionGuide.js';
import { buildExpeditionGuideOutput } from '../src/lib/expeditionGuideTemplate.js';

test('履歴は入力日時と直接編集した文章を保持する', () => {
  const input = { ...createEmptyExpeditionGuideInput(), schedule: '2026年7月23日', meeting: '立川駅 7時', practiceTime: '9時〜12時' };
  const output = { ...buildExpeditionGuideOutput(input), line: '手作業で編集した文章' };
  const snapshot = JSON.parse(JSON.stringify({ input, output }));
  assert.equal(isHistoryPayload(snapshot), true);
  assert.deepEqual(snapshot.input, input);
  assert.equal(snapshot.output.line, output.line);
});
test('不正な履歴を保存しない', async () => {
  for (const value of [null, {}, { input: {}, output: {} }]) assert.equal(isHistoryPayload(value), false);
  assert.equal((await historyRequest('POST', undefined, {})).status, 400);
  const input = createEmptyExpeditionGuideInput();
  assert.equal((await historyRequest('PATCH', undefined, { input, output: buildExpeditionGuideOutput(input) })).status, 400);
  assert.equal((await historyRequest('DELETE', undefined, undefined)).status, 405);
});
