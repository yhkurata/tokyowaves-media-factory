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
        targetGroup: "中学生",
        leaders: "窪田・岡本",
        practicePartner: "エス水球クラブ",
        practiceTime: "11:30〜14:00",
        departureTime: "",
        dismissalTime: "現地解散　14時30分",
        venue:
          "大宮公園水泳場\n埼玉県さいたま市大宮区高鼻町4丁目\n最寄駅：東部アーバンパークライン　大宮公園駅",
        accommodation: "",
        fee: "1,000円",
        lunch: "早めに昼食を済ませてきてください（練習前に済ませる）",
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
        targetGroup: "小学生・中学生",
        leaders: "窪田・岡本",
        practicePartner: "エス水球クラブ",
        practiceTime: "9:00〜12:00",
        departureTime: "",
        dismissalTime:
          "立川中央改札内　14時10分\n現地解散　12時30〜45分前後（駐車場）",
        venue:
          "埼玉栄中学校・高等学校\n埼玉県さいたま市西区西大宮3丁目11番地1\n最寄駅：JR川越線　西大宮駅",
        accommodation: "",
        fee: "1,000円",
        lunch: "中庭で食べる予定",
        emergencyContact: "",
      },
    },
    {
      id: "seed-tsuchiura-2nd",
      name: "土浦第二高校遠征",
      updatedAt: now,
      input: {
        ...base,
        tournamentName: "土浦第二高校遠征",
        schedule: "",
        meetingPlace: "立川集合　5時55分\n現地集合　8時30分（プール前）",
        meetingTime: "5:55 / 8:30",
        targetGroup: "全員",
        leaders: "窪田・倉田",
        practicePartner: "ジョイフルAC・土浦水球クラブ・並木中等学校",
        practiceTime: "9:00〜16:00前後",
        departureTime: "",
        dismissalTime:
          "立川解散　19時20分前後\n現地解散　16時40分前後（プール前）",
        venue:
          "茨城県立土浦第二高等学校\n茨城県土浦市立田町9-6\n最寄駅：土浦駅またはバスで移動：亀城公園前",
        accommodation: "",
        fee: "1,000円",
        lunch: "保冷対策をお願いします",
        emergencyContact: "",
      },
    },
    {
      id: "seed-kofu-higashi",
      name: "山梨甲府東高校遠征",
      updatedAt: now,
      input: {
        ...base,
        tournamentName: "山梨甲府東高校遠征",
        schedule: "",
        meetingPlace: "立川中央改札内　6時25分\n現地集合　8時50分（正門前）",
        meetingTime: "6:25 / 8:50",
        targetGroup: "全員",
        leaders: "窪田",
        practicePartner: "山梨水球倶楽部・川口SC",
        practiceTime: "9:00〜16:00",
        departureTime: "",
        dismissalTime: "立川中央改札内　19時00分\n現地解散　16時40分（正門前）",
        venue: "山梨県立甲府東高等学校\n山梨県甲府市酒折1-17-1",
        accommodation: "",
        fee: "1,000円",
        lunch: "保冷対策をお願いします",
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

// 初回だけシードテンプレート（大宮公園遠征・埼玉栄遠征）をlocalStorageに書き込み、
// 以降は他のテンプレートと同じように編集・削除できる1つの配列として扱う
// （テンプレートの管理はユーザー自身が行っていく前提のため、コード側での
// 自動的な内容更新は行わない）。
export function loadExpeditionGuideTemplates(): ExpeditionGuideTemplate[] {
  const saved = loadRawTemplates();
  if (saved) return saved;
  const seeds = buildSeedTemplates();
  saveRawTemplates(seeds);
  return seeds;
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

export function updateExpeditionGuideTemplate(
  id: string,
  input: ExpeditionGuideInput,
): ExpeditionGuideTemplate[] {
  const current = loadExpeditionGuideTemplates();
  const next = current.map((t) =>
    t.id === id ? { ...t, input, updatedAt: new Date().toISOString() } : t,
  );
  saveRawTemplates(next);
  return next;
}

export function deleteExpeditionGuideTemplate(
  id: string,
): ExpeditionGuideTemplate[] {
  const current = loadExpeditionGuideTemplates();
  const next = current.filter((t) => t.id !== id);
  saveRawTemplates(next);
  return next;
}
