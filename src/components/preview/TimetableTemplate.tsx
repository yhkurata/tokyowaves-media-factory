import { forwardRef } from "react";
import type { TimetableMatch } from "../../types/timetable";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { formatDisplayDate } from "../../lib/tournamentSchedule";
import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";
import { BookmarkBadge } from "../decorative/BookmarkBadge";
import { OceanBackground } from "../decorative/OceanBackground";
import {
  NAVY_TOP,
  NAVY_BOTTOM,
  YELLOW_LIGHT,
  YELLOW_HIGHLIGHT,
  LAYOUT,
  TYPOGRAPHY,
  SHADOWS,
  getLeagueColor,
} from "./theme";

const LEAGUE_LABELS = ["A", "B", "C", "D"];

// タイムテーブル部分（日程バー・テーブル・注記）だけの左右余白。
// ヘッダー・フッターは LAYOUT.outerMargin のまま変更しない。
const CONTENT_MARGIN = 52;

// 試合行1件分の高さ（padding "10px 0" 基準、実測値）と、テーブル・注記に使える
// 縦幅の予算（実測値から少し余裕を持たせた値）。試合数が多いフォント固定のままだと
// テーブル＋注記がこの予算を超え、フッターや下側の行がキャンバス外に押し出されて
// 見切れてしまうため、はみ出す場合だけ行の高さ・文字サイズを縮小して必ず収める。
const BASE_ROW_HEIGHT = 55;
const FIXED_OVERHEAD = 150; // テーブル見出し行 + 注記とのgap + 注記の高さ（試合数に依存しない）
const AVAILABLE_BUDGET = 980;
const MIN_ROW_SCALE = 0.55;

function rowScaleFor(matchCount: number): number {
  if (matchCount <= 0) return 1;
  const idealTotal = BASE_ROW_HEIGHT * matchCount + FIXED_OVERHEAD;
  if (idealTotal <= AVAILABLE_BUDGET) return 1;
  const availableForRows = AVAILABLE_BUDGET - FIXED_OVERHEAD;
  const scale = availableForRows / (BASE_ROW_HEIGHT * matchCount);
  return Math.max(MIN_ROW_SCALE, Math.min(1, scale));
}

function leagueColorFor(label: string) {
  const index = LEAGUE_LABELS.indexOf(label);
  return getLeagueColor(index === -1 ? 0 : index);
}

type Props = {
  date: string;
  venue: string;
  round: string;
  matches: TimetableMatch[];
};

