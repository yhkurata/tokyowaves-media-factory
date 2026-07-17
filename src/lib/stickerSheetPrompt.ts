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

IMPORTANT — canvas proportions: LINE's official sticker format is 370×320px — a width:height ratio of about 37:32, slightly wider than it is tall (NOT a perfect square, and NOT a tall portrait shape). Generate the overall sheet at this same ratio (about 37:32) so each cropped cell comes out already close to LINE's real proportions.

IMPORTANT — resolution: render the sheet at the highest resolution you support, at least 2000×1730 pixels (keeping the 37:32 ratio above). Each individual cell will be cropped out afterward, so a low-resolution sheet directly produces blurry, low-quality individual stickers — do not downscale or compress the output.

IMPORTANT — character composition (this is the most common mistake, follow it strictly): even though the CELL is a bit wider than tall, the CHARACTER'S OWN DRAWING inside it must NOT be landscape-shaped. Ignore the cell's outer rectangle when posing the character — draw the character itself upright and vertically composed (standing, sitting, or kneeling), so the character's own silhouette (measured from its own top to its own bottom vs. its own left to its own right, not the cell edges) is taller than it is wide. Do NOT draw the character lying down, stretched out sideways, or with a wide horizontal pose (e.g. arms flung far out to both sides) just because the cell itself is a bit wide — instead, center the upright character in the cell and leave extra background space at the left and right sides rather than stretching the pose to fill the width.

Character design (keep identical across all ${count} cells):
${characterBlock(characterSettings)}

Each cell must be a self-contained sticker: bold black outlines, cel-shaded bright colors, the Japanese caption text rendered in bold rounded lettering with a colored outline near the bottom of each cell, matching a consistent house style across the whole sheet.

${cells}

Output one single combined image (the full grid), not separate images. Keep every cell the same size and the same overall art style so it can be cropped into individual stickers afterward. Remember: the overall sheet is about 37:32 (slightly wide), but each character's own pose/silhouette must still be upright and taller than it is wide — do not stretch the character sideways to match the cell's width.`;
}
