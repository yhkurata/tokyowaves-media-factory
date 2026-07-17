import type { CharacterSettings, StickerCandidate } from "../types/sticker";

// 候補ごとに1回ずつChatGPTへ依頼する代わりに、複数体を1枚のシート画像として
// まとめて生成してもらうための英語プロンプトを組み立てる。すでに生成済みの
// 各候補のプラン（表情・ポーズ・背景演出など）をそのまま再利用するだけなので、
// AIは呼ばず追加費用もかからない。

function characterBlock(settings: CharacterSettings): string {
  const lines = [
    settings.characterFeatures && `Character: ${settings.characterFeatures}`,
    settings.face && `Face: ${settings.face}`,
    settings.hairStyle && `Hair: ${settings.hairStyle}`,
    settings.hat && `Hat: ${settings.hat}`,
    settings.logo && `Logo: ${settings.logo}`,
    settings.colorScheme && `Color scheme: ${settings.colorScheme}`,
    settings.artStyle && `Art style: ${settings.artStyle}`,
    settings.mustNotChange.length > 0 &&
      `Must stay identical in every cell: ${settings.mustNotChange.join("; ")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function cellBlock(candidate: StickerCandidate, index: number): string {
  const { plan } = candidate;
  const row = Math.floor(index / 4) + 1;
  const col = (index % 4) + 1;
  return `Cell ${index + 1} (row ${row}, column ${col}) — caption text "${plan.phrase}":
  Scene: ${plan.scene}
  Emotion: ${plan.emotion}
  Expression: ${plan.expression}
  Pose: ${plan.pose}
  Hand gesture: ${plan.handGesture}
  Body orientation: ${plan.bodyOrientation}
  Water polo ball: ${plan.hasBall ? "visible" : "not shown"}
  Props: ${plan.props || "none"}
  Background effect: ${plan.backgroundEffect}
  Splash: ${plan.splash}
  Effect lines: ${plan.effectLines}
  Text style: ${plan.textStyle}`;
}

export function buildSheetGenerationPrompt(
  characterSettings: CharacterSettings,
  candidates: StickerCandidate[],
): string {
  const count = candidates.length;
  const cells = candidates
    .map((candidate, i) => cellBlock(candidate, i))
    .join("\n\n");

  return `Create a single image containing a ${count}-panel grid of individual LINE sticker illustrations, arranged 4 columns wide, laid out like a reference sheet (thin border lines separating each cell, light blue background per cell). Use the exact same character design in every single cell — only the pose, expression, and text change between cells.

IMPORTANT — canvas proportions: the overall sheet image must be a SQUARE (1:1 aspect ratio), so that each individual cell also comes out approximately square once cropped. Do not make the sheet wider than it is tall — LINE stickers need roughly square cells, not wide/landscape ones.

Character design (keep identical across all ${count} cells):
${characterBlock(characterSettings)}

Each cell must be a self-contained sticker: bold black outlines, cel-shaded bright colors, the Japanese caption text rendered in bold rounded lettering with a colored outline near the bottom of each cell, matching a consistent house style across the whole sheet.

${cells}

Output one single combined image (the full grid), not separate images. Keep every cell the same size and the same overall art style so it can be cropped into individual stickers afterward. Remember: the whole sheet must be square (1:1), not landscape.`;
}
