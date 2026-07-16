import Anthropic from "@anthropic-ai/sdk";

// Anthropic SDKのエラーは、生のJSONレスポンス本文がそのまま .message に
// 入ってくるため（例：'400 {"type":"error","error":{"type":"invalid_request_error",
// "message":"Your credit balance is too low..."}}'）、そのまま画面に出すと
// ユーザーには意味が伝わらない。よくあるケースだけ分かりやすい日本語に変換する。
export function friendlyAnthropicErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 400 && /credit balance is too low/i.test(err.message)) {
      return "Anthropic APIのクレジット残高が不足しています。console.anthropic.com の「Plans & Billing」からクレジットを追加してください（このアプリのコードの問題ではありません）。";
    }
    if (err.status === 401) {
      return "Anthropic APIキーが無効です。環境変数 ANTHROPIC_API_KEY を確認してください。";
    }
    if (err.status === 429) {
      return "Anthropic APIのリクエスト数上限に達しました。しばらく待ってから再度お試しください。";
    }
    if (err.status === 529) {
      return "Anthropic APIが混雑しています。しばらく待ってから再度お試しください。";
    }
  }
  return err instanceof Error
    ? `処理中にエラーが発生しました: ${err.message}`
    : "処理中に不明なエラーが発生しました。";
}
