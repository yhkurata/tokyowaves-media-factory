import { useEffect, useRef, useState } from "react";
import type { ReviewGroup, ReviewItem } from "./reviewItems";

export type ReviewItemStatus = "empty" | "unsaved" | "filled";

export interface ReviewChecklistItemView extends ReviewItem {
  status: ReviewItemStatus;
  displayValue: string;
}

export interface ReviewChecklistGroupView {
  id: string;
  groupLabel: string;
  items: ReviewChecklistItemView[];
}

export interface UseReviewChecklistResult {
  groups: ReviewChecklistGroupView[];
  pendingCount: number;
  hasUnsaved: boolean;
  setDraft: (id: string, value: string) => void;
  save: () => void;
}

// 「要確認」に一度でも上がった項目は、後から埋まっても表示し続けるための
// IDセット。大量入力（100件以上）の途中で行が消えたり並びが変わったりすると
// Tab移動や見直しの妨げになるため、このセットは増える一方で自動的には減らさない
// （試合や会場そのものが削除された場合は、対応する項目がbuildReviewItemsから
// 生成されなくなるだけで、IDが残っても実害はない）。
export function useReviewChecklist(allGroups: ReviewGroup[]): UseReviewChecklistResult {
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    allGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.isEmpty) initial.add(item.id);
      }),
    );
    return initial;
  });

  // 「保存」ボタンを押すまでグローバル状態に反映しない下書き値。
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const latestGroupsRef = useRef(allGroups);
  latestGroupsRef.current = allGroups;

  useEffect(() => {
    setFlaggedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      allGroups.forEach((group) =>
        group.items.forEach((item) => {
          if (item.isEmpty && !next.has(item.id)) {
            next.add(item.id);
            changed = true;
          }
        }),
      );
      return changed ? next : prev;
    });
  }, [allGroups]);

  const setDraft = (id: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const save = () => {
    const groups = latestGroupsRef.current;
    groups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.id in drafts) {
          item.onChange(drafts[item.id]);
        }
      }),
    );
    setDrafts({});
  };

  const groups: ReviewChecklistGroupView[] = allGroups
    .map((group) => ({
      id: group.id,
      groupLabel: group.groupLabel,
      items: group.items
        .filter((item) => flaggedIds.has(item.id))
        .map((item) => {
          const draft = drafts[item.id];
          const displayValue = draft ?? item.value;
          const status: ReviewItemStatus =
            draft !== undefined
              ? "unsaved"
              : item.value.trim() !== ""
                ? "filled"
                : "empty";
          return { ...item, displayValue, status };
        }),
    }))
    .filter((group) => group.items.length > 0);

  const pendingCount = groups.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => item.displayValue.trim() === "").length,
    0,
  );
  const hasUnsaved = Object.keys(drafts).length > 0;

  return { groups, pendingCount, hasUnsaved, setDraft, save };
}
