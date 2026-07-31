import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPostHistorySummaryText,
  buildProposalSystemPrompt,
  buildProposalUserMessage,
} from "./instagramProposalPrompt.js";
import { runOpenAIInstagramPropose } from "./openaiInstagramPropose.js";
import {
  finishComparisonRun,
  reserveComparisonRun,
} from "./providerComparisonGuard.js";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(
  workspaceRoot,
  ".local",
  "provider-comparisons",
);

const operatingGuide = `
# TokyoWAVES Instagram運用ガイド（比較テスト用）
TokyoWAVESは、小学生・中学生の男女を対象とする水球クラブ。
主な読者は、水球に興味を持つ子どもとその保護者。
競技の迫力だけでなく、初めてでも参加しやすい安心感、仲間と成長する楽しさを伝える。
言葉は明るく誠実にし、過度に煽らない。分からない日時、会場、料金、実績は創作しない。
チームカラーは紺と白。選手を描写するときは小中学生年代で、男女双方を自然に含める。
`;

const instruction = `
次のInstagram投稿を考えてください。
今回の目的は、TokyoWAVESの体験参加に興味を持つ小中学生と保護者へ、最初の一歩を後押しすることです。
3案のうち少なくとも1案はリール、少なくとも1案はストーリーズにしてください。
初心者歓迎の安心感と、水球ならではの楽しさの両方を具体的に伝えてください。
日付、会場、料金、人数、過去の実績など、与えられていない事実は創作しないでください。
不明情報は openQuestions にまとめてください。
`;

function argumentValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(
    prefix.length,
  );
}

function resultFilePath(runId: string) {
  return path.join(outputDirectory, `${runId}-openai-result.json`);
}

async function main() {
  const runId = argumentValue("run-id");
  const execute = process.argv.includes("--execute");

  if (!runId) {
    throw new Error("--run-id=<固有ID> が必要です。");
  }
  if (!execute) {
    console.log(
      "DRY RUN: APIは呼びません。実行する場合だけ --execute を追加してください。",
    );
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEYが設定されていません。");
  }

  const record = await reserveComparisonRun(
    outputDirectory,
    runId,
    "openai",
  );
  console.log(`GPT比較を開始しました: runId=${runId}`);

  const systemPrompt = buildProposalSystemPrompt(operatingGuide);
  const userMessage = buildProposalUserMessage(
    instruction,
    buildPostHistorySummaryText([]),
  );
  const started = performance.now();

  try {
    const generated = await runOpenAIInstagramPropose(
      process.env.OPENAI_API_KEY,
      { systemPrompt, userMessage },
    );
    const elapsedMs = performance.now() - started;
    const destination = resultFilePath(runId);
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(
      destination,
      JSON.stringify(
        {
          runId,
          provider: "openai",
          model: generated.model,
          elapsedMs,
          testData: { operatingGuide, instruction, history: [] },
          cost: generated.cost,
          result: generated.result,
        },
        null,
        2,
      ),
      "utf8",
    );
    await finishComparisonRun(outputDirectory, record, {
      status: "completed",
      resultPath: destination,
    });
    console.log(
      JSON.stringify({
        status: "completed",
        runId,
        model: generated.model,
        elapsedMs,
        inputTokens: generated.cost.inputTokens,
        outputTokens: generated.cost.outputTokens,
        costJpy: generated.cost.costJpy,
        candidateCount: generated.result.candidates.length,
        resultPath: destination,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishComparisonRun(outputDirectory, record, {
      status: "failed",
      error: message,
    });
    throw error;
  }
}

await main();
