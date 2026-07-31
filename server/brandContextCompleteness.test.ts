import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeBrandContext,
  appendMissingFactsTemplate,
} from "../src/lib/brandContextCompleteness.js";

const currentGuide = `
TokyoWAVESは東京・多摩地区を中心に活動するジュニア水球クラブです。
対象は小学生・中学生、男女、初心者歓迎。クロールで25m泳げること。
体験会は毎週土曜日。ただし、開催しない土曜日もあります。
`;

test("現在のガイドから確定済みと不足情報を区別する", () => {
  const checks = analyzeBrandContext(currentGuide);
  const result = Object.fromEntries(
    checks.map((item) => [item.id, item.confirmed]),
  );

  assert.equal(result.eligibility, true);
  assert.equal(result.schedule, true);
  assert.equal(result.application, false);
  assert.equal(result.venue, false);
  assert.equal(result.fees, false);
  assert.equal(result.preparation, false);
});

test("不足項目だけの入力テンプレートを一度だけ追加する", () => {
  const updated = appendMissingFactsTemplate(currentGuide);

  assert.match(updated, /【確定済み運用情報】/);
  assert.match(updated, /体験申込み方法/);
  assert.match(updated, /会場名/);
  assert.match(updated, /体験料金/);
  assert.match(updated, /当日の持ち物/);
  assert.doesNotMatch(updated, /参加対象・条件：/);
  assert.equal(appendMissingFactsTemplate(updated), updated);
});
