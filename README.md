# TokyoWAVES Media Factory

水球大会の資料をもとに、Instagram投稿用の 1080×1350 画像を自動生成する、TokyoWAVES専用のSNS投稿制作ツールです。

大会PDF・画像をアップロードするとAI（Claude）が内容を読み取り、大会情報・リーグ組み合わせ・タイムテーブルの各フォームに自動入力します。読み取れなかった項目は手動で修正し、完成したらPNG画像をまとめてZIPでダウンロードできます。

## 技術構成

- Vite + React + TypeScript
- Tailwind CSS v4
- html-to-image（ブラウザ上でDOMをPNG化）
- jszip（PNGをまとめてZIP化）
- @anthropic-ai/sdk（Claude APIによる資料解析。Vite開発サーバー内の簡易バックエンドで使用）

## セットアップ（Mac）

### 1. Node.js の準備

このプロジェクトは Node.js LTS を想定しています。[nvm](https://github.com/nvm-sh/nvm) を使う場合：

```bash
nvm install
nvm use
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. APIキーの設定（資料からの自動読み取り機能を使う場合）

大会PDF/画像をアップロードして内容を自動読み取りする機能を使うには、Anthropic APIキーが必要です。

```bash
cp .env.example .env
```

`.env` を開き、`ANTHROPIC_API_KEY=` の後ろに [console.anthropic.com](https://console.anthropic.com/) で発行したAPIキーを貼り付けてください。`.env` は `.gitignore` 済みのためコミットされません。APIキーはサーバー側（Viteの開発サーバー内の中継処理）でのみ使用され、ブラウザ側のコードには一切含まれません。

この設定をしなくても、各フォームへの手入力・PNG書き出しは通常通り使えます。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ターミナルに表示される `http://localhost:5173/` のようなURLをブラウザで開いてください。

## 使い方

画面上部に4つのステップが並んでいます。

1. **① アップロード** — 大会のPNG・JPEG・PDFを選択する（最大5ファイルまで同時選択可）。タイムテーブルと組み合わせ表など、情報が複数の資料に分かれている場合はまとめて選択すると、試合No.を手がかりに内容を照合して読み取ります。「資料を解析する」を押すとここでAPI利用料が発生します（ファイルを選ぶだけでは発生しません）
2. **② 解析** — Claude APIが資料を解析している間の待機画面。数秒〜数十秒
3. **③ 確認・編集** — 大会情報・リーグ組み合わせ・タイムテーブル・トーナメント表がセクションごとに並びます。「⚠️要確認」が付いたセクションは自動的に開いています。読み取れなかった項目は空欄になっているので、直接入力して修正してください。修正内容は右のプレビューに即時反映されます
4. **④ PNG出力** — 入力済みのテンプレートをまとめて1つのZIPファイルとしてダウンロードします

### 保存・読込・自動保存

- 画面右上の「💾 プロジェクトを保存」「📂 プロジェクトを読み込む」で、入力内容をJSONファイルとして保存・再読込できます（大会前日の修正など、後から編集し直したい場合に使用）
- 入力内容はブラウザのlocalStorageにも自動保存されます。作業を中断してブラウザを閉じても、次回開いたときに「前回の作業内容を復元しますか？」と表示され、続きから再開できます

## ビルド（本番用ファイル生成の確認）

```bash
npm run build
```

エラーなく完了すれば、TypeScriptの型チェックとViteのビルドが通っていることを確認できます。

## 対応テンプレート

- 大会情報（表紙）
- リーグ組み合わせ
- タイムテーブル（複数日・複数会場に対応）
- トーナメント表（8チーム・1回戦〜決勝の勝ち上がり形式）

## 資料から読み込む機能について

- 対象項目：大会名・開催日・会場・区分／カテゴリ・リーグ名・チーム名・試合No.・試合時間・対戦カード
- トーナメント表：出場8チームの単一トーナメント（プール分けなし・不戦勝なし）の場合のみ、1回戦の組み合わせを自動読み取りします。プール制・多段階トーナメントなど複雑な形式の資料は自動読み取り対象外のため、「確認・編集」画面で手入力してください
- 解析APIは `server/extractHandler.ts` の `runExtraction` に共通化されており、ローカル開発では `server/viteExtractPlugin.ts`（Vite開発サーバー用）、本番デプロイでは `api/extract.ts`（Vercel Serverless Function）がそれぞれ同じ `/api/extract` パスで呼び出します

## 本番デプロイ（Vercel）

1. [Vercel](https://vercel.com/) にアカウントを作成し、このリポジトリと連携する（`vercel` CLIを使う場合は `npm i -g vercel` → `vercel login` → `vercel link`）
2. Vercelのプロジェクト設定 → Environment Variables に `ANTHROPIC_API_KEY` を追加する（Production/Preview両方に設定推奨）。`ANTHROPIC_MODEL` を指定したい場合も同様に追加できます（省略時は `claude-opus-4-8`）
3. デプロイする：
   ```bash
   vercel deploy --prod
   ```
   もしくはGitHubリポジトリと連携していれば、mainブランチへのプッシュで自動デプロイされます
4. ビルドコマンド・出力ディレクトリはVercelがVite構成を自動検出します（`npm run build` → `dist/`）。`api/` 配下のファイルは自動的にServerless Functionとして認識されます

**注意：** APIキーはVercelの環境変数にのみ保存され、クライアント側のコードには含まれません。デプロイ後は誰でもURLにアクセスして解析機能（＝APIキーによる課金）を使える状態になるため、社内利用のみを想定する場合はVercelの「Password Protection」機能（Pro以上のプラン）等でアクセス制限を検討してください。

## 今後の実装予定

- プール制・多段階トーナメントなど複雑な組み合わせ表の自動読み取り
- 試合結果速報・最終順位・大会案内・お知らせテンプレート
- 大会プロジェクトの複製

## フォルダ構成

```
src/
├── components/
│   ├── forms/            # 各テンプレートの入力フォーム
│   ├── preview/          # 1080x1350の画像テンプレート
│   └── wizard/            # 4ステップウィザードUI（アップロード〜PNG出力）
├── types/                 # データ型定義
├── state/                 # 入力データの状態管理（フック）
└── lib/
    ├── extraction.ts        # AI解析結果→アプリのデータ構造への変換
    ├── templateSections.ts  # テンプレート定義レジストリ（確認画面・一括出力で共用）
    ├── exportImage.ts       # DOM→PNG Blob化
    ├── exportDelivery.ts    # PNGの配信（ZIP一括ダウンロード）
    ├── projectFile.ts       # プロジェクトの保存・読込（JSON）
    └── autoSave.ts           # localStorageへの自動保存・復元

server/
├── extractHandler.ts     # Claude APIへのリクエスト構築・レスポンス処理（本番・開発共通）
├── extractionSchema.ts   # 抽出結果のJSON Schema
├── extractionPrompt.ts   # 抽出用システムプロンプト
└── viteExtractPlugin.ts  # /api/extract を提供するVite開発サーバー用ミドルウェア（ローカル用）

api/
└── extract.ts            # /api/extract を提供するVercel Serverless Function（本番用）
```
