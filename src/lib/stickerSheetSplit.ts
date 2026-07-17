// ChatGPT等で「16体を1枚にまとめて生成」したシート画像を、格子状に均等分割して
// 個別のスタンプ画像に切り出す。見た目での判断が不要な機械的な処理のため、
// AIは使わずCanvasで座標計算するだけ（追加費用なし）。

const GRID_ROWS = 4;
const GRID_COLS = 4;
// セル境界の区切り線を巻き込まないよう、各セルの内側を少しだけ削って切り出す。
const EDGE_INSET_RATIO = 0.01;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    img.src = dataUrl;
  });
}

export async function splitStickerSheet(
  sheetDataUrl: string,
): Promise<string[]> {
  const img = await loadImage(sheetDataUrl);
  const cellWidth = img.width / GRID_COLS;
  const cellHeight = img.height / GRID_ROWS;
  const insetX = cellWidth * EDGE_INSET_RATIO;
  const insetY = cellHeight * EDGE_INSET_RATIO;

  const results: string[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const sx = col * cellWidth + insetX;
      const sy = row * cellHeight + insetY;
      const sw = cellWidth - insetX * 2;
      const sh = cellHeight - insetY * 2;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("画像分割用のCanvasを初期化できませんでした。");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      results.push(canvas.toDataURL("image/png"));
    }
  }
  return results;
}

export const STICKER_SHEET_GRID_SIZE = GRID_ROWS * GRID_COLS;
