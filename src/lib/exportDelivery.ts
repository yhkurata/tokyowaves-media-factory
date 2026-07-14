import JSZip from "jszip";
import { triggerBlobDownload } from "./exportImage";

export interface ExportedFile {
  filename: string;
  blob: Blob;
}

export type DeliveryProgress = (filename: string, index: number, total: number) => void;

/**
 * 配信方式の抽象。呼び出し側（ExportStep）はレンダリング済みBlobの配列を
 * 渡すだけで、配信方式の詳細（連続ダウンロード or ZIP）を意識しない構造にしてある。
 */
export async function deliverSequentialDownloads(
  files: ExportedFile[],
  onProgress?: DeliveryProgress,
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(file.filename, i, files.length);
    triggerBlobDownload(file.blob, file.filename);
    // ブラウザの連続ダウンロードブロックを避けるための間隔
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

/** 全ファイルを1つのZIPにまとめて、1回のダウンロードで配信する。 */
export async function deliverAsZip(
  files: ExportedFile[],
  zipFilename: string,
  onProgress?: DeliveryProgress,
): Promise<void> {
  const zip = new JSZip();
  files.forEach((file, i) => {
    onProgress?.(file.filename, i, files.length);
    zip.file(file.filename, file.blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(zipBlob, zipFilename);
}
