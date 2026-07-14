type Props = {
  className?: string;
  markOnly?: boolean;
  scale?: number;
};

const WAVE_PATH = "M20,18 L155,118 L290,18 L425,118";

export function TokyoWavesLogo({
  className,
  markOnly = false,
  scale = 1,
}: Props) {
  const baseWidth = markOnly ? 40 : 56;
  const baseHeight = markOnly ? 30 : 43;

  return (
    <div className={className} style={{ color: "inherit" }}>
      <svg
        viewBox="0 0 445 340"
        width={baseWidth * scale}
        height={baseHeight * scale}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={WAVE_PATH}
          stroke="currentColor"
          strokeWidth="42"
          strokeLinejoin="miter"
          strokeLinecap="butt"
          transform="translate(0, 0)"
        />
        <path
          d={WAVE_PATH}
          stroke="currentColor"
          strokeWidth="42"
          strokeLinejoin="miter"
          strokeLinecap="butt"
          transform="translate(0, 100)"
        />
        <path
          d={WAVE_PATH}
          stroke="currentColor"
          strokeWidth="42"
          strokeLinejoin="miter"
          strokeLinecap="butt"
          transform="translate(0, 200)"
        />
      </svg>
      {!markOnly && (
        <div style={{ marginTop: 8 * scale, lineHeight: 1 }}>
          <span
            style={{
              fontFamily: '"Noto Sans JP", sans-serif',
              fontWeight: 900,
              fontSize: 20 * scale,
              letterSpacing: 1,
            }}
          >
            TOKYO WAVES
          </span>
        </div>
      )}
    </div>
  );
}
