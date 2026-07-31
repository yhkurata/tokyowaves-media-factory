import assert from "node:assert/strict";
import { test } from "node:test";
import { instagramApiPathSegments } from "./instagramApiPath.js";

test("Vercelがqueryへcatch-allを渡す場合はその値を使う", () => {
  assert.deepEqual(
    instagramApiPathSegments(["post-history", "abc"], "/ignored"),
    ["post-history", "abc"],
  );
});

test("queryが空の場合はリクエストURLからcatch-allを復元する", () => {
  assert.deepEqual(
    instagramApiPathSegments(
      undefined,
      "/api/instagram/agent-proposals?foo=bar",
    ),
    ["agent-proposals"],
  );
});

