import { toBlob } from "html-to-image";

/**
 * DOM要素を1080x1350のPNG Blobとして描画する。
 * ダウンロード等の配信処理は含まない（lib/exportDelivery.ts が担当）。
 * この分離により、将来「連続ダウンロード」から「ZIP一括ダウンロード」へ
 * 配信方式だけを差し替えられる。
 */
export async function renderNodeToPngBlob(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  await document.fonts.ready;

  const blob = await toBlob(node, {
    width,
    height,
    pixelRatio: 1,
  });

  if (!blob) {
    throw new Error("PNGの生成に失敗しました。");
  }

  return blob;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
