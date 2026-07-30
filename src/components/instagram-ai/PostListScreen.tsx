import { useEffect, useState } from "react";
import {
  listPostHistory,
  createPostHistoryEntry,
  updatePostHistoryEntry,
  deletePostHistoryEntry,
} from "../../lib/instagramAiApi";
import type {
  PostHistoryEntry,
  PostFormat,
  PostCategory,
  PostStatus,
  ResultMetrics,
} from "../../types/instagramAi";
import {
  POST_FORMATS,
  POST_CATEGORIES,
  POST_STATUSES,
  FORMAT_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../../types/instagramAi";
import { PostPlanDetails } from "./PostPlanDetails";

const emptyForm = {
  format: "feed" as PostFormat,
  category: "教育系" as PostCategory,
  concept: "",
  tags: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ja-JP");
}

function ResultMetricsForm({
  entry,
  onSave,
}: {
  entry: PostHistoryEntry;
  onSave: (metrics: ResultMetrics) => void;
}) {
  const [likes, setLikes] = useState(entry.resultLikes?.toString() ?? "");
  const [saves, setSaves] = useState(entry.resultSaves?.toString() ?? "");
  const [comments, setComments] = useState(entry.resultComments?.toString() ?? "");
  const [views, setViews] = useState(entry.resultViews?.toString() ?? "");
  const [memo, setMemo] = useState(entry.resultMemo ?? "");
  const [saved, setSaved] = useState(false);

  const numOrUndefined = (s: string) => (s.trim() === "" ? undefined : Number(s));

  return (
    <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
      <p className="text-xs font-bold text-green-800">投稿結果メモ（すべて任意）</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">いいね数</label>
          <input
            type="number"
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">保存数</label>
          <input
            type="number"
            value={saves}
            onChange={(e) => setSaves(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">コメント数</label>
          <input
            type="number"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">再生数</label>
          <input
            type="number"
            value={views}
            onChange={(e) => setViews(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="自由メモ"
        rows={2}
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSave({
              likes: numOrUndefined(likes),
              saves: numOrUndefined(saves),
              comments: numOrUndefined(comments),
              views: numOrUndefined(views),
              memo: memo.trim() === "" ? undefined : memo,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500"
        >
          結果を保存
        </button>
        {saved && <span className="text-xs font-semibold text-green-700">保存しました</span>}
      </div>
    </div>
  );
}

function PostRow({
  entry,
  isOpen,
  onToggle,
  onStatusChange,
  onSaveMetrics,
  onDelete,
}: {
  entry: PostHistoryEntry;
  isOpen: boolean;
  onToggle: () => void;
  onStatusChange: (status: PostStatus) => void;
  onSaveMetrics: (metrics: ResultMetrics) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              {formatDate(entry.postedAt ?? entry.proposedAt ?? entry.createdAt)}
            </span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold">
              {FORMAT_LABELS[entry.format]}
            </span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold">
              {entry.category}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-semibold ${STATUS_COLORS[entry.status]}`}
            >
              {STATUS_LABELS[entry.status]}
            </span>
            {entry.isRecommended && (
              <span className="rounded bg-blue-600 px-1.5 py-0.5 font-semibold text-white">
                AIおすすめ
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-gray-900">
            {entry.concept}
          </p>
        </div>
        <span className="shrink-0 text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">状態：</label>
            <select
              value={entry.status}
              onChange={(e) => onStatusChange(e.target.value as PostStatus)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              {POST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>

          {entry.plan ? (
            <PostPlanDetails plan={entry.plan} />
          ) : (
            <div className="text-sm text-gray-700">
              <p>{entry.captionExcerpt}</p>
              {entry.tags.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {entry.tags.join(" ")}
                </p>
              )}
            </div>
          )}

          {entry.status === "posted" && (
            <ResultMetricsForm entry={entry} onSave={onSaveMetrics} />
          )}
        </div>
      )}
    </div>
  );
}

export function PostListScreen() {
  const [entries, setEntries] = useState<PostHistoryEntry[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showBackfillForm, setShowBackfillForm] = useState(false);

  const reload = () => {
    listPostHistory()
      .then(setEntries)
      .catch((err) => setLoadError(err.message));
  };

  useEffect(reload, []);

  const handleAdd = async () => {
    if (form.concept.trim() === "") return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await createPostHistoryEntry({
        format: form.format,
        category: form.category,
        concept: form.concept,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: "backfilled",
      });
      setForm(emptyForm);
      reload();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "追加に失敗しました。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: PostStatus) => {
    await updatePostHistoryEntry(id, { status });
    reload();
  };

  const handleSaveMetrics = async (id: string, metrics: ResultMetrics) => {
    await updatePostHistoryEntry(id, { resultMetrics: metrics });
    reload();
  };

  const handleDelete = async (id: string) => {
    await deletePostHistoryEntry(id);
    reload();
  };

  if (loadError) {
    return <p className="text-sm font-semibold text-red-600">{loadError}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900">投稿一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          AIが提案したすべての候補（承認・却下・投稿済みを問わず）と、手入力した過去実績をまとめて管理します。クリックすると内容を再表示・編集できます。
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowBackfillForm(!showBackfillForm)}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        {showBackfillForm ? "▲ 過去投稿の追加を閉じる" : "▼ 過去投稿を手入力で追加する"}
      </button>

      {showBackfillForm && (
        <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={form.format}
              onChange={(e) =>
                setForm({ ...form, format: e.target.value as PostFormat })
              }
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {POST_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as PostCategory })
              }
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
            placeholder="内容の要約（例：大会結果速報 vs〇〇中学校）"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="タグ（カンマ区切り、任意）"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting || form.concept.trim() === ""}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              追加する
            </button>
            {submitError && (
              <span className="text-xs font-semibold text-red-600">
                {submitError}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries === null && (
          <p className="text-sm text-gray-400">読み込み中...</p>
        )}
        {entries?.length === 0 && (
          <p className="text-sm text-gray-400">
            まだ投稿がありません。「次の投稿を提案」タブでAIに提案してもらうか、上のフォームから過去投稿を追加してください。
          </p>
        )}
        {entries?.map((entry) => (
          <PostRow
            key={entry.id}
            entry={entry}
            isOpen={openId === entry.id}
            onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
            onStatusChange={(status) => handleStatusChange(entry.id, status)}
            onSaveMetrics={(metrics) => handleSaveMetrics(entry.id, metrics)}
            onDelete={() => handleDelete(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}
