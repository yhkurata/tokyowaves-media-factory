import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { runExtraction, type ExtractRequestBody } from "./extractHandler.js";

const MAX_BODY_BYTES = 150 * 1024 * 1024; // 150MB（base64込み・最大8ファイル添付を考慮）

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error("添付ファイルの合計サイズが大きすぎます。"));
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

function isExtractRequestFile(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mediaType === "image/png" ||
      v.mediaType === "image/jpeg" ||
      v.mediaType === "application/pdf") &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

function isExtractRequestBody(value: unknown): value is ExtractRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.files) && v.files.length > 0 && v.files.every(isExtractRequestFile);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function extractApiPlugin(apiKey: string | undefined): Plugin {
  return {
    name: "tokyowaves-extract-api",
    configureServer(server) {
      server.middlewares.use("/api/extract", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }
        handleExtractRequest(req, res, apiKey);
      });
    },
  };
}

async function handleExtractRequest(
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
    if (!isExtractRequestBody(body)) {
      sendJson(res, 400, {
        error: "リクエストの形式が不正です（filesが1件以上必要です）。",
      });
      return;
    }
    const result = await runExtraction(apiKey, body);
    sendJson(res, 200, { result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "解析中に不明なエラーが発生しました。";
    sendJson(res, 500, { error: message });
  }
}
