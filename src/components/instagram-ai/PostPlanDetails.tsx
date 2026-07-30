import { useState } from "react";
import type { PostPlan } from "../../types/instagramAi";

type Props = {
  plan: PostPlan;
  formatReasoning?: string;
  noveltyNote?: string;
};

function CopyableBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-800">
        {text}
      </pre>
    </div>
  );
}

// AI提案1件分のPostPlan全項目を表示する共通コンポーネント。
// 生成直後の提案カード（ProposalCandidateCard）と、後から一覧で
// 再表示する場合（PostListScreen）の両方から使う。
export function PostPlanDetails({ plan, formatReasoning, noveltyNote }: Props) {
  return (
    <div className="space-y-4">
      {formatReasoning && (
        <div>
          <span className="text-xs font-semibold text-gray-500">
            フォーマットの理由
          </span>
          <p className="text-sm text-gray-800">{formatReasoning}</p>
        </div>
      )}

      {noveltyNote && (
        <div>
          <span className="text-xs font-semibold text-gray-500">
            過去投稿との差別化
          </span>
          <p className="text-sm text-gray-800">{noveltyNote}</p>
        </div>
      )}

      <div>
        <span className="text-xs font-semibold text-gray-500">1枚目コピー</span>
        <p className="text-sm font-bold text-gray-900">{plan.firstSlideCopy}</p>
      </div>

      {plan.pageStructure.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-semibold text-gray-500">
            全ページ構成・画像制作手順（①ChatGPTで完成形に近い1枚を生成 → ②Canvaで軽く仕上げ、1枚ずつ）
          </span>
          {plan.pageStructure
            .slice()
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map((page) => (
              <div
                key={page.pageNumber}
                className="space-y-2 rounded-md border border-gray-200 p-3"
              >
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-gray-500">
                    {page.pageNumber}枚目：
                  </span>
                  {page.content}
                </p>
                {page.imagePrompt && (
                  <CopyableBlock
                    label={`${page.pageNumber}枚目：画像生成プロンプト（ChatGPT用）`}
                    text={page.imagePrompt}
                  />
                )}
                {page.canvaTouchUpNotes && (
                  <CopyableBlock
                    label={`${page.pageNumber}枚目：Canva仕上げメモ`}
                    text={page.canvaTouchUpNotes}
                  />
                )}
              </div>
            ))}
        </div>
      )}

      <div>
        <span className="mb-1 block text-xs font-semibold text-gray-500">
          デザイン指示
        </span>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-800">
          <dt className="text-gray-400">色</dt>
          <dd>{plan.designInstructions.colors}</dd>
          <dt className="text-gray-400">写真</dt>
          <dd>{plan.designInstructions.photos}</dd>
          <dt className="text-gray-400">アイコン</dt>
          <dd>{plan.designInstructions.icons}</dd>
          <dt className="text-gray-400">レイアウト</dt>
          <dd>{plan.designInstructions.layout}</dd>
          <dt className="text-gray-400">文字サイズ</dt>
          <dd>{plan.designInstructions.fontSize}</dd>
          <dt className="text-gray-400">余白</dt>
          <dd>{plan.designInstructions.whitespace}</dd>
          <dt className="text-gray-400">装飾</dt>
          <dd>{plan.designInstructions.decoration}</dd>
        </dl>
      </div>

      {/* 旧形式（ページ単位のimagePrompt導入前）の提案にのみ残る互換表示。
          1プロンプトで複数枚を依頼する形式のため、画像生成AIが1枚の
          コラージュ画像にまとめてしまう場合がある点に注意。 */}
      {!plan.pageStructure.some((page) => page.imagePrompt) &&
        plan.imageGenPrompt && (
          <CopyableBlock
            label="ChatGPT画像生成用プロンプト（旧形式）"
            text={plan.imageGenPrompt}
          />
        )}

      <CopyableBlock
        label="キャプション（Instagram投稿文）"
        text={[plan.caption, "", plan.cta, "", plan.hashtags.join(" ")].join("\n")}
      />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-xs font-semibold text-gray-500">投稿時間</span>
          <p className="text-gray-800">
            {plan.postTime}（{plan.postTimeReason}）
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500">
            投稿後見るべき数字
          </span>
          <p className="text-gray-800">{plan.metricsToWatch.join("・")}</p>
        </div>
      </div>
    </div>
  );
}
