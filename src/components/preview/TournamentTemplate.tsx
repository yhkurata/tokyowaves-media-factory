import { forwardRef } from "react";
import type { BracketData } from "../../types/bracket";
import { getSemisSlots, getFinalSlot, getChampion } from "../../lib/bracket";
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
} from "./theme";

const BOX_HEIGHT = 56;
const PAIR_GAP = 14;
const CONNECTOR_WIDTH = 36;
const HALF_SPAN = PAIR_GAP / 2 + BOX_HEIGHT / 2;

function isTW(name: string) {
  return name.includes("東京WAVES");
}

function TeamBox({ name, placeholder }: { name: string; placeholder: string }) {
  const isEmpty = name.trim() === "";
  return (
    <div
      className="flex min-w-0 items-center overflow-hidden px-3"
      style={{
        height: BOX_HEIGHT,
        fontSize: 18,
        borderRadius: LAYOUT.tagRadius,
        background: !isEmpty && isTW(name) ? YELLOW_HIGHLIGHT : "white",
        boxShadow: SHADOWS.badge,
      }}
    >
      <span
        className={`min-w-0 truncate ${isEmpty ? "font-normal text-gray-400" : "font-bold text-gray-800"}`}
      >
        {isEmpty ? placeholder : name}
      </span>
    </div>
  );
}

function Connector() {
  return (
    <div
      className="pointer-events-none absolute right-0 z-0"
      style={{
        width: CONNECTOR_WIDTH,
        top: `calc(50% - ${HALF_SPAN}px)`,
        bottom: `calc(50% - ${HALF_SPAN}px)`,
        transform: `translateX(${CONNECTOR_WIDTH}px)`,
        borderTop: "2px solid rgba(255,255,255,0.45)",
        borderBottom: "2px solid rgba(255,255,255,0.45)",
        borderRight: "2px solid rgba(255,255,255,0.45)",
      }}
    />
  );
}

function MatchPair({
  teamA,
  teamB,
  placeholder,
  connector = true,
}: {
  teamA: string;
  teamB: string;
  placeholder: string;
  connector?: boolean;
}) {
  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col justify-center"
      style={{ gap: PAIR_GAP }}
    >
      <TeamBox name={teamA} placeholder={placeholder} />
      <TeamBox name={teamB} placeholder={placeholder} />
      {connector && <Connector />}
    </div>
  );
}

function RoundLabel({ children }: { children: string }) {
  return (
    <div
      className="mb-3 text-center font-black text-blue-300"
      style={{ fontSize: 18, letterSpacing: "0.05em" }}
    >
      {children}
    </div>
  );
}

type Props = {
  data: BracketData;
};

export const TournamentTemplate = forwardRef<HTMLDivElement, Props>(
  function TournamentTemplate({ data }, ref) {
    const semisSlots = getSemisSlots(data.round1, data.round1Winners);
    const finalSlot = getFinalSlot(semisSlots, data.semisWinners);
    const champion = getChampion(finalSlot, data.finalWinner);

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
            トーナメント表
          </h1>
        </div>

        {/* ブラケット */}
        <div
          className="relative z-10 flex flex-1"
          style={{
            marginLeft: LAYOUT.outerMargin,
            marginRight: LAYOUT.outerMargin,
            marginTop: 8,
            gap: CONNECTOR_WIDTH,
          }}
        >
          {/* 1回戦 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <RoundLabel>1回戦</RoundLabel>
            <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 10 }}>
              {data.round1.map((slot, i) => (
                <MatchPair
                  key={i}
                  teamA={slot.teamA}
                  teamB={slot.teamB}
                  placeholder="チーム名未入力"
                />
              ))}
            </div>
          </div>

          {/* 準決勝 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <RoundLabel>準決勝</RoundLabel>
            <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 10 }}>
              {semisSlots.map((slot, i) => (
                <MatchPair
                  key={i}
                  teamA={slot.teamA}
                  teamB={slot.teamB}
                  placeholder="1回戦の勝者"
                />
              ))}
            </div>
          </div>

          {/* 決勝 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <RoundLabel>決勝</RoundLabel>
            <div className="flex flex-1 flex-col justify-center">
              <MatchPair
                teamA={finalSlot.teamA}
                teamB={finalSlot.teamB}
                placeholder="準決勝の勝者"
                connector={false}
              />
            </div>
          </div>
        </div>

        {/* 優勝バナー（最も目立たせる） */}
        <div
          className="relative z-10 mt-6"
          style={{
            marginLeft: LAYOUT.outerMargin,
            marginRight: LAYOUT.outerMargin,
          }}
        >
          <RibbonBanner padding="24px 56px">
            <div>
              <div
                style={{
                  color: TEXT_ON_YELLOW,
                  fontSize: TYPOGRAPHY.bannerHighlight,
                }}
                className="font-black"
              >
                🏆 優勝：{champion || "未定"}
              </div>
            </div>
          </RibbonBanner>
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
              📌 トーナメントの結果を保存しよう！
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
