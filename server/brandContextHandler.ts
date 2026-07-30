import { eq } from "drizzle-orm";
import { getDb } from "./db/client.js";
import { brandContext } from "./db/schema.js";

// TokyoWAVES全体のブランド・運用方針を保持する単一レコード。Instagram AI
// （投稿提案）専用ではなく、AIに文章を書かせる他のツール（将来の練習案内AI等）
// からも同じ「運用ガイド」を参照できるよう、Instagram固有の命名は避けている。
// contentRatioTargets/kpiMetricsはInstagram投稿比率に寄った構造化フィールドだが、
// operatingGuide（自由記述のMarkdown全文）は完全に汎用。
export interface BrandContextPayload {
  operatingGuide: string;
  brandColors: string[];
  contentRatioTargets: { category: string; targetPercent: number }[];
  kpiMetrics: string[];
}

const DEFAULT_ID = "default";

// レコードがまだ無ければ空の初期状態を作って返す（初回アクセス時に画面②が
// 常に表示できるようにするため）。
export async function getBrandContext() {
  const db = getDb();
  const rows = await db
    .select()
    .from(brandContext)
    .where(eq(brandContext.id, DEFAULT_ID));
  if (rows.length > 0) return rows[0];

  const [created] = await db
    .insert(brandContext)
    .values({ id: DEFAULT_ID })
    .returning();
  return created;
}

export async function updateBrandContext(payload: BrandContextPayload) {
  const [updated] = await getDb()
    .insert(brandContext)
    .values({ id: DEFAULT_ID, ...payload, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: brandContext.id,
      set: { ...payload, updatedAt: new Date() },
    })
    .returning();
  return updated;
}
