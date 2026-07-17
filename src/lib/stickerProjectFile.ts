import {
  migrateLegacyStickerProjectData,
  type LegacyStickerProjectData,
  type StickerWorkspace,
  type StickerWorkspaceSnapshot,
} from "../types/sticker";

// 大会プロジェクト（projectFile.ts）と同じ考え方：画像はbase64で埋め込んだ
// JSONファイルとして保存・読込する。DBは持たない。
// Ver1.0時点の保存形式（formatVersion: 1、キャラクター1件のみ）から、
// 複数キャラクターを管理できるワークスペース形式（formatVersion: 2）へ
// 移行したため、旧ファイルも読み込めるよう変換処理を挟む。

export function buildStickerWorkspace(
  snapshot: StickerWorkspaceSnapshot,
): StickerWorkspace {
  return {
    formatVersion: 2,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };
}

export function serializeStickerWorkspace(data: StickerWorkspace): string {
  return JSON.stringify(data, null, 2);
}

export class StickerProjectFileParseError extends Error {}

function isLegacyShape(
  obj: Record<string, unknown>,
): obj is Record<string, unknown> & LegacyStickerProjectData {
  return (
    typeof obj.characterSettings === "object" &&
    obj.characterSettings !== null &&
    Array.isArray(obj.library) &&
    Array.isArray(obj.batches) &&
    Array.isArray(obj.candidates)
  );
}

function isWorkspaceShape(obj: Record<string, unknown>): boolean {
  return Array.isArray(obj.projects) && typeof obj.activeProjectId === "string";
}

export function parseStickerWorkspace(text: string): StickerWorkspace {
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

  if (obj.formatVersion === 1) {
    if (!isLegacyShape(obj)) {
      throw new StickerProjectFileParseError(
        "スタンプ制作ファイルの内容が不足しています。",
      );
    }
    return migrateLegacyStickerProjectData(obj);
  }

  if (obj.formatVersion === 2) {
    if (!isWorkspaceShape(obj)) {
      throw new StickerProjectFileParseError(
        "スタンプ制作ファイルの内容が不足しています。",
      );
    }
    return obj as unknown as StickerWorkspace;
  }

  throw new StickerProjectFileParseError(
    "対応していない形式のファイルです（formatVersionが不明）。",
  );
}

export function stickerWorkspaceFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `LINEスタンプ制作_${date}.json`;
}
