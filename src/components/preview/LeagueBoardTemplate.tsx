import { forwardRef } from "react";
import type { LeagueGroup } from "../../types/league";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";
import { RibbonBanner } from "../decorative/RibbonBanner";
import { BookmarkBadge } from "../decorative/BookmarkBadge";
import { WaterPoloBallIcon } from "../decorative/WaterPoloBallIcon";
import { OceanBackground } from "../decorative/OceanBackground";
import {
  NAVY_TOP,
  NAVY_BOTTOM,
  YELLOW_LIGHT,
  TEXT_ON_YELLOW,
  LAYOUT,
  TYPOGRAPHY,
  SHADOWS,
  getLeagueColor,
} from "./theme";

type Props = {
  leagues: LeagueGroup[];
};

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

function findTokyoWaves(leagues: LeagueGroup[]) {
  for (const league of leagues) {
    const teamIndex = league.teams.findIndex(
      (team) => team.isTokyoWaves && team.name.trim() !== "",
    );
    if (teamIndex !== -1) {
      return { leagueName: league.name, position: teamIndex + 1 };
    }
  }
  return null;
}

export const LeagueBoardTemplate = forwardRef<HTMLDivElement, Props>(
  function LeagueBoardTemplate({ leagues }, ref) {
    const tokyoWaves = findTokyoWaves(leagues);

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
        {/* 背景の装飾（大きな光と小さな光のみで奥行きを作る） */}
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
          style={{ paddingLeft: LAYOUT.outerMargin, paddingRight: LAYOUT.outerMargin }}
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
              fontSize: 94,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: YELLOW_LIGHT,
              textShadow: "0 6px 18px rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
            }}
            className="leading-none"
          >
            リーグ組み合わせ
          </h1>
        </div>

        {/* 上部バナー */}
        <div
          className="relative z-10 mb-3 mt-0.5"
          style={{ marginLeft: LAYOUT.outerMargin, marginRight: LAYOUT.outerMargin }}
        >
          <RibbonBanner padding="17px 64px">
            <span
              style={{ color: TEXT_ON_YELLOW, fontSize: TYPOGRAPHY.bannerText }}
              className="font-black"
            >
              🏆 各リーグ上位2チームが代表決定戦へ！
            </span>
          </RibbonBanner>
        </div>

        {/* リーグカード一覧 */}
        <div
          className="relative z-10 flex flex-1 flex-col justify-center"
          style={{
            gap: LAYOUT.cardGap,
            paddingLeft: LAYOUT.outerMargin,
            paddingRight: LAYOUT.outerMargin,
          }}
        >
          {chunkPairs(leagues).map((pair, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex ${pair.length === 1 ? "justify-center" : ""}`}
              style={{ gap: LAYOUT.cardGap }}
            >
              {pair.map((league, i) => {
                const index = rowIndex * 2 + i;
                const color = getLeagueColor(index);
                return (
                  <div
                    key={league.id}
                    className={`relative ${
                      pair.length === 1 ? "w-[527px]" : "flex-1"
                    }`}
                  >
                    {/* 光の演出：カード背後に淡く滲むリーグカラーのグロー */}
                    <div
                      className="pointer-events-none absolute -inset-4 rounded-[36px]"
                      style={{
                        background: `radial-gradient(ellipse 90% 75% at 50% 20%, ${color.to}4d, transparent 72%)`,
                        filter: "blur(20px)",
                      }}
                    />
                    <div
                      className="relative overflow-hidden"
                      style={{
                        borderRadius: LAYOUT.cardRadius,
                        background: "linear-gradient(180deg, #ffffff, #f6f7fb)",
                        boxShadow: `${SHADOWS.card}, inset 0 1px 0 rgba(255,255,255,0.95)`,
                      }}
                    >
                      <div
                        className="relative overflow-hidden px-8 py-3"
                        style={{
                          background: `linear-gradient(115deg, ${color.from}, ${color.to})`,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background: `radial-gradient(ellipse 65% 100% at 12% -10%, rgba(255,255,255,0.4), transparent 60%)`,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.12) 100%)",
                          }}
                        />
                        <WaterPoloBallIcon className="pointer-events-none absolute -right-3 -top-3 h-28 w-28 opacity-[0.18]" />
                        <span
                          style={{ fontSize: TYPOGRAPHY.cardTitle }}
                          className="relative font-black tracking-wide text-white"
                        >
                          {league.name || "リーグ名未入力"}
                        </span>
                      </div>
                      <div className="px-8 py-2">
                        {league.teams.map((team, teamIndex) => (
                          <div
                            key={team.id}
                            className={`flex items-center gap-4 border-b py-[13px] last:border-b-0 ${
                              team.isTokyoWaves
                                ? "-mx-8 rounded-xl border-none px-8"
                                : "border-gray-100"
                            }`}
                            style={
                              team.isTokyoWaves
                                ? {
                                    background:
                                      "linear-gradient(90deg, #fff3c4, #ffe9a0)",
                                    boxShadow:
                                      "inset 0 1px 0 rgba(255,255,255,0.8)",
                                  }
                                : undefined
                            }
                          >
                            {team.isTokyoWaves && (
                              <span
                                className="text-[27px] text-yellow-500"
                                style={{
                                  filter:
                                    "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                                }}
                              >
                                ★
                              </span>
                            )}
                            <span
                              className="flex shrink-0 items-center justify-center rounded-full font-black text-white"
                              style={{
                                width: LAYOUT.badgeSize,
                                height: LAYOUT.badgeSize,
                                fontSize: TYPOGRAPHY.badgeNumber,
                                background: `radial-gradient(circle at 34% 28%, ${color.to}, ${color.from})`,
                                boxShadow: `${SHADOWS.badge}, inset 0 1px 1px rgba(255,255,255,0.5)`,
                                border: "2px solid rgba(255,255,255,0.7)",
                              }}
                            >
                              {teamIndex + 1}
                            </span>
                            <span
                              style={{ fontSize: TYPOGRAPHY.bodyLarge }}
                              className="truncate font-bold text-gray-800"
                            >
                              {team.name || "チーム名未入力"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 下部バナー（東京WAVESの所属リーグ・順位を自動反映） */}
        {tokyoWaves && (
          <div
            className="relative z-10 my-4"
            style={{ marginLeft: LAYOUT.outerMargin, marginRight: LAYOUT.outerMargin }}
          >
            <RibbonBanner padding="17px 56px">
              <div>
                <div
                  style={{
                    color: TEXT_ON_YELLOW,
                    fontSize: TYPOGRAPHY.bannerHighlight,
                  }}
                  className="font-black"
                >
                  ⭐ 東京WAVESは
                  <span style={{ color: "#1d4fb2" }}>
                    {tokyoWaves.leagueName}
                  </span>
                  {tokyoWaves.position}番！
                </div>
                <div
                  style={{ fontSize: TYPOGRAPHY.bannerSub }}
                  className="mt-1.5 font-bold text-blue-900"
                >
                  ➡ 予選リーグ上位2チームが代表決定戦へ進出します
                </div>
              </div>
            </RibbonBanner>
          </div>
        )}

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
            <div style={{ fontSize: TYPOGRAPHY.footerMain }} className="font-bold">
              📌 組み合わせ確認用に保存しよう！
            </div>
            <div
              style={{ fontSize: TYPOGRAPHY.footerSub }}
              className="mt-1 text-gray-300"
            >
              大会当日に見返してチェック！
            </div>
          </div>
        </div>
      </div>
    );
  },
);
