import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertInstagramProviderEnabled,
  isOpenAIInstagramEnabled,
} from "./instagramProviderAccess.js";

test("GPTは明示的にtrueを設定した場合だけ有効になる", () => {
  assert.equal(isOpenAIInstagramEnabled(undefined), false);
  assert.equal(isOpenAIInstagramEnabled("false"), false);
  assert.equal(isOpenAIInstagramEnabled("TRUE"), true);
});

test("GPT停止中でもClaudeは利用できる", () => {
  assert.doesNotThrow(() =>
    assertInstagramProviderEnabled("anthropic", undefined),
  );
  assert.throws(
    () => assertInstagramProviderEnabled("openai", undefined),
    /現在停止中/,
  );
});

