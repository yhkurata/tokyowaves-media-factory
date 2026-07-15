// チーム名など、文字数がまちまちな名前を「…」で省略せず、できる限り1行で
// そのまま収めるためのフォントサイズ計算。Noto Sans JP Black/Boldの全角文字は
// フォントサイズのおよそ1.05倍の幅を取るため、それを基準に必要フォントサイズを逆算する。
// 収まりきらない極端に長い名前のための最小サイズは呼び出し側で指定し、
// それでも収まらない場合の保険として呼び出し側で truncate を併用すること。
const FULLWIDTH_CHAR_WIDTH_RATIO = 1.05;

export function fitNameFontSize(
  name: string,
  baseFontSize: number,
  maxWidthPx: number,
  minFontSize: number,
): number {
  if (!name) return baseFontSize;
  const estimatedWidth = name.length * baseFontSize * FULLWIDTH_CHAR_WIDTH_RATIO;
  if (estimatedWidth <= maxWidthPx) return baseFontSize;
  const fitted = maxWidthPx / (name.length * FULLWIDTH_CHAR_WIDTH_RATIO);
  return Math.max(minFontSize, fitted);
}
