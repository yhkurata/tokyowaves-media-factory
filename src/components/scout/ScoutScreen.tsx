import { useEffect, useMemo, useState } from "react";

type ScoutNote = {
  id: string;
  teamName: string;
  category: string;
  strengths: string;
  keyPlayers: string;
  tactics: string;
  watchOut: string;
  memo: string;
  updatedAt: string;
};

const STORAGE_KEY = "tokyowaves:scout-notes";

function emptyNote(): ScoutNote {
  return {
    id: crypto.randomUUID(),
    teamName: "",
    category: "",
    strengths: "",
    keyPlayers: "",
    tactics: "",
    watchOut: "",
    memo: "",
    updatedAt: new Date().toISOString(),
  };
}

function loadNotes(): ScoutNote[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const fields: { key: keyof ScoutNote; label: string; placeholder: string }[] = [
  { key: "strengths", label: "チームの特徴・強み", placeholder: "例：カウンターが速い、左サイドからの攻撃が多い" },
  { key: "keyPlayers", label: "キープレイヤー", placeholder: "例：4番 左利き。ミドルシュートに注意" },
  { key: "tactics", label: "よく使う戦術", placeholder: "例：マンツーマン中心、退水時は3-3" },
  { key: "watchOut", label: "対戦時の注意点", placeholder: "例：立ち上がりのプレスに慌てない" },
  { key: "memo", label: "その他メモ", placeholder: "試合で気づいたことや次回確認したいこと" },
];

export function ScoutScreen() {
  const [notes, setNotes] = useState<ScoutNote[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string>(() => loadNotes()[0]?.id ?? "");
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const selected = notes.find((note) => note.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return notes;
    return notes.filter((note) =>
      [note.teamName, note.category, note.strengths, note.keyPlayers, note.memo]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [notes, query]);

  const addNote = () => {
    const note = emptyNote();
    setNotes((current) => [note, ...current]);
    setSelectedId(note.id);
  };

  const update = (key: keyof ScoutNote, value: string) => {
    if (!selected) return;
    setNotes((current) =>
      current.map((note) =>
        note.id === selected.id
          ? { ...note, [key]: value, updatedAt: new Date().toISOString() }
          : note,
      ),
    );
  };

  const remove = () => {
    if (!selected || !window.confirm(`「${selected.teamName || "名称未入力"}」のメモを削除しますか？`)) return;
    const remaining = notes.filter((note) => note.id !== selected.id);
    setNotes(remaining);
    setSelectedId(remaining[0]?.id ?? "");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-emerald-600">OPPONENT DATABASE</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Scout</h1>
          <p className="mt-2 text-sm text-slate-500">対戦相手の特徴を記録して、次の試合に活かす。</p>
        </div>
        <button type="button" onClick={addNote} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
          ＋ チームを追加
        </button>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50/80 p-4 lg:border-b-0 lg:border-r">
          <label className="block">
            <span className="sr-only">チームを検索</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="チーム名・特徴で検索" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <div className="mt-4 space-y-2">
            {filtered.map((note) => (
              <button key={note.id} type="button" onClick={() => setSelectedId(note.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedId === note.id ? "border-emerald-200 bg-white shadow-sm" : "border-transparent hover:bg-white"}`}>
                <strong className="block truncate text-sm text-slate-900">{note.teamName || "名称未入力"}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500">{note.category || note.strengths || "情報を入力してください"}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-400">該当するチームがありません</p>}
          </div>
        </aside>

        <section className="p-5 sm:p-8">
          {!selected ? (
            <div className="grid h-full min-h-96 place-items-center text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-2xl">⌕</div>
                <h2 className="mt-5 text-lg font-bold text-slate-800">相手チームを記録しましょう</h2>
                <p className="mt-2 text-sm text-slate-500">「チームを追加」から最初のメモを作成できます。</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-600">チーム名</span>
                  <input value={selected.teamName} onChange={(event) => update("teamName", event.target.value)} placeholder="例：○○水球クラブ" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-600">カテゴリ・大会</span>
                  <input value={selected.category} onChange={(event) => update("category", event.target.value)} placeholder="例：U15 / 夏季大会" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {fields.map((field, index) => (
                  <label key={field.key} className={index === fields.length - 1 ? "sm:col-span-2" : ""}>
                    <span className="mb-2 block text-xs font-bold text-slate-600">{field.label}</span>
                    <textarea value={selected[field.key]} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} rows={index === fields.length - 1 ? 4 : 3} className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="text-xs text-slate-400">入力内容はこの端末に自動保存されます</span>
                <button type="button" onClick={remove} className="text-xs font-bold text-red-500 hover:text-red-700">このメモを削除</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
