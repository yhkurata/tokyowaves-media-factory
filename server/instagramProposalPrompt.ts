const OUTPUT_INSTRUCTIONS = `
# 出力手順（厳守）
上記の役割・方針を踏まえ、以下を1回のJSON出力で完結させる。
AIは質問ばかりせず、既存情報から合理的に判断すること。情報不足でも、
まず仮案を出し、不足点だけ openQuestions に列挙する。ユーザーに逆質問する
turnを作らないこと。出力はJSON形式のみとし、説明文は含めないこと。

1. 添付されたブランドコンテキスト（役割・ターゲット・現在の課題）を踏まえる
2. 添付された直近の投稿履歴を踏まえ、常に新鮮な提案になるよう次の観点を
   すべて考慮する：
   - 過去に「提案済み」（まだ承認されていない案も含む）と同じ切り口を
     繰り返さない
   - 「承認済み」「投稿済み」の案とは明確に違う企画にする
   - 「却下」された案と似た切り口は避ける（一度却下された方向性の再提案は
     よほど違う角度でない限りしない）
   - 直近の投稿比率実績（目標比率との差分）を踏まえ、偏っているカテゴリを
     補うように調整する
   - 同じシリーズ・同じフォーマットの連投になっていないか確認し、
     連投になる場合は理由がない限り避ける
   各候補の noveltyNote に「過去のどの投稿と比べて、なぜ重複していないか」を
   具体的に明記する
3. 今すぐ投稿すべき候補を**必ずちょうど3件**、candidates に出す（2件や4件は不可）。
   各候補は「投稿提案時の出力形式」（優先度/理由・投稿目的・タイトル・
   1枚目コピー・全ページ構成（各ページの画像生成プロンプト＋Canva仕上げ
   メモを含む）・デザイン指示・キャプション・CTA・ハッシュタグ・投稿時間と
   理由・投稿後見るべき数字）をすべて満たす
   - **pageStructureのページ数は伝えたい情報の性質に応じて柔軟に決め、
     無理に複数ページへ分割しない**。ストーリーズは視聴が進むほど離脱率が
     上がるため、単一の訴求メッセージ（大会前日の鼓舞・単発のお知らせ等）
     で完結する内容は1ページのみで完結させる。会場案内・複数の見どころ
     紹介など、性質の異なる情報を複数伝える必要がある場合や、カルーセル
     投稿として複数枚に分ける意味がある場合のみ複数ページにする。ページ数
     を絞った分、そのページ1枚の完成度を上げることを優先する
   - 画像制作は「①ChatGPT等の画像生成AIで、文字込みの完成形に近い1枚を
     一気に作る → ②Canvaでは文言確認とロゴ貼り付けだけの軽微な仕上げ」と
     いう運用にする（Canvaでの手作業を最小限にするため、画像生成AI側に
     できるだけ完成に近づけさせる）。クラブロゴは基本的に毎ページに一貫して
     配置する想定で指示する（ユーザーの希望）。pageStructureの各ページに
     imagePrompt と canvaTouchUpNotes を必ず両方含める。
   - imagePrompt（画像生成AI向け・文字込みでほぼ完成形）は以下を満たす：
     a) 冒頭で「この投稿は何のためのものか（大会・目的・想定読者・
        トーン）」を1〜2文で説明する（title・purpose・priorityReason・
        noveltyNoteの内容を反映する）
     b) 「そのページ1枚だけ」を対象にした独立プロンプトにする。
        「5枚セット」「シリーズで」のように複数枚をまとめて依頼する
        書き方は禁止（1プロンプトで複数フレームを依頼すると、画像生成AI
        が1枚のコラージュ画像にまとめてしまう不具合が実際に発生した
        ため厳守）
     c) そのページで実際に表示する日本語テキスト（contentの内容）を
        一言一句そのまま引用し、画像内に描画するよう指示する。他の文言を
        創作させない（実際に発生した不具合のため厳守）。1枚あたりの
        テキストは短く・大きく・1〜2箇所に絞り、画像生成AIが正確に
        描画しやすい分量にする
     d) designInstructions（色／写真／アイコン／レイアウト／文字サイズ／
        余白／装飾）の内容を、曖昧な参照（「ブランドカラーを使って」等）
        ではなく具体的な指示として全て転記する。色は必ずHEXコードで指定
        する。写真・イラストの被写体・構図・雰囲気も具体的に描写する
     e) **人物を描写する場合は、必ずブランドコンテキストのターゲット層
        （小学生・中学生、男女）に合わせ「成人ではなく小学生・中学生年代の
        子供」であることを明記する**。「選手」とだけ書くと画像生成AIが
        屈強な成人男性選手を描いてしまう不具合が実際に発生したため厳守。
        **複数人を描く場合、「男女混合」とだけ書くと画像生成AIが全員同じ
        性別・同じ水着で描いてしまう不具合が実際に発生したため、必ず男女
        それぞれの水着の形状を分けて明記する**：男子選手は水球用ブリーフ型
        （ショート丈の競泳パンツ）、女子選手は水球用ワンピース型の水着。
        人数の内訳（例：「9人のうち男子5人・女子4人」）を具体的に指定し、
        体格・水着形状の違いで両方が写真から見分けられるようにする。水着は
        共通して肌の露出を抑えた標準的なジュニア水球競技用の一般的な
        デザイン（オープンバックや過度な露出は不可）であることを明記する
        （子供を描く画像で不自然な露出のある水着が生成された不具合が実際に
        発生したため厳守）。あわせて選手の水球帽・水着は実際のチームウェアに
        合わせ、**紺色ベースに白文字で『WAVES』と入ったデザイン**である
        ことを明記する（『WAVES』は短い単語のため画像生成AIでも比較的正確に
        描画しやすい）
     f) **クラブロゴ**：ユーザーがChatGPT側（プロジェクト/カスタムGPT等）に
        TokyoWAVESの実ロゴ画像を事前登録していることを前提に、**基本的に
        すべてのページで**「登録済みの公式ロゴ画像ファイルを、指定位置
        （左上/右下等）にそのまま合成してください。ロゴを一から描き起こし
        たり、文字やマークを再現し直したりしないでください」と明記する
     g) プレースホルダー的な丸数字（○○）やフレーム番号（1/5等）は
        一切含めない
     h) アスペクト比は「縦長ポートレート（2:3比率、1024×1536px相当）」を
        指定する。Instagramストーリーズの正式サイズ(9:16/1080×1920px)は
        ChatGPT等が直接出力できないため、9:16とは書かず実際に出せる2:3を
        指定する
   - canvaTouchUpNotes（Canvaでの軽微な仕上げメモ）は、次の3点だけに
     絞る（大掛かりな手作業を前提にしない）：
     a) 画像内の文字が表示テキスト（一言一句を引用）と一致しているかの
        確認・不一致時のみ修正
     b) ロゴ確認：登録済みロゴが指定位置に自然に合成されているか確認し、
        うまく反映されていなかった場合のみ実ロゴファイルをCanvaで重ねて
        修正（配置しないページは「ロゴ確認不要」と明記）
     c) 生成画像は2:3比率で返るため、Canvaの「Instagramストーリー」
        テンプレート(1080×1920px、9:16)に配置し、トリミング・拡大・
        背景色での余白埋めのいずれかで9:16に合わせる、と明記する
   - 会場住所・練習日時などブランドコンテキストに正確な情報が無い項目は、
     架空の情報を書かせない。該当箇所は入れないか、そのままの文言
     （例:「会場・時間は別途ご案内」）にとどめ、openQuestionsで
     「会場住所が未設定」等の形でユーザーに確認する
4. 3件のうち最も良いものを recommendedCandidateIndex（0〜2）で指定し、
   recommendationReasoning に理由を書く
5. 運用全体を見て operationalSuggestions に改善提案を書く
   （例：「最近募集投稿が多い」「リールが不足している」）。実績が無い・
   判断材料が乏しい場合は無理に埋めず、空配列でよい

# 確定情報の安全ルール（厳守）
- ブランドコンテキスト、投稿履歴、ユーザー指示に書かれていない日付、時刻、
  会場、料金、実績、申込方法、連絡先、URLを推測・創作しない
- 投稿時間が不明な場合、postTime は必ず
  「未確定（運用担当者が設定）」とする
- 申込方法が不明な場合、cta は必ず
  「未確定（正式な申込方法を確認）」とする
- 不明な情報は本文で事実のように断定せず、openQuestions に列挙する
`;

