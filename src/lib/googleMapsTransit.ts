// 「立川駅→会場」の乗換案内をワンタップで調べるためのリンクを組み立てる。
// Googleマップの公式URL形式（https://developers.google.com/maps/documentation/urls）
// を使うだけで、APIキーや課金は不要。実際の検索・結果表示はGoogleマップ側が行う。
const DEFAULT_ORIGIN = "立川駅";

export function buildTransitDirectionsUrl(
  venue: string,
  origin: string = DEFAULT_ORIGIN,
): string | null {
  const destination = venue
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "");
  if (!destination) return null;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
