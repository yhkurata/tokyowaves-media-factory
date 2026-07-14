import type { ReactNode } from "react";
import { YELLOW_LIGHT, YELLOW_DARK, TEXT_ON_YELLOW } from "../preview/theme";

type Props = {
  children: ReactNode;
};

export function BookmarkBadge({ children }: Props) {
  return (
    <div style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.4))" }}>
      <div
        style={{
          background: `linear-gradient(180deg, ${YELLOW_LIGHT}, ${YELLOW_DARK})`,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)",
          padding: "14px 28px 24px",
          color: TEXT_ON_YELLOW,
        }}
        className="text-[22px] font-black leading-none whitespace-nowrap"
      >
        {children}
      </div>
    </div>
  );
}
