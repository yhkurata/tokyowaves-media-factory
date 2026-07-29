import { forwardRef } from "react";
import type { Tournament } from "../../types/tournament";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { getDateRangeLabel, getVenueSummaryLabel } from "../../lib/tournamentSchedule";
import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";
import { OceanBackground } from "../decorative/OceanBackground";
import { WaterPoloBallIcon } from "../decorative/WaterPoloBallIcon";
import {
  backgroundStyleFor,
  TITLE_COLOR,
  HEADER_TEXT_COLOR,
  SHADOWS,
  type Theme,
} from "./theme";

type Props = {
  tournament: Tournament;
  theme?: Theme;
};

// 東京WAVESが独自に作成した資料である旨・内容変更の可能性がある旨を、
// 表紙に固定の注記として必ず表示する（大会主催者発行物と誤解されないため）。
const DISCLAIMER_TEXT =
  "※本資料は、東京WAVESが独自に作成したものです。内容に誤りや変更がある可能性がございますので、あくまで参考としてご覧ください。";

export const PostImageTemplate = forwardRef<HTMLDivElement, Props>(
  function PostImageTemplate({ tournament, theme = "standard" }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          background: backgroundStyleFor(theme),
          fontFamily: '"Noto Sans JP", sans-serif',
        }}
        className="relative flex flex-col overflow-hidden"
      >
        {theme === "standard" && <OceanBackground />}
        {/* ウォーターテーマの背景画像には既に右下にウォーターポロボールが
            描き込まれているため、標準テーマのみ簡易アイコンで代替する。 */}
        {theme === "standard" && (
          <div
            className="pointer-events-none absolute"
            style={{ right: 30, bottom: 240, width: 220, height: 220, opacity: 0.5 }}
          >
            <WaterPoloBallIcon className="h-full w-full" />
          </div>
        )}

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-20 text-center">
          <div style={{ color: TITLE_COLOR[theme] }}>
            <TokyoWavesLogo scale={2.4} />
          </div>

          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.25,
              color: TITLE_COLOR[theme],
              textShadow:
                theme === "standard" ? "0 6px 18px rgba(0,0,0,0.25)" : "none",
            }}
          >
            {tournament.name || "大会名未入力"}
          </h1>

          <div
            className="flex flex-col items-center gap-3"
            style={{ color: HEADER_TEXT_COLOR[theme] }}
          >
            <p style={{ fontSize: 48, fontWeight: 900 }}>
              {getDateRangeLabel(tournament.days)}
            </p>
            <p style={{ fontSize: 30, fontWeight: 700 }}>
              {getVenueSummaryLabel(tournament.days)}
            </p>
          </div>
        </div>

        <div
          className="relative z-10 mx-auto mb-16 flex items-start gap-3 rounded-xl bg-white"
          style={{
            width: IMAGE_WIDTH - 120,
            padding: "20px 26px",
            boxShadow: SHADOWS.card,
          }}
        >
          <span
            className="mt-0.5 flex shrink-0 items-center justify-center rounded-full font-black text-white"
            style={{ width: 30, height: 30, background: "#2563eb", fontSize: 17 }}
          >
            i
          </span>
          <p className="text-left text-gray-600" style={{ fontSize: 17, lineHeight: 1.6 }}>
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </div>
    );
  },
);
