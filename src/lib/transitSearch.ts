// 「立川→会場」の乗換案内をワンタップで調べるためのリンクを組み立てる。
// Yahoo!路線情報の検索結果ページはfrom/toクエリパラメータで直接開けるため、
// APIキーや課金・スクレイピングなしでリンクだけ生成する
// （ジョルダンは同等の無料直リンク形式が無く、公式オープンAPIは有償のため採用していない）。
const DEFAULT_ORIGIN = "立川";

export function buildTransitSearchUrl(
  venue: string,
  origin: string = DEFAULT_ORIGIN,
): string | null {
  const destination = venue
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "");
  if (!destination) return null;

  const params = new URLSearchParams({ from: origin, to: destination });
  return `https://transit.yahoo.co.jp/search/result?${params.toString()}`;
}
