import {
  createEmptyExpeditionGuideInput,
  type ExpeditionGuideInput,
} from "../types/expeditionGuide";
import type { ExpeditionGuideTemplate } from "../types/expeditionGuideTemplate";

const STORAGE_KEY = "tokyowaves-media-factory:expedition-guide-templates";

// 初回利用時、保存済みテンプレートが無ければこの2件から選べるようにする。
// ユーザーが実際に共有してくれた遠征案内2件をそのまま取り込んだもの。
// 期日はその都度変わるため空欄にしてある（他は実物どおり）。
function buildSeedTemplates(): ExpeditionGuideTemplate[] {
  const base = createEmptyExpeditionGuideInput();
  const now = new Date(0).toISOString();

  return [
    {
      id: "seed-omiya-park",
      name: "大宮公園遠征",
      updatedAt: now,
      input: {
        ...base,
        tournamentName: "大宮公園遠征",
        schedule: "",
        meetingPlace: "現地集合　11時（プール入口門前）",
        meetingTime: "11:00",
        targetGroup: "中学生男子",
        leaders: "小学生：窪田　中学生：岡本",
        practiceTime: "11:30〜14:00",
        departureTime: "",
        dismissalTime: "現地解散　14時30分",
        venue:
          "大宮公園水泳場\n埼玉県さいたま市大宮区高鼻町4丁目\n最寄駅：東部アーバンパークライン　大宮公園駅",
        accommodation: "",
        fee: "1,000円\n（内訳）スタッフ費用・雑費等",
        extraItems:
          "水着・セーム（タオル）・ゴーグル・キャップ（試合帽子　白×１　青×１）・ボール×１・スイミングキャップ・ジャージ（プールサイド用）・補食（練習前等）",
        lunch: "早めに昼食を済ませてきてください（練習前に済ませる）",
        notes:
          "◎乗り換えをスムーズに行えるようにSuicaの用意をお願いいたします。\n◎移動時は必ず運動靴を履いてください。\n・エス水球クラブと練習を行います。\n・参加費は集合時に集めます。\n・保護者の観覧有り。（観覧席有りますが、日陰ありません。）\n・駐車場：公園駐車場に駐車可能\n・ご不明な点はお気軽に連絡ください。\n・前日までに参加の有無の入力をスプレッドシートまでお願いいたします。\n※解散時間が変更する場合、一斉LINEで連絡をします。",
        emergencyContact: "",
      },
    },
    {
      id: "seed-saitama-sakae",
      name: "埼玉栄遠征",
      updatedAt: now,
      input: {
        ...base,
        tournamentName: "埼玉栄遠征",
        schedule: "",
        meetingPlace: "立川中央改札内　7時00分\n現地集合　8時30分（駐車場）",
        meetingTime: "7:00 / 8:30",
        targetGroup: "小学生男子・小学生女子・中学生女子",
        leaders: "小学生：窪田　中学生：岡本",
        practiceTime: "9:00〜12:00",
        departureTime: "",
        dismissalTime:
          "立川中央改札内　14時10分\n現地解散　12時30〜45分前後（駐車場）",
        venue:
          "埼玉栄中学校・高等学校\n埼玉県さいたま市西区西大宮3丁目11番地1\n最寄駅：JR川越線　西大宮駅",
        accommodation: "",
        fee: "1,000円\n（内訳）スタッフ費用・雑費等",
        extraItems:
          "水着・セーム（タオル）・ゴーグル・キャップ（試合帽子　白×１　青×１）・ボール×１・スイミングキャップ・ジャージ（プールサイド用）・補食（必要な人のみ）",
        lunch: "中庭で食べる予定",
        notes:
          "◎乗り換えをスムーズに行えるようにSuicaの用意をお願いいたします。\n◎移動時は必ず運動靴を履いてください。\n・現地集合で車の方は、埼玉栄高校駐車場で待機してください。\n・エス水球クラブと練習を行います。\n・参加費は集合時に集めます。\n・保護者の観覧有り。（指導者室より、入室をお願いします）\n・駐車場：埼玉栄駐車場に駐車可能\n・ご不明な点はお気軽に連絡ください。\n・前日までに参加の有無の入力をスプレッドシートまでお願いいたします。\n※解散時間が変更する場合、一斉LINEで連絡をします。",
        emergencyContact: "",
      },
    },
  ];
}

function loadRawTemplates(): ExpeditionGuideTemplate[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExpeditionGuideTemplate[]) : null;
  } catch {
    return null;
  }
}

function saveRawTemplates(templates: ExpeditionGuideTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // localStorageが使えない環境（プライベートブラウズ等）では黙って諦める
  }
}

export function loadExpeditionGuideTemplates(): ExpeditionGuideTemplate[] {
  return loadRawTemplates() ?? buildSeedTemplates();
}

export function saveExpeditionGuideTemplate(
  name: string,
  input: ExpeditionGuideInput,
): ExpeditionGuideTemplate[] {
  const trimmedName = name.trim();
  const current = loadExpeditionGuideTemplates();
  const withoutSameName = current.filter((t) => t.name !== trimmedName);
  const next: ExpeditionGuideTemplate[] = [
    ...withoutSameName,
    {
      id: crypto.randomUUID(),
      name: trimmedName,
      input,
      updatedAt: new Date().toISOString(),
    },
  ];
  saveRawTemplates(next);
  return next;
}
