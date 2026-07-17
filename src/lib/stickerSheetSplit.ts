// ChatGPT等で「16体を1枚にまとめて生成」したシート画像を、格子状に分割して
// 個別のスタンプ画像に切り出す。
//
// AIが生成したシートは、テンプレートのように正確に4等分されているとは限らず、
// 行・列の境界が微妙にズレていることがある。単純に画像を4等分するだけでは
// 隣り合うセルの内容が混ざって切り出されてしまうため、実際の区切り線
// （キャラクターの太い黒縁取りが存在しない、明るい帯）を画像から検出し、
// その位置を境界として使う。検出できなかった場合のみ、均等4等分にフォールバックする。

const GRID_ROWS = 4;
const GRID_COLS = 4;
// 検出した区切り線の内側をわずかに削って切り出す（線そのものの写り込み防止）。
const EDGE_INSET_RATIO = 0.015;
// これより暗い画素があれば、そのライン（行/列）はキャラクターの縁取りなどを
// 含む「セルの中身」であり、区切り線ではないと判定する。
const DARK_THRESHOLD = 90;
// 画像のごく外周に近い検出は、シート全体の外枠であって内部の区切り線ではないとみなし除外する。
const EDGE_MARGIN_RATIO = 0.02;
// セル内でキャラクター/文字とみなす色の差分しきい値（背景色との合計RGB差）。
const CONTENT_DIFF_THRESHOLD = 28;
// キャラクター/文字の重心をセル中央に寄せる際、動かしてよい最大量（セル幅に対する比率）。
// 大きくしすぎると隣のセルの内容まで切り出してしまうため小さめに制限する。
const MAX_CENTER_SHIFT_RATIO = 0.06;
// 背景色をサンプリングする位置（セルの角そのものは縁取り線でアンチエイリアスがかかるため少し内側から取る）。
const BG_SAMPLE_INSET = 3;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    img.src = dataUrl;
  });
}

function brightnessAt(data: Uint8ClampedArray, idx: number): number {
  return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
}

// 各行について、その行に含まれる画素の最小輝度を求める（暗い画素が
// 1つでもあればすぐ打ち切る早期終了つき）。列方向も同じロジックで求める。
function computeRowMinBrightness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number[] {
  const result: number[] = new Array(height);
  for (let y = 0; y < height; y++) {
    let min = 255;
    for (let x = 0; x < width; x++) {
      const b = brightnessAt(data, (y * width + x) * 4);
      if (b < min) min = b;
      if (min <= DARK_THRESHOLD) break;
    }
    result[y] = min;
  }
  return result;
}

function computeColMinBrightness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number[] {
  const result: number[] = new Array(width);
  for (let x = 0; x < width; x++) {
    let min = 255;
    for (let y = 0; y < height; y++) {
      const b = brightnessAt(data, (y * width + x) * 4);
      if (b < min) min = b;
      if (min <= DARK_THRESHOLD) break;
    }
    result[x] = min;
  }
  return result;
}

// 「暗い画素を含まない」行/列が連続する帯（区切り線の候補）を探し、
// 期待する本数（4分割なら内部の区切りは3本）だけ見つかった場合にその
// 中心座標を返す。見つからなければnull（呼び出し側で均等分割にフォールバック）。
function findDividerPositions(
  minBrightness: number[],
  length: number,
  expectedCount: number,
): number[] | null {
  const bands: { start: number; end: number }[] = [];
  let bandStart: number | null = null;
  for (let i = 0; i < length; i++) {
    const isBright = minBrightness[i] > DARK_THRESHOLD;
    if (isBright && bandStart === null) {
      bandStart = i;
    } else if (!isBright && bandStart !== null) {
      bands.push({ start: bandStart, end: i - 1 });
      bandStart = null;
    }
  }
  if (bandStart !== null) bands.push({ start: bandStart, end: length - 1 });

  const margin = length * EDGE_MARGIN_RATIO;
  const centers = bands
    .filter((b) => b.start > margin && b.end < length - margin)
    .map((b) => (b.start + b.end) / 2);

  return centers.length === expectedCount ? centers : null;
}

