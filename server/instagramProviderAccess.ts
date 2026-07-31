export function isOpenAIInstagramEnabled(
  value = process.env.OPENAI_INSTAGRAM_ENABLED,
) {
  return value?.trim().toLowerCase() === "true";
}

export function assertInstagramProviderEnabled(
  provider: "anthropic" | "openai",
  openAIEnabled = process.env.OPENAI_INSTAGRAM_ENABLED,
) {
  if (provider === "openai" && !isOpenAIInstagramEnabled(openAIEnabled)) {
    throw new Error(
      "GPT比較版は現在停止中です。サーバー管理者が安全確認後に有効化してください。",
    );
  }
}

