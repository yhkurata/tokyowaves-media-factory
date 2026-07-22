import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runExpeditionGuideEnhance } from "../server/expeditionGuideEnhanceHandler.js";
import { isExpeditionGuideEnhanceRequestBody } from "../server/viteExpeditionGuideApiPlugin.js";

// 本番デプロイ（Vercel）用のエントリーポイント。
// ローカル開発（npm run dev）では server/viteExpeditionGuideApiPlugin.ts が同じ
// /api/expedition-guide-enhance パスを提供するため、フロントエンド側は
// コード変更なしでどちらの環境でも動く。
// 基本の要項生成はテンプレートエンジン（クライアント側）で完結するため、
// このAPIは「AIで強化する」ボタンを押したときだけ呼ばれる。

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POSTメソッドのみ対応しています。" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "サーバーに ANTHROPIC_API_KEY が設定されていません。Vercelの環境変数を確認してください。",
    });
    return;
  }

  const body: unknown = req.body;
  if (!isExpeditionGuideEnhanceRequestBody(body)) {
    res.status(400).json({ error: "リクエストの形式が不正です。" });
    return;
  }

  try {
    const result = await runExpeditionGuideEnhance(apiKey, body);
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
