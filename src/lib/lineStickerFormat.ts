// LINEスタンプの入稿仕様（公式ガイドライン）：
// ・スタンプ画像は 370×320px 以内
// ・PNG形式・背景透過
// ・縦横とも偶数ピクセル
// Ver1では通常のスタンプ画像1パターンのみ対応する（メイン画像・タブ画像は対象外）。

export const LINE_STICKER_MAX_WIDTH = 370;
export const LINE_STICKER_MAX_HEIGHT = 320;

function toEven(n: number): number {
  const rounded = Math.round(n);
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    img.src = dataUrl;
  });
}

// アスペクト比を保ったまま370x320以内に収まるサイズへ縮小し、
// 透過PNGとして書き出す。拡大はしない（原寸が枠より小さい場合はそのまま）。
export async function convertToLineStickerFormat(
  sourceDataUrl: string,
): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const scale = Math.min(
    1,
    LINE_STICKER_MAX_WIDTH / img.width,
    LINE_STICKER_MAX_HEIGHT / img.height,
  );
  const width = Math.max(2, toEven(img.width * scale));
  const height = Math.max(2, toEven(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像変換用のCanvasを初期化できませんでした。");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/png");
}
