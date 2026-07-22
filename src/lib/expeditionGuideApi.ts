import type {
  ExpeditionGuideEnhanceMode,
  ExpeditionGuideInput,
  ExpeditionGuideOutput,
} from "../types/expeditionGuide";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `リクエストに失敗しました（${res.status}）。`);
  }
  const body = await res.json();
  return body.result as T;
}

interface GuideDocApiResult {
  lineText: string;
  emailText: string;
  printTitle: string;
  printDateLabel: string;
  printSections: { heading: string; body: string }[];
}

function toGuideDocApiResult(
  output: ExpeditionGuideOutput,
): GuideDocApiResult {
  return {
    lineText: output.line,
    emailText: output.email,
    printTitle: output.printTitle,
    printDateLabel: output.printDateLabel,
    printSections: output.printSections,
  };
}

function fromGuideDocApiResult(
  result: GuideDocApiResult,
): ExpeditionGuideOutput {
  return {
    line: result.lineText,
    email: result.emailText,
    printTitle: result.printTitle,
    printDateLabel: result.printDateLabel,
    printSections: result.printSections,
  };
}

// このAPIはClaude APIを呼び出すため、実行するたびに料金が発生する
// （基本の要項生成自体はテンプレートエンジンで完結し、このAPIは
// 「AIで強化する」ボタンを押したときだけ呼ばれる）。
export async function enhanceExpeditionGuide(
  fields: ExpeditionGuideInput,
  currentOutput: ExpeditionGuideOutput,
  mode: ExpeditionGuideEnhanceMode,
): Promise<ExpeditionGuideOutput> {
  const res = await fetch("/api/expedition-guide-enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields,
      currentOutput: toGuideDocApiResult(currentOutput),
      mode,
    }),
  });
  const result = await handleResponse<GuideDocApiResult>(res);
  return fromGuideDocApiResult(result);
}
