import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  finishComparisonRun,
  reserveComparisonRun,
} from "./providerComparisonGuard.js";

test("同じ実行ID・同じ提供元はAPI送信前に2回目を拒否する", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "provider-comparison-"),
  );

  await reserveComparisonRun(directory, "trial-001", "openai");

  await assert.rejects(
    reserveComparisonRun(directory, "trial-001", "openai"),
    /すでに開始済み/,
  );
});

test("同じ実行IDでもClaudeとGPTは1回ずつ予約できる", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "provider-comparison-"),
  );

  const claude = await reserveComparisonRun(
    directory,
    "trial-002",
    "anthropic",
  );
  const gpt = await reserveComparisonRun(directory, "trial-002", "openai");

  assert.equal(claude.provider, "anthropic");
  assert.equal(gpt.provider, "openai");
});

test("失敗した実行も記録を残し、同じIDでは再送しない", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "provider-comparison-"),
  );
  const record = await reserveComparisonRun(
    directory,
    "trial-003",
    "anthropic",
  );

  await finishComparisonRun(directory, record, {
    status: "failed",
    error: "timeout",
  });

  const saved = JSON.parse(
    await readFile(
      path.join(directory, "trial-003-anthropic.json"),
      "utf8",
    ),
  ) as { status: string; error: string };
  assert.equal(saved.status, "failed");
  assert.equal(saved.error, "timeout");
  await assert.rejects(
    reserveComparisonRun(directory, "trial-003", "anthropic"),
    /すでに開始済み/,
  );
});
