import {
  type StickerProjectData,
  type StickerSnapshot,
} from "../types/sticker";

// 大会プロジェクト（projectFile.ts）と同じ考え方：画像はbase64で埋め込んだ
// JSONファイルとして保存・読込する。DBは持たない。

export function buildStickerProjectData(
  snapshot: StickerSnapshot,
): StickerProjectData {
  return {
    formatVersion: 1,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };
}

export function serializeStickerProjectData(data: StickerProjectData): string {
  return JSON.stringify(data, null, 2);
}

export class StickerProjectFileParseError extends Error {}

export function parseStickerProjectData(text: string): StickerProjectData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new StickerProjectFileParseError(
      "JSONとして読み込めませんでした。ファイルが壊れている可能性があります。",
    );
  }

  if (typeof raw !== "object" || raw === null) {
    throw new StickerProjectFileParseError(
      "スタンプ制作ファイルの形式が不正です。",
    );
  }
  const obj = raw as Record<string, unknown>;

  if (obj.formatVersion !== 1) {
    throw new StickerProjectFileParseError(
      "対応していない形式のファイルです（formatVersionが不明）。",
    );
  }
  if (
    typeof obj.characterSettings !== "object" ||
    !Array.isArray(obj.library) ||
    !Array.isArray(obj.batches) ||
    !Array.isArray(obj.candidates)
  ) {
    throw new StickerProjectFileParseError(
      "スタンプ制作ファイルの内容が不足しています。",
    );
  }

  return obj as unknown as StickerProjectData;
}

export function stickerProjectFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `LINEスタンプ制作_${date}.json`;
}
