import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  estimateOpenAIInstagramPropose,
  runOpenAIInstagramPropose,
} from "./openaiInstagramPropose.js";
import { calculateOpenAIUsageCost } from "./openaiPricing.js";

const proposal = {
  candidates: [
    { plan: { title: "案1" } },
    { plan: { title: "案2" } },
    { plan: { title: "案3" } },
  ],
  recommendedCandidateIndex: 0,
  recommendationReasoning: "理由",
  operationalSuggestions: [],
  openQuestions: [],
};

const receivedBodies: unknown[] = [];
const originalFetch = globalThis.fetch;

before(() => {
  globalThis.fetch = async (input, init) => {
    receivedBodies.push(JSON.parse(String(init?.body)));
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.endsWith("/responses/input_tokens")) {
      return Response.json({
        object: "response.input_tokens",
        input_tokens: 1234,
      });
    }
    if (url.endsWith("/responses")) {
      return Response.json({
        id: "resp_test",
        object: "response",
        created_at: 0,
        status: "completed",
        model: "gpt-5.6-terra",
        output: [
          {
            id: "msg_test",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(proposal),
                annotations: [],
              },
            ],
          },
        ],
        usage: {
          input_tokens: 1000,
          input_tokens_details: {
            cache_write_tokens: 100,
            cached_tokens: 200,
          },
          output_tokens: 500,
          output_tokens_details: { reasoning_tokens: 50 },
          total_tokens: 1500,
        },
      });
    }
    return new Response(null, { status: 404 });
  };
  process.env.OPENAI_INSTAGRAM_MODEL = "gpt-5.6-terra";
});

after(() => {
  delete process.env.OPENAI_INSTAGRAM_MODEL;
  globalThis.fetch = originalFetch;
});

test("GPT見積もりはResponses input_tokensを使い、料金を返す", async () => {
  const result = await estimateOpenAIInstagramPropose(
    "test-key",
    { systemPrompt: "system", userMessage: "user" },
    2000,
  );
  assert.equal(result.estimatedInputTokens, 1234);
  assert.equal(result.estimatedOutputTokens, 2000);
  assert.equal(result.costJpy, 4.96275);
});

test("GPT実行はStructured Outputsを要求し、同じ提案形式を返す", async () => {
  const result = await runOpenAIInstagramPropose("test-key", {
    systemPrompt: "system",
    userMessage: "user",
  });
  assert.equal(result.model, "gpt-5.6-terra");
  assert.equal(result.result.candidates.length, 3);
  assert.equal(result.cost.inputTokens, 1000);
  assert.equal(result.cost.outputTokens, 500);

  const runBody = receivedBodies.at(-1) as {
    instructions: string;
    input: string;
    reasoning: { effort: string };
    text: { format: { type: string; strict: boolean } };
    store: boolean;
  };
  assert.equal(runBody.instructions, "system");
  assert.equal(runBody.input, "user");
  assert.equal(runBody.reasoning.effort, "medium");
  assert.equal(runBody.text.format.type, "json_schema");
  assert.equal(runBody.text.format.strict, true);
  assert.equal(runBody.store, false);
});

test("OpenAI usageの通常・書込・読取キャッシュ料金を分けて計算する", () => {
  const result = calculateOpenAIUsageCost("gpt-5.6-terra", {
    input_tokens: 1000,
    input_tokens_details: {
      cache_write_tokens: 100,
      cached_tokens: 200,
    },
    output_tokens: 500,
    output_tokens_details: { reasoning_tokens: 50 },
    total_tokens: 1500,
  });
  assert.equal(result.costUsd, 0.0096125);
  assert.equal(result.costJpy, 1.441875);
});