export function buildProposalSystemPrompt(operatingGuide: string): string {
  const guide =
    operatingGuide.trim() !== ""
      ? operatingGuide
      : "（ブランドコンテキストが未設定です。一般的な少年少女スポーツクラブのSNS運用として、合理的な仮定を置いて提案してください。）";
  return `${guide}\n${OUTPUT_INSTRUCTIONS}`;
}

const STATUS_LABELS: Record<string, string> = {
  proposed: "提案済み（未承認）",
  approved: "承認済み",
  rejected: "却下",
  image_created: "画像作成済み",
  posted: "投稿済み",
  backfilled: "過去実績",
};

export interface PostHistorySummaryEntry {
  postedAt: string | null;
  proposedAt: string | null;
  createdAt: string;
  format: string;
  category: string;
  concept: string;
  status: string;
}

const MAX_HISTORY_ENTRIES = 60;

// 直近のものだけを1行要約にして渡す（全文キャプションは送らず、
// 履歴が数百件に増えてもトークン数を抑える）。
export function buildPostHistorySummaryText(
  entries: PostHistorySummaryEntry[],
): string {
  if (entries.length === 0) {
    return "（投稿履歴はまだ登録されていません。）";
  }
  const recent = entries.slice(0, MAX_HISTORY_ENTRIES);
  const lines = recent.map((e) => {
    const date = (e.postedAt ?? e.proposedAt ?? e.createdAt).slice(0, 10);
    const statusLabel = STATUS_LABELS[e.status] ?? e.status;
    return `${date} | ${e.format} | ${e.category} | ${e.concept} | 状態:${statusLabel}`;
  });

  // 投稿比率実績は「実際に世に出た」ものだけで計算する（提案中・却下の
  // 下書きを含めると実態とずれるため、posted/backfilledのみを対象にする）。
  const published = recent.filter(
    (e) => e.status === "posted" || e.status === "backfilled",
  );
  let ratioLine = "（まだ投稿済みの実績がありません）";
  if (published.length > 0) {
    const categoryCounts = new Map<string, number>();
    for (const e of published) {
      categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1);
    }
    ratioLine = Array.from(categoryCounts.entries())
      .map(
        ([category, count]) =>
          `${category}:${Math.round((count / published.length) * 100)}%`,
      )
      .join(" / ");
  }

  return [
    `投稿済み実績${published.length}件の比率：${ratioLine}`,
    "",
    "直近の履歴一覧（新しい順・提案中/却下の案も含む。同じ切り口の重複回避に使うこと）：",
    ...lines,
  ].join("\n");
}

export function buildProposalUserMessage(
  userInstruction: string,
  postHistorySummary: string,
): string {
  return [
    "# 直近の投稿履歴（重複チェック・投稿比率の参考用）",
    postHistorySummary,
    "",
    "# ユーザーからの指示",
    userInstruction,
  ].join("\n");
}
