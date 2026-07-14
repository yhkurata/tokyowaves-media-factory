import { forwardRef } from "react";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";
import { BookmarkBadge } from "../decorative/BookmarkBadge";
import { RibbonBanner } from "../decorative/RibbonBanner";
import { OceanBackground } from "../decorative/OceanBackground";
import {
  NAVY_TOP,
  NAVY_BOTTOM,
  YELLOW_LIGHT,
  YELLOW_HIGHLIGHT,
  TEXT_ON_YELLOW,
  LAYOUT,
  TYPOGRAPHY,
  SHADOWS,
  getLeagueColor,
} from "./theme";

// ダミーデータ（UI確認用。入力フォーム・データ構造・PNG出力は後続で実装）
const DUMMY = {
  tournamentName: "SAITAMA CUP 2026",
  date: "8/9(日)",
  venue: "越谷市総合体育館",
  category: "A区分",
  teamA: "東京WAVES",
  scoreA: 12,
  teamB: "千葉水球クラブ",
  scoreB: 8,
};

function isTW(name: string) {
  return name.includes("東京WAVES");
}

function TeamScorePanel({
  name,
  score,
  isWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
}) {
  const tw = isTW(name);
  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col items-center justify-center"
      style={{
        borderRadius: LAYOUT.cardRadius,
        background: isWinner ? YELLOW_HIGHLIGHT : "white",
        boxShadow: SHADOWS.card,
        padding: "24px 16px",
        border: tw ? `3px solid ${getLeagueColor(0).from}` : "3px solid transparent",
      }}
    >
      {tw && (
        <span
          className="absolute left-4 top-4 text-yellow-500"
          style={{ fontSize: 26 }}
        >
          ★
        </span>
      )}
      <span
        className="w-full min-w-0 truncate px-2 text-center font-black text-gray-800"
        style={{ fontSize: TYPOGRAPHY.cardTitle }}
      >
        {name}
      </span>
      <span
        className="mt-2 font-black"
        style={{
          fontSize: TYPOGRAPHY.heroTitle,
          lineHeight: 1,
          color: NAVY_TOP,
        }}
      >
        {score}
      </span>
    </div>
  );
}

type Props = Record<string, never>;

export const MatchResultTemplate = forwardRef<HTMLDivElement, Props>(
  function MatchResultTemplate(_props, ref) {
    const { tournamentName, date, venue, category, teamA, scoreA, teamB, scoreB } =
      DUMMY;

    const result =
      scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "draw";
    const winnerName = result === "A" ? teamA : result === "B" ? teamB : null;

    return (
      <div
        ref={ref}
        style={{
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          background: `radial-gradient(ellipse 1600px 1200px at 50% 0%, ${NAVY_TOP}, ${NAVY_BOTTOM} 80%)`,
          fontFamily: '"Noto Sans JP", sans-serif',
        }}
        className="relative flex flex-col overflow-hidden"
      >
        <OceanBackground />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
          }}
        />

        {/* ヘッダー */}
        <div
          className="relative z-10 flex items-center justify-between pt-5"
          style={{
            paddingLeft: LAYOUT.outerMargin,
            paddingRight: LAYOUT.outerMargin,
          }}
        >
          <div className="flex items-center gap-4 text-white">
            <TokyoWavesLogo markOnly />
            <div className="flex flex-col leading-none">
              <span
                style={{ fontSize: TYPOGRAPHY.small }}
                className="font-bold tracking-[0.25em] text-blue-300"
              >
                TOKYO WAVES
              </span>
              <span
                style={{ fontSize: TYPOGRAPHY.headerLabel }}
                className="mt-1.5 font-black tracking-wide"
              >
                大会ガイド
              </span>
            </div>
          </div>
          <BookmarkBadge>保存版</BookmarkBadge>
        </div>

        {/* タイトル */}
        <div className="relative z-10 px-2 pb-2 pt-1 text-center">
          <h1
            style={{
              fontSize: 87,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: YELLOW_LIGHT,
              textShadow: "0 6px 18px rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
            }}
            className="leading-none"
          >
            試合結果速報
          </h1>
        </div>

        {/* 大会情報 */}
        <div
          className="relative z-10 text-center"
          style={{
            paddingLeft: LAYOUT.outerMargin,
            paddingRight: LAYOUT.outerMargin,
          }}
        >
          <p
            className="truncate font-bold text-white"
            style={{ fontSize: 24 }}
          >
            {tournamentName}
          </p>
          <div
            className="mt-2 flex items-center justify-center gap-4"
            style={{ fontSize: 18 }}
          >
            <span
              className="shrink-0 rounded-lg font-black text-white"
              style={{
                background: getLeagueColor(0).from,
                padding: "6px 16px",
              }}
            >
              {category}
            </span>
            <span className="shrink-0 font-bold text-blue-200">📅 {date}</span>
            <span className="min-w-0 truncate font-bold text-blue-200">
              📍 {venue}
            </span>
          </div>
        </div>

        {/* スコアボード */}
        <div className="relative z-10 mt-10 flex flex-1 flex-col">
          <div
            className="flex flex-1 items-stretch"
            style={{
              marginLeft: LAYOUT.outerMargin,
              marginRight: LAYOUT.outerMargin,
              gap: 20,
            }}
          >
            <TeamScorePanel
              name={teamA}
              score={scoreA}
              isWinner={result === "A"}
            />
            <div className="flex shrink-0 items-center">
              <span
                className="flex items-center justify-center rounded-full font-black"
                style={{
                  width: 56,
                  height: 56,
                  background: YELLOW_LIGHT,
                  color: TEXT_ON_YELLOW,
                  fontSize: 18,
                  boxShadow: SHADOWS.badge,
                }}
              >
                VS
              </span>
            </div>
            <TeamScorePanel
              name={teamB}
              score={scoreB}
              isWinner={result === "B"}
            />
          </div>

          {/* 結果バナー */}
          <div
            className="mt-8"
            style={{
              marginLeft: LAYOUT.outerMargin,
              marginRight: LAYOUT.outerMargin,
            }}
          >
            <RibbonBanner padding="20px 56px">
              <span
                style={{
                  color: TEXT_ON_YELLOW,
                  fontSize: TYPOGRAPHY.bannerHighlight,
                }}
                className="font-black"
              >
                {result === "draw"
                  ? "🤝 引き分け"
                  : `🎉 ${winnerName} の勝利！`}
              </span>
            </RibbonBanner>
          </div>
        </div>

        {/* フッター */}
        <div
          className="relative z-10 mt-auto flex items-center justify-between pb-3 pt-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingLeft: LAYOUT.outerMargin,
            paddingRight: LAYOUT.outerMargin,
          }}
        >
          <div className="text-white">
            <TokyoWavesLogo scale={1.55} />
          </div>
          <div className="text-right text-white">
            <div
              style={{ fontSize: TYPOGRAPHY.footerMain }}
              className="font-bold"
            >
              📌 結果をチェック！
            </div>
            <div
              style={{ fontSize: TYPOGRAPHY.footerSub }}
              className="mt-1 text-gray-300"
            >
              応援ありがとうございました！
            </div>
          </div>
        </div>
      </div>
    );
  },
);