export const TimetableTemplate = forwardRef<HTMLDivElement, Props>(
  function TimetableTemplate({ date, venue, round, matches }, ref) {
    const rowScale = rowScaleFor(matches.length);
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
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
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
              fontSize: 87,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: YELLOW_LIGHT,
              textShadow: "0 6px 18px rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
            }}
            className="leading-none"
          >
            大会タイムテーブル
          </h1>
        </div>

        {/* 日程・会場（高級なプレート質感：グラデーション＋グロス＋外側グロー） */}
        <div
          className="relative z-10 flex items-center gap-4"
          style={{
            paddingLeft: CONTENT_MARGIN,
            paddingRight: CONTENT_MARGIN,
            marginBottom: 4,
          }}
        >
          <div className="relative shrink-0">
            <div
              className="pointer-events-none absolute -inset-2 rounded-2xl"
              style={{
                background: `radial-gradient(ellipse 100% 140% at 50% 50%, ${getLeagueColor(0).to}55, transparent 72%)`,
                filter: "blur(12px)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-lg"
              style={{
                background: `linear-gradient(155deg, ${getLeagueColor(0).to}, ${NAVY_TOP} 88%)`,
                boxShadow:
                  "0 10px 22px -10px rgba(3,57,160,0.6), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0"
                style={{
                  height: "60%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
                }}
              />
              <span
                className="relative block font-black text-white"
                style={{ padding: "9px 21px", fontSize: 23 }}
              >
                🗓 {date ? formatDisplayDate(date) : "日付未入力"} {round}
              </span>
            </div>
          </div>
          <span
            className="truncate font-bold text-white"
            style={{ fontSize: 21 }}
          >
            📍 会場：{venue || "会場未入力"}
          </span>
        </div>

        {/* タイムテーブル＋注記（試合数が少ない場合は縦中央に配置）
            marginTopで日時バーとの距離を詰める（中央配置ロジック自体は変更しない） */}
        <div
          className="relative z-10 flex flex-1 flex-col justify-center"
          style={{ marginTop: -26 }}
        >
        <div
          className="relative"
          style={{ marginLeft: CONTENT_MARGIN, marginRight: CONTENT_MARGIN }}
        >
          {/* 外側の青いグロー（テーブル全体にわずかな浮遊感を出す） */}
          <div
            className="pointer-events-none absolute -inset-5 rounded-[40px]"
            style={{
              background: `radial-gradient(ellipse 92% 55% at 50% 25%, ${getLeagueColor(0).to}4a, transparent 74%)`,
              filter: "blur(24px)",
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
          {/* テーブルヘッダー（わずかなグラデーション＋上部グロス） */}
          <div
            className="relative flex items-center font-black text-white"
            style={{
              background: `linear-gradient(135deg, #1c234f, ${NAVY_TOP} 80%)`,
              fontSize: 21,
              padding: "15px 0",
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: "55%",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)",
              }}
            />
            <div className="relative shrink-0 text-center" style={{ width: 117 }}>
              🕐 時間
            </div>
            <div className="relative shrink-0 text-center" style={{ width: 95 }}>
              リーグ
            </div>
            <div className="relative shrink-0 text-center" style={{ width: 74 }}>
              No.
            </div>
            <div className="relative flex-1 text-center">対戦カード</div>
          </div>

          {matches.map((match) => {
            const color = leagueColorFor(match.league);
            const badgeSize = 34 * rowScale;
            return (
              <div
                key={match.id}
                className="flex items-center border-b border-gray-100 last:border-b-0"
                style={{
                  padding: `${10 * rowScale}px 0`,
                  background: match.isTokyoWaves ? YELLOW_HIGHLIGHT : undefined,
                }}
              >
                <div
                  className="shrink-0 truncate px-1 text-center font-black text-gray-900"
                  style={{ width: 117, fontSize: 22 * rowScale }}
                >
                  {match.time || "--:--"}
                </div>
                <div className="flex shrink-0 justify-center" style={{ width: 95 }}>
                  <span
                    className="flex items-center justify-center font-black text-white"
                    style={{
                      width: 42 * rowScale,
                      height: badgeSize,
                      borderRadius: LAYOUT.tagRadius,
                      background: color.from,
                      fontSize: 19 * rowScale,
                    }}
                  >
                    {match.league}
                  </span>
                </div>
                <div className="flex shrink-0 justify-center" style={{ width: 74 }}>
                  <span
                    className="flex items-center justify-center rounded-full font-black"
                    style={{
                      width: badgeSize,
                      height: badgeSize,
                      border: `${Math.max(1, 2 * rowScale)}px solid ${NAVY_TOP}`,
                      color: NAVY_TOP,
                      fontSize: 17 * rowScale,
                    }}
                  >
                    {match.no}
                  </span>
                </div>
                <div
                  className="flex min-w-0 flex-1 items-center justify-center gap-3 font-bold text-gray-800"
                  style={{ fontSize: 21 * rowScale }}
                >
                  <span
                    className={`truncate ${match.isTokyoWaves && match.teamB === "東京WAVES" ? "font-black" : ""}`}
                    style={{ maxWidth: 260 }}
                  >
                    {match.teamA || "チームA未入力"}
                  </span>
                  <span
                    className="shrink-0 font-bold text-gray-600"
                    style={{ fontSize: 19 * rowScale }}
                  >
                    vs
                  </span>
                  <span
                    className={`truncate ${match.isTokyoWaves && match.teamA === "東京WAVES" ? "font-black" : ""}`}
                    style={{ maxWidth: 260 }}
                  >
                    {match.teamB || "チームB未入力"}
                  </span>
                  {match.isTokyoWaves && (
                    <span
                      className="shrink-0 text-yellow-500"
                      style={{ fontSize: 21 * rowScale }}
                    >
                      ★
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* 注記 */}
        <div
          className="mt-4 flex items-center gap-3 rounded-xl bg-white"
          style={{
            marginLeft: CONTENT_MARGIN,
            marginRight: CONTENT_MARGIN,
            padding: "14px 20px",
          }}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-full font-black text-white"
            style={{ width: 28, height: 28, background: "#2563eb", fontSize: 16 }}
          >
            i
          </span>
          <p className="text-gray-600" style={{ fontSize: 15, lineHeight: 1.5 }}>
            ※試合時間は予定です。進行状況により変更となる場合があります。
            <br />
            黄色は
            <span
              className="mx-1 rounded px-2 py-0.5 font-bold text-gray-900"
              style={{ background: YELLOW_HIGHLIGHT }}
            >
              東京WAVES
            </span>
            の試合です。
          </p>
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
            <div style={{ fontSize: TYPOGRAPHY.footerMain }} className="font-bold">
              📌 保存して全試合の時間確認に！
            </div>
            <div style={{ fontSize: TYPOGRAPHY.footerSub }} className="mt-1 text-gray-300">
              当日もこの投稿を見返そう！
            </div>
          </div>
        </div>
      </div>
    );
  },
);
