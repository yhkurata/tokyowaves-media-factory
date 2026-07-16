import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  runStickerRecognize,
  type StickerRecognizeRequestBody,
} from "./stickerRecognizeHandler.js";
import {
  runStickerPlan,
  type StickerPlanRequestBody,
} from "./stickerPlanHandler.js";
import {
  runStickerCharacterAnalysis,
  type StickerCharacterAnalysisRequestBody,
} from "./stickerCharacterAnalysisHandler.js";

const MAX_BODY_BYTES = 150 * 1024 * 1024; // 150MB（base64画像込みを考慮）

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error("添付画像の合計サイズが大きすぎます。"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch {
        reject(new Error("リクエストの形式が不正です。"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function isStickerImage(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mediaType === "image/png" || v.mediaType === "image/jpeg") &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

function isStickerRecognizeRequestBody(
  value: unknown,
): value is StickerRecognizeRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.images) && v.images.length > 0 && v.images.every(isStickerImage)
  );
}

function isStickerPlanRequestBody(
  value: unknown,
): value is StickerPlanRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.instruction === "string" &&
    v.instruction.trim() !== "" &&
    typeof v.requestedCount === "number" &&
    typeof v.characterSettings === "object" &&
    v.characterSettings !== null &&
    Array.isArray(v.referenceImages) &&
    v.referenceImages.every(isStickerImage) &&
    Array.isArray(v.existingCandidates)
  );
}

function isStickerCharacterAnalysisRequestBody(
  value: unknown,
): value is StickerCharacterAnalysisRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.images) && v.images.length > 0 && v.images.every(isStickerImage)
  );
}

export function stickerApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: "tokyowaves-sticker-api",
    configureServer(server) {
      server.middlewares.use("/api/sticker-recognize", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        void handleStickerRecognize(req, res, apiKey);
      });
      server.middlewares.use("/api/sticker-plan", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        void handleStickerPlan(req, res, apiKey);
      });
      server.middlewares.use(
        "/api/sticker-character-analysis",
        (req, res, next) => {
          if (req.method !== "POST") {
            next();
            return;
          }
          void handleStickerCharacterAnalysis(req, res, apiKey);
        },
      );
    },
  };
}

async function handleStickerRecognize(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
) {
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "サーバーに ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。",
    });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!isStickerRecognizeRequestBody(body)) {
      sendJson(res, 400, { error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await runStickerRecognize(apiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}

async function handleStickerPlan(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
) {
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "サーバーに ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。",
    });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!isStickerPlanRequestBody(body)) {
      sendJson(res, 400, { error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await runStickerPlan(apiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}

async function handleStickerCharacterAnalysis(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
) {
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "サーバーに ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。",
    });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!isStickerCharacterAnalysisRequestBody(body)) {
      sendJson(res, 400, { error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await runStickerCharacterAnalysis(apiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}
