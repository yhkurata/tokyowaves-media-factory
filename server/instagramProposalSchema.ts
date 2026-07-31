export type PostFormat = "feed" | "carousel" | "reel" | "story";
export type PostPurpose = "save" | "share" | "recruit" | "awareness" | "empathy";
export type PostCategory = "教育系" | "共感系" | "大会・活動報告" | "募集";

export interface PostPlanPage {
  pageNumber: number;
  content: string;
  // このページ(1枚)だけを対象にした、文字・レイアウト込みでほぼ完成形を
  // 目指す画像生成プロンプト（クラブロゴだけは画像生成AIに描かせず、
  // 配置用の余白を空けさせる）。
  imagePrompt: string;
  // 画像生成後にCanvaで行う、ごく軽微な仕上げ作業のみのメモ
  // （文言が指示通りか確認・必要なら修正、ロゴを実ファイルで貼る、程度）。
  canvaTouchUpNotes: string;
}

export interface PostPlan {
  priorityStars: number; // 1-5
  priorityReason: string;
  purpose: PostPurpose;
  title: string;
  firstSlideCopy: string;
  pageStructure: PostPlanPage[];
  designInstructions: {
    colors: string;
    photos: string;
    icons: string;
    layout: string;
    fontSize: string;
    whitespace: string;
    decoration: string;
  };
  caption: string;
  cta: string;
  hashtags: string[];
  postTime: string;
  postTimeReason: string;
  metricsToWatch: string[];
}

export interface ProposalCandidate {
  format: PostFormat;
  formatReasoning: string;
  category: PostCategory;
  plan: PostPlan;
  noveltyNote: string;
}

export interface ProposalResult {
  candidates: [ProposalCandidate, ProposalCandidate, ProposalCandidate];
  recommendedCandidateIndex: number; // 0-2
  recommendationReasoning: string;
  operationalSuggestions: string[];
  openQuestions: string[];
}

