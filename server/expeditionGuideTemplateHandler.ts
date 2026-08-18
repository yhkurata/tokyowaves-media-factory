import { asc, eq } from "drizzle-orm";
import { getDb } from "./db/client.js";
import { expeditionGuideTemplates } from "./db/schema.js";
import { createEmptyExpeditionGuideInput } from "../src/types/expeditionGuide.js";
import type { ExpeditionGuideInput } from "../src/types/expeditionGuide.js";

// 遠征要項AIの「まるごとテンプレート」機能。チーム全員（監督・部長等）で
// 積み上げていく共有データにするため、localStorageではなく他機能と同じ
// Neon DBに保存する。ログイン機構が無いため、誰でも読み書きできる
// 共有テーブルとして扱う。

export interface CreateExpeditionGuideTemplatePayload {
  name: string;
  input: ExpeditionGuideInput;
}

function createId() {
  return crypto.randomUUID();
}

// 初回利用時、保存済みテンプレートが1件も無ければこの4件から選べるようにする。
// ユーザーが実際に共有してくれた遠征案内をそのまま取り込んだもの。
// 期日・練習時間はその都度変わるため空欄にしてある（他は実物どおり）。
function buildSeedTemplates(): { name: string; input: ExpeditionGuideInput }[] {
  const base = createEmptyExpeditionGuideInput();

  return [
    {
      name: "大宮公園遠征",
      input: {
        ...base,
        tournamentName: "大宮公園遠征",
        leaders: "窪田・岡本",
        schedule: "",
        venue:
          "大宮公園水泳場\n埼玉県さいたま市大宮区高鼻町4丁目\n最寄駅：東部アーバンパークライン　大宮公園駅",
        targetGroup: "中学生",
        practiceTime: "11:30〜14:00",
        practicePartner: "エス水球クラブ",
        meeting: "現地集合　11時00分（プール入口門前）",
        dismissal: "現地解散　14時30分（プール入口門前）",
        fee: "1,000円",
      },
    },
    {
      name: "埼玉栄遠征",
      input: {
        ...base,
        tournamentName: "埼玉栄遠征",
        leaders: "窪田・岡本",
        schedule: "",
        venue:
          "埼玉栄中学校・高等学校\n埼玉県さいたま市西区西大宮3丁目11番地1\n最寄駅：JR川越線　西大宮駅",
        targetGroup: "小学生・中学生",
        practiceTime: "9:00〜12:00",
        practicePartner: "エス水球クラブ",
        meeting: "立川中央改札内　7時00分\n現地集合　8時30分（駐車場）",
        dismissal: "立川中央改札内　14時10分\n現地解散　12時30〜45分前後（駐車場）",
        fee: "1,000円",
      },
    },
    {
      name: "土浦第二高校遠征",
      input: {
        ...base,
        tournamentName: "土浦第二高校遠征",
        leaders: "窪田・倉田",
        schedule: "",
        venue:
          "茨城県立土浦第二高等学校\n茨城県土浦市立田町9-6\n最寄駅：土浦駅またはバスで移動：亀城公園前",
        targetGroup: "全員",
        practiceTime: "9:00〜16:00前後",
        practicePartner: "ジョイフルAC・土浦水球クラブ・並木中等学校",
        meeting: "立川集合　5時55分\n現地集合　8時30分（プール前）",
        dismissal:
          "立川解散　19時20分前後（プール前）\n現地解散　16時40分前後（プール前）",
        fee: "1,000円",
      },
    },
    {
      name: "山梨甲府東高校遠征",
      input: {
        ...base,
        tournamentName: "山梨甲府東高校遠征",
        leaders: "窪田",
        schedule: "",
        venue: "山梨県立甲府東高等学校\n山梨県甲府市酒折1-17-1",
        targetGroup: "全員",
        practiceTime: "9:00〜16:00",
        practicePartner: "山梨水球倶楽部・川口SC",
        meeting: "立川中央改札内　6時25分\n現地集合　8時50分（正門前）",
        dismissal: "立川中央改札内　19時00分（正門前）\n現地解散　16時40分（正門前）",
        fee: "1,000円",
      },
    },
  ];
}

// 名前が重複するレコードは onConflictDoNothing で無視する（他のユーザーが
// 同時に初回アクセスして同じ処理が走っても安全なように）。既存ユーザーが
// 同名で自分の内容を保存済みの場合も、その内容を上書きしない。
async function seedIfEmpty() {
  const seeds = buildSeedTemplates();
  await getDb()
    .insert(expeditionGuideTemplates)
    .values(
      seeds.map((s) => ({
        id: createId(),
        name: s.name,
        input: s.input as unknown as Record<string, unknown>,
      })),
    )
    .onConflictDoNothing({ target: expeditionGuideTemplates.name });
}

export async function listExpeditionGuideTemplates() {
  const rows = await getDb()
    .select()
    .from(expeditionGuideTemplates)
    .orderBy(asc(expeditionGuideTemplates.name));
  if (rows.length > 0) return rows;

  await seedIfEmpty();
  return getDb()
    .select()
    .from(expeditionGuideTemplates)
    .orderBy(asc(expeditionGuideTemplates.name));
}

// 同名のテンプレートが既にあれば上書き保存する（従来のlocalStorage版の挙動を踏襲）。
export async function saveExpeditionGuideTemplate(
  payload: CreateExpeditionGuideTemplatePayload,
) {
  const [saved] = await getDb()
    .insert(expeditionGuideTemplates)
    .values({
      id: createId(),
      name: payload.name,
      input: payload.input as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: expeditionGuideTemplates.name,
      set: {
        input: payload.input as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    })
    .returning();
  return saved;
}

export async function updateExpeditionGuideTemplate(
  id: string,
  input: ExpeditionGuideInput,
) {
  const [updated] = await getDb()
    .update(expeditionGuideTemplates)
    .set({ input: input as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(expeditionGuideTemplates.id, id))
    .returning();
  if (!updated) {
    throw new Error(`expedition_guide_templates id=${id} が見つかりません。`);
  }
  return updated;
}

export async function deleteExpeditionGuideTemplate(id: string) {
  await getDb()
    .delete(expeditionGuideTemplates)
    .where(eq(expeditionGuideTemplates.id, id));
}
