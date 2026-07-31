import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ComparisonProvider = "anthropic" | "openai";
export type ComparisonRunStatus = "started" | "completed" | "failed";

export interface ComparisonRunRecord {
  runId: string;
  provider: ComparisonProvider;
  status: ComparisonRunStatus;
  startedAt: string;
  finishedAt?: string;
  resultPath?: string;
  error?: string;
}

function validateRunId(runId: string) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(runId)) {
    throw new Error(
      "runIdは英数字・ハイフン・アンダースコアのみ、80文字以内にしてください。",
    );
  }
}

function recordPath(
  directory: string,
  runId: string,
  provider: ComparisonProvider,
) {
  validateRunId(runId);
  return path.join(directory, `${runId}-${provider}.json`);
}

export async function reserveComparisonRun(
  directory: string,
  runId: string,
  provider: ComparisonProvider,
): Promise<ComparisonRunRecord> {
  await mkdir(directory, { recursive: true });
  const destination = recordPath(directory, runId, provider);
  const record: ComparisonRunRecord = {
    runId,
    provider,
    status: "started",
    startedAt: new Date().toISOString(),
  };

  let handle;
  try {
    // wx は既存ファイルを上書きしない。同じ実行IDでプロセスが再起動されても、
    // APIへ到達する前に必ず止めるための課金重複防止ロック。
    handle = await open(destination, "wx");
    await handle.writeFile(JSON.stringify(record, null, 2), "utf8");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "EEXIST") {
      throw new Error(
        `${provider}は実行ID「${runId}」ですでに開始済みです。安全のため再送しません。`,
      );
    }
    throw error;
  } finally {
    await handle?.close();
  }
  return record;
}

export async function finishComparisonRun(
  directory: string,
  record: ComparisonRunRecord,
  outcome:
    | { status: "completed"; resultPath: string }
    | { status: "failed"; error: string },
) {
  const destination = recordPath(directory, record.runId, record.provider);
  const current = JSON.parse(
    await readFile(destination, "utf8"),
  ) as ComparisonRunRecord;
  const completed: ComparisonRunRecord = {
    ...current,
    ...outcome,
    finishedAt: new Date().toISOString(),
  };
  await writeFile(destination, JSON.stringify(completed, null, 2), "utf8");
  return completed;
}

