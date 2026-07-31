import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProposalResult } from "./instagramProposalSchema.js";
import { validateProposalSafety } from "./instagramProposalSafety.js";

function candidate(overrides: {
  caption?: string;
  cta?: string;
  postTime?: string;
}): ProposalResult["candidates"][number] {
  return {
    format: "feed",
    formatReasoning: "理由",
    category: "募集",
    noveltyNote: "新規",
    plan: {
      priorityStars: 3,
      priorityReason: "理由",
      purpose: "recruit",
      title: "体験案内",
      firstSlideCopy: "水球を始めよう",
      pageStructure: [
        {
          pageNumber: 1,
          content: "初心者歓迎",
          imagePrompt: "画像",
          canvaTouchUpNotes: "確認",
        },
      ],
      designInstructions: {
        colors: "紺",
        photos: "選手",
        icons: "なし",
        layout: "中央",
        fontSize: "大",
        whitespace: "広め",
        decoration: "なし",
      },
      caption: overrides.caption ?? "体験参加を受付中です。",
      cta: overrides.cta ?? "申込方法は確認後に設定",
      hashtags: ["#TokyoWAVES"],
      postTime: overrides.postTime ?? "未確定（運用担当者が設定）",
      postTimeReason: "確定情報の登録後に判断",
      metricsToWatch: ["問い合わせ数"],
    },
  };
}

test("入力にないDM・時刻・料金を警告する", () => {
  const candidates = [
    candidate({
      caption: "体験無料。DMでお問い合わせください。",
      cta: "プロフィールのリンクから申込",
      postTime: "平日19:30〜21:00",
    }),
    candidate({}),
    candidate({}),
  ] as ProposalResult["candidates"];

  const warnings = validateProposalSafety(
    candidates,
    "TokyoWAVESは小中学生向けの水球クラブです。",
  );
  assert.deepEqual(
    warnings.map((warning) => warning.field).sort(),
    ["contact", "contact", "price", "time"],
  );
  assert.ok(warnings.every((warning) => warning.candidateIndex === 0));
});

test("運用ガイドまたは指示に明記された情報は許可する", () => {
  const candidates = [
    candidate({
      caption: "体験無料。DMでお問い合わせください。",
      cta: "DMで申込",
      postTime: "19:30",
    }),
    candidate({}),
    candidate({}),
  ] as ProposalResult["candidates"];

  const warnings = validateProposalSafety(
    candidates,
    "体験は無料。申込はDM。投稿時間は19:30。",
  );
  assert.deepEqual(warnings, []);
});

