// File/Blob ⇔ base64 dataURL の相互変換。
// スタンプ機能はDBを持たず、画像はプロジェクトJSONにdataURLとして埋め込むため、
// アップロード直後にdataURL化してしまうのがもっとも単純。

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("画像の読み込みに失敗しました。"));
    reader.readAsDataURL(file);
  });
}

export function dataUrlMediaType(dataUrl: string): string {
  const match = /^data:([^;]+);/.exec(dataUrl);
  return match ? match[1] : "application/octet-stream";
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mediaType = /^data:([^;]+);/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mediaType });
}
