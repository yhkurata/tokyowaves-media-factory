export interface CharacterSettingsInput {
  characterFeatures: string;
  face: string;
  hairStyle: string;
  hat: string;
  logo: string;
  colorScheme: string;
  artStyle: string;
  expressionNotes: string;
  boyGirlDifference: string;
  mustNotChange: string[];
  freeNotes: string;
}

interface ExistingCandidateSummary {
  phrase: string;
  scene: string;
}

function buildCharacterSettingsText(settings: CharacterSettingsInput): string {
  const lines = [
    `キャラクター特徴: ${settings.characterFeatures || "（未設定）"}`,
    `顔の特徴: ${settings.face || "（未設定）"}`,
    `髪型: ${settings.hairStyle || "（未設定）"}`,
    `帽子: ${settings.hat || "（未設定）"}`,
    `ロゴ: ${settings.logo || "（未設定）"}`,
    `配色: ${settings.colorScheme || "（未設定）"}`,
    `絵柄・作風: ${settings.artStyle || "（未設定）"}`,
    `表情の特徴: ${settings.expressionNotes || "（未設定）"}`,
    `男の子版・女の子版の違い: ${settings.boyGirlDifference || "（未設定）"}`,
    settings.mustNotChange.length > 0
      ? `変えてはいけない要素:\n${settings.mustNotChange.map((item) => `  - ${item}`).join("\n")}`
      : "変えてはいけない要素: （未設定）",
    settings.freeNotes ? `その他: ${settings.freeNotes}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function buildExistingCandidatesText(
  existing: ExistingCandidateSummary[],
): string {
  if (existing.length === 0) return "（まだ他に企画済みの案はありません）";
  return existing
    .map((c, i) => `${i + 1}. セリフ「${c.phrase}」／利用場面: ${c.scene}`)
    .join("\n");
}

export function buildStickerPlanSystemPrompt(
  characterSettings: CharacterSettingsInput,
): string {
  return `あなたはLINEスタンプ制作のクリエイティブディレクターです。「TokyoWAVES」という水球クラブの公式キャラクターを使ったLINEスタンプを企画します。

# キャラクター設定（毎回必ず守ること。統一感が最優先）
${buildCharacterSettingsText(characterSettings)}

# あなたの役割
ユーザーの自由な指示（例：「敬語版を16種類考えて」「保護者同士で使いやすいスタンプを考えて」「元画像と少し違う構図にして」など）を受けて、指定された件数ぶんのスタンプ企画を1回のJSON出力でまとめて作成します。単にセリフを言い換えるだけでなく、案ごとに以下をすべて考えてください：

- phrase: セリフ
- scene: 利用場面
- emotion: 感情
- expression: 表情
- pose: ポーズ
- handGesture: 手の動き
- bodyOrientation: 体の向き
- hasBall: 水球ボールを持たせる/描くかどうか
- props: 小物（あれば）
- backgroundEffect: 背景演出
- splash: 水しぶきの表現
- effectLines: 効果線の使い方
- textStyle: セリフ文字の雰囲気（フォント・色・縁取りなど）
- differentiationNote: 既存スタンプ・他の案との差別化ポイント
- imageGenPrompt: ChatGPT（画像編集）にそのまま貼り付けられる、**英語**の画像生成プロンプト。上記すべての要素（表情・ポーズ・手の動き・体の向き・小物・背景・水しぶき・効果線・文字の雰囲気）と、キャラクター設定で守るべき点を統合し、参考画像を元にした編集指示として具体的に書くこと。セリフ文字は元の日本語のまま画像内テキストとして指定すること。

# 厳守ルール
- 毎回同じポーズ・同じ構図にならないよう、案ごとに変化をつけること
- キャラクター設定にある「変えてはいけない要素」は絶対に変更しないこと
- 既存スタンプ・他の案と似すぎないよう、differentiationNoteで明確に差別化すること
- 出力はJSON形式のみ。説明文や前置きは含めないこと`;
}

export function buildStickerPlanUserMessage(params: {
  instruction: string;
  requestedCount: number;
  existingCandidates: ExistingCandidateSummary[];
}): string {
  return `# ユーザーの指示
${params.instruction}

# 生成する件数
**必ずちょうど${params.requestedCount}件** のスタンプ企画をplansに出力してください。

# 既存の企画済み案（重複回避の参考。これらとは違う内容にすること）
${buildExistingCandidatesText(params.existingCandidates)}

# 参考画像
このメッセージに添付した画像を、キャラクターの絵柄・配色・特徴の参考にしてください。`;
}
