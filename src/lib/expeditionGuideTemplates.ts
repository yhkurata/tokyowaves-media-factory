import type { ExpeditionGuideInput } from "../types/expeditionGuide";
import type { ExpeditionGuideTemplate } from "../types/expeditionGuideTemplate";

// 遠征要項AIの「まるごとテンプレート」機能。以前はブラウザのlocalStorageのみに
// 保存していたため、監督が自分の端末で保存しても他のメンバーの画面には
// 反映されない問題があった。チーム全員で積み上げていく共有データにするため、
// 他機能と同じNeon DBに保存する（server/expeditionGuideTemplateHandler.ts、
// API: /api/expedition-guide-templates）。

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `リクエストに失敗しました（${res.status}）。`);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.result as T;
}

export function loadExpeditionGuideTemplates(): Promise<
  ExpeditionGuideTemplate[]
> {
  return fetch("/api/expedition-guide-templates").then((res) =>
    handleResponse(res),
  );
}

// 同名のテンプレートが既にあれば上書き保存する。
export function saveExpeditionGuideTemplate(
  name: string,
  input: ExpeditionGuideInput,
): Promise<ExpeditionGuideTemplate> {
  return fetch("/api/expedition-guide-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), input }),
  }).then((res) => handleResponse(res));
}

export function updateExpeditionGuideTemplate(
  id: string,
  input: ExpeditionGuideInput,
): Promise<ExpeditionGuideTemplate> {
  return fetch(`/api/expedition-guide-templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  }).then((res) => handleResponse(res));
}

export function deleteExpeditionGuideTemplate(id: string): Promise<void> {
  return fetch(`/api/expedition-guide-templates/${id}`, {
    method: "DELETE",
  }).then((res) => handleResponse(res));
}
