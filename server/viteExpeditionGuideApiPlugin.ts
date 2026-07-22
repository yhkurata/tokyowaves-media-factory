import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  runExpeditionGuideEnhance,
  type ExpeditionGuideEnhanceRequestBody,
} from "./expeditionGuideEnhanceHandler.js";

const MAX_BODY_BYTES = 1 * 1024 * 1024; // 画像添付がなく短いテキストのみのため小さめで十分
const ENHANCE_MODES = [
  "improve",
  "suggest-notes",
  "beginner-supplement",
  "parent-tone",
];

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error("リクエストのサイズが大きすぎます。"));
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

function isPrintSection(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.heading === "string" && typeof v.body === "string";
}

function isGuideDocResult(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.lineText === "string" &&
    typeof v.emailText === "string" &&
    typeof v.printTitle === "string" &&
    typeof v.printDateLabel === "string" &&
    Array.isArray(v.printSections) &&
    v.printSections.every(isPrintSection)
  );
}

export function isExpeditionGuideEnhanceRequestBody(
  value: unknown,
): value is ExpeditionGuideEnhanceRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.fields === "object" &&
    v.fields !== null &&
    isGuideDocResult(v.currentOutput) &&
    typeof v.mode === "string" &&
    ENHANCE_MODES.includes(v.mode)
  );
}

export function expeditionGuideApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: "tokyowaves-expedition-guide-api",
    configureServer(server) {
      server.middlewares.use(
        "/api/expedition-guide-enhance",
        (req, res, next) => {
          if (req.method !== "POST") {
            next();
            return;
          }
          void handleExpeditionGuideEnhanceRequest(req, res, apiKey);
        },
      );
    },
  };
}

async function handleExpeditionGuideEnhanceRequest(
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
    if (!isExpeditionGuideEnhanceRequestBody(body)) {
      sendJson(res, 400, { error: "リクエストの形式が不正です。" });
      return;
    }
    const result = await runExpeditionGuideEnhance(apiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "不明なエラーが発生しました。",
    });
  }
}