function evenBounds(length: number, count: number): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (length / count) * i);
}

function colorAt(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): [number, number, number] {
  const idx = (Math.round(y) * width + Math.round(x)) * 4;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

// セル内で背景色と異なる画素(=キャラクターや文字)が水平方向にどこまで
// 広がっているかを調べ、その水平方向の重心(中心)を返す。セルが背景色
// 一色しか含まない場合はnullを返す。
function findContentCenterX(
  data: Uint8ClampedArray,
  sheetWidth: number,
  left: number,
  right: number,
  top: number,
  bottom: number,
): number | null {
  const bg = colorAt(
    data,
    sheetWidth,
    left + BG_SAMPLE_INSET,
    top + BG_SAMPLE_INSET,
  );
  let minX: number | null = null;
  let maxX: number | null = null;
  const xStart = Math.round(left);
  const xEnd = Math.round(right);
  const yStart = Math.round(top);
  const yEnd = Math.round(bottom);
  for (let x = xStart; x < xEnd; x++) {
    let hasContent = false;
    for (let y = yStart; y < yEnd; y += 2) {
      if (colorDistance(colorAt(data, sheetWidth, x, y), bg) > CONTENT_DIFF_THRESHOLD) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      if (minX === null) minX = x;
      maxX = x;
    }
  }
  if (minX === null || maxX === null) return null;
  return (minX + maxX) / 2;
}

export async function splitStickerSheet(
  sheetDataUrl: string,
): Promise<string[]> {
  const img = await loadImage(sheetDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像分割用のCanvasを初期化できませんでした。");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);

  const rowMin = computeRowMinBrightness(data, img.width, img.height);
  const colMin = computeColMinBrightness(data, img.width, img.height);

  const rowDividers = findDividerPositions(rowMin, img.height, GRID_ROWS - 1);
  const colDividers = findDividerPositions(colMin, img.width, GRID_COLS - 1);

  const rowBounds = rowDividers
    ? [0, ...rowDividers, img.height]
    : evenBounds(img.height, GRID_ROWS);
  const colBounds = colDividers
    ? [0, ...colDividers, img.width]
    : evenBounds(img.width, GRID_COLS);

  const results: string[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const top = rowBounds[row];
      const bottom = rowBounds[row + 1];
      let left = colBounds[col];
      let right = colBounds[col + 1];

      // キャラクター/文字がセル内で左右どちらかに寄っている場合、その重心が
      // セル中央に来るよう切り出し窓を水平方向にずらす(拡大・縮小はしない)。
      const contentCenterX = findContentCenterX(data, img.width, left, right, top, bottom);
      if (contentCenterX !== null) {
        const cellWidth = right - left;
        const cellCenterX = (left + right) / 2;
        let shift = cellCenterX - contentCenterX;
        const maxShift = cellWidth * MAX_CENTER_SHIFT_RATIO;
        shift = Math.max(-maxShift, Math.min(maxShift, shift));
        shift = Math.min(shift, left);
        shift = Math.max(shift, right - img.width);
        left -= shift;
        right -= shift;
      }

      const insetX = (right - left) * EDGE_INSET_RATIO;
      const insetY = (bottom - top) * EDGE_INSET_RATIO;
      const sx = left + insetX;
      const sy = top + insetY;
      const sw = right - left - insetX * 2;
      const sh = bottom - top - insetY * 2;

      const cellCanvas = document.createElement("canvas");
      cellCanvas.width = Math.max(1, Math.round(sw));
      cellCanvas.height = Math.max(1, Math.round(sh));
      const cellCtx = cellCanvas.getContext("2d");
      if (!cellCtx) throw new Error("画像分割用のCanvasを初期化できませんでした。");
      cellCtx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        cellCanvas.width,
        cellCanvas.height,
      );
      results.push(cellCanvas.toDataURL("image/png"));
    }
  }
  return results;
}

export const STICKER_SHEET_GRID_SIZE = GRID_ROWS * GRID_COLS;
