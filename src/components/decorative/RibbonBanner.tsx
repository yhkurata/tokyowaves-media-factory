import type { ReactNode } from "react";
import { YELLOW_LIGHT, YELLOW_DARK, SHADOWS } from "../preview/theme";

type Props = {
  children: ReactNode;
  padding?: string;
};

export function RibbonBanner({ children, padding = "26px 64px" }: Props) {
  return (
    <div style={{ filter: SHADOWS.ribbon }} className="w-full">
      <div
        style={{
          background: `linear-gradient(180deg, ${YELLOW_LIGHT}, ${YELLOW_DARK})`,
          clipPath:
            "polygon(0% 50%, 1.5% 12%, 3% 0%, 20% 2.5%, 42% 0%, 58% 3%, 80% 0%, 97% 2%, 100% 50%, 98.5% 88%, 97% 100%, 78% 97%, 55% 100%, 38% 97.5%, 18% 100%, 3% 97%)",
          padding,
        }}
        className="flex w-full items-center justify-center text-center"
      >
        {children}
      </div>
    </div>
  );
}