const POST_PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    priorityStars: { type: "integer" },
    priorityReason: { type: "string" },
    purpose: {
      type: "string",
      enum: ["save", "share", "recruit", "awareness", "empathy"],
    },
    title: { type: "string" },
    firstSlideCopy: { type: "string" },
    pageStructure: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pageNumber: { type: "integer" },
          content: { type: "string" },
          imagePrompt: {
            type: "string",
            description:
              "このページ1枚だけを対象に、画像生成AI（ChatGPT等）に1回で" +
              "依頼して**そのまま公開できる完成形に近い画像**を目指すプロンプト。" +
              "以下を全て満たすこと：" +
              "(1) 冒頭1〜2文で、この投稿の目的・背景・想定読者・トーンを" +
              "説明する（例：『これはジュニア水球クラブの公式Instagram" +
              "ストーリーズの1枚目。翌日に迫った大会に向け選手と保護者を" +
              "鼓舞するのが目的。対象読者は小学生の保護者。トーンは高級感が" +
              "ありつつ熱い』）。" +
              "(2) 『1枚の画像のみを生成する』ことを明記し、『5枚セット』" +
              "『シリーズ』のような複数画像を連想させる表現は含めない" +
              "（複数フレームを1プロンプトにまとめると画像生成AIが1枚の" +
              "コラージュ画像にまとめてしまう不具合が実際に発生したため厳守）。" +
              "(3) このページで実際に表示する日本語テキスト(contentの内容)を" +
              "一言一句そのまま引用して画像内に描画するよう指示する（他の" +
              "文言を創作させない。『見出しテキスト』のような抽象的な説明のみは" +
              "不可。テキストは1つの画像につき短く・大きく・1〜2箇所に絞り、" +
              "画像生成AIが正確に描画しやすい分量に収める）。" +
              "(4) designInstructions(colors/photos/icons/layout/fontSize/" +
              "whitespace/decoration)の内容を、具体的な指示として全てこの" +
              "プロンプト文中に転記する（色は必ずHEXコードで指定し、『ブランド" +
              "カラーを使って』のような曖昧な参照はしない）。写真・イラストの" +
              "被写体・構図・雰囲気も具体的に描写する。" +
              "(5) **人物を描写する場合は、必ずブランドコンテキストのターゲット" +
              "層（小学生・中学生、男女）に合わせ、『成人ではなく小学生・中学生" +
              "年代の子供』であることを明記する**。『選手』とだけ書くと画像生成" +
              "AIが屈強な成人男性選手を描いてしまう不具合が実際に発生したため" +
              "厳守。**複数人を描く場合は『男女混合』とだけ書くと画像生成AIが" +
              "全員同じ性別・同じ水着で描いてしまう不具合が実際に発生したため、" +
              "必ず男女それぞれの水着の形状を分けて明記する**：男子選手は" +
              "水球用ブリーフ型（ショート丈の競泳パンツ）、女子選手は水球用" +
              "ワンピース型の水着。人数のうち何人かは男子、何人かは女子である" +
              "ことを具体的に指定する（例：『9人のうち男子5人・女子4人』のように" +
              "内訳を明記し、体格・水着形状の違いで両方が写真から見分けられる" +
              "ようにする）。水着は共通して肌の露出を抑えた標準的なジュニア" +
              "水球競技用の一般的なデザイン（オープンバックや過度な露出は" +
              "不可）であることを明記する（子供を描く画像で不自然な露出のある" +
              "水着が生成された不具合が実際に発生したため厳守）。" +
              "あわせて、選手の水球帽・水着は実際のチームウェアに合わせ、" +
              "**紺色ベースに白文字で『WAVES』と入ったデザイン**であることを" +
              "明記する（『WAVES』は短い単語のため画像生成AIでも比較的正確に" +
              "描画しやすい。実際のチームウェアの外観のため厳守）。" +
              "(6) **クラブロゴ**：ユーザーがChatGPT側（プロジェクト/カスタムGPT" +
              "等）にTokyoWAVESの実ロゴ画像を事前登録していることを前提に、" +
              "基本的にすべてのページで『登録済みの公式ロゴ画像ファイルを、" +
              "指定位置（左上/右下等）にそのまま合成してください。ロゴを一から" +
              "描き起こしたり、文字や" +
              "マークを再現し直したりしないでください』と明記する。" +
              "(7) プレースホルダーの丸数字(○○)やフレーム番号(1/5等)は" +
              "一切含めない。" +
              "(8) アスペクト比は『縦長ポートレート（2:3比率、1024×1536px" +
              "相当）』を指定する。Instagramストーリーズの正式サイズ(9:16/" +
              "1080×1920px)は画像生成AI(ChatGPT等)が直接出力できないため、" +
              "9:16と書かず、AIが実際に出せる2:3を指定し、9:16への合わせ込みは" +
              "canvaTouchUpNotesでCanva側の作業とする。",
          },
          canvaTouchUpNotes: {
            type: "string",
            description:
              "画像生成後にCanva等で行う、ごく軽微な仕上げ作業のみのメモ。" +
              "大掛かりな手作業は前提にせず、次の3点だけに絞る：" +
              "(1) 画像内の文字が下記の表示テキストと一言一句一致しているか" +
              "確認し、違っていた場合だけテキストボックスで修正する（表示" +
              "テキストをそのまま引用して明記する）。" +
              "(2) ロゴ確認：画像生成AI側で登録済みロゴが指定位置に自然に" +
              "合成されているか確認し、うまく反映されていなかった場合のみ、" +
              "実ロゴファイルをCanvaで指定位置に重ねて修正する（位置・目安" +
              "サイズを一言で）。ロゴを配置しないページは『ロゴ確認不要』と" +
              "明記する。" +
              "(3) 生成された画像は2:3比率(1024×1536px相当)で返ってくるため、" +
              "Canvaの『Instagramストーリー』テンプレート(1080×1920px、9:16)に" +
              "配置し、9:16に収まるようトリミングまたは拡大・背景色で余白を" +
              "埋める、と明記する。" +
              "上記以外の作業（配色変更・レイアウト組み直し等）は発生しない" +
              "前提で書くこと。",
          },
        },
        required: ["pageNumber", "content", "imagePrompt", "canvaTouchUpNotes"],
        additionalProperties: false,
      },
    },
    designInstructions: {
      type: "object",
      properties: {
        colors: { type: "string" },
        photos: { type: "string" },
        icons: { type: "string" },
        layout: { type: "string" },
        fontSize: { type: "string" },
        whitespace: { type: "string" },
        decoration: { type: "string" },
      },
      required: [
        "colors",
        "photos",
        "icons",
        "layout",
        "fontSize",
        "whitespace",
        "decoration",
      ],
      additionalProperties: false,
    },
    caption: { type: "string" },
    cta: {
      type: "string",
      description:
        "読者に促す次の行動。正式な申込方法が入力情報に無い場合は、" +
        "推測せず「未確定（正式な申込方法を確認）」とする。",
    },
    hashtags: { type: "array", items: { type: "string" } },
    postTime: {
      type: "string",
      description:
        "推奨投稿時間。確定済みの時間情報が入力に無い場合は、" +
        "「未確定（運用担当者が設定）」とする。",
    },
    postTimeReason: { type: "string" },
    metricsToWatch: { type: "array", items: { type: "string" } },
  },
  required: [
    "priorityStars",
    "priorityReason",
    "purpose",
    "title",
    "firstSlideCopy",
    "pageStructure",
    "designInstructions",
    "caption",
    "cta",
    "hashtags",
    "postTime",
    "postTimeReason",
    "metricsToWatch",
  ],
  additionalProperties: false,
} as const;

export const PROPOSAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["feed", "carousel", "reel", "story"],
          },
          formatReasoning: { type: "string" },
          category: {
            type: "string",
            enum: ["教育系", "共感系", "大会・活動報告", "募集"],
          },
          plan: POST_PLAN_JSON_SCHEMA,
          noveltyNote: { type: "string" },
        },
        required: [
          "format",
          "formatReasoning",
          "category",
          "plan",
          "noveltyNote",
        ],
        additionalProperties: false,
      },
      // Claudeの構造化出力は minItems/maxItems に 0 か 1 以外を指定できない
      // （"For 'array' type, 'minItems' values other than 0 or 1 are not
      // supported" という400エラーになる）。3件という件数はプロンプト側の
      // 指示（「candidates に3件出す」）で担保する。
    },
    recommendedCandidateIndex: { type: "integer" },
    recommendationReasoning: { type: "string" },
    operationalSuggestions: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "candidates",
    "recommendedCandidateIndex",
    "recommendationReasoning",
    "operationalSuggestions",
    "openQuestions",
  ],
  additionalProperties: false,
} as const;
