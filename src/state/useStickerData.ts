import { useState } from "react";
import {
  createEmptyStickerCharacterProject,
  createEmptyStickerWorkspace,
  type CharacterSettings,
  type StickerBatch,
  type StickerCandidate,
  type StickerCharacterProject,
  type StickerLibraryItem,
  type StickerWorkspace,
} from "../types/sticker";

function createId() {
  return crypto.randomUUID();
}

// キャラクター設定・スタンプライブラリ・生成履歴を「プロジェクト」単位で
// 保持するワークスペースを管理するフック。Ver1のUIは常にアクティブな
// 1プロジェクト（data）だけを操作するが、内部的には複数プロジェクトを
// 保持・切り替えできる構造にしてある（将来の複数キャラクター管理に備えて）。
export function useStickerData() {
  const [workspace, setWorkspace] = useState<StickerWorkspace>(() =>
    createEmptyStickerWorkspace(),
  );

  const activeProject =
    workspace.projects.find((p) => p.id === workspace.activeProjectId) ??
    workspace.projects[0];

  const updateActiveProject = (
    updater: (project: StickerCharacterProject) => StickerCharacterProject,
  ) => {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === prev.activeProjectId
          ? { ...updater(p), updatedAt: new Date().toISOString() }
          : p,
      ),
    }));
  };

  const loadWorkspace = (next: StickerWorkspace) => {
    setWorkspace(next);
  };

  const updateCharacterSettings = (patch: Partial<CharacterSettings>) => {
    updateActiveProject((p) => ({
      ...p,
      characterSettings: {
        ...p.characterSettings,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const addLibraryItems = (
    items: Omit<StickerLibraryItem, "id" | "createdAt">[],
  ) => {
    const now = new Date().toISOString();
    const next: StickerLibraryItem[] = items.map((item) => ({
      ...item,
      id: createId(),
      createdAt: now,
    }));
    updateActiveProject((p) => ({ ...p, library: [...p.library, ...next] }));
    return next;
  };

  const updateLibraryItem = (
    id: string,
    patch: Partial<Pick<StickerLibraryItem, "label" | "gender">>,
  ) => {
    updateActiveProject((p) => ({
      ...p,
      library: p.library.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeLibraryItem = (id: string) => {
    updateActiveProject((p) => ({
      ...p,
      library: p.library.filter((item) => item.id !== id),
    }));
  };

  const addBatchWithCandidates = (
    batch: Omit<StickerBatch, "id" | "createdAt">,
    plans: StickerCandidate["plan"][],
  ) => {
    const now = new Date().toISOString();
    const batchId = createId();
    const newBatch: StickerBatch = { ...batch, id: batchId, createdAt: now };
    const newCandidates: StickerCandidate[] = plans.map((plan) => ({
      id: createId(),
      batchId,
      baseStickerIds: batch.baseStickerIds,
      plan,
      status: "proposed",
      completedImageDataUrl: null,
      lineFormattedImageDataUrl: null,
      createdAt: now,
    }));
    updateActiveProject((p) => ({
      ...p,
      batches: [...p.batches, newBatch],
      candidates: [...p.candidates, ...newCandidates],
    }));
    return newCandidates;
  };

  const updateCandidate = (id: string, patch: Partial<StickerCandidate>) => {
    updateActiveProject((p) => ({
      ...p,
      candidates: p.candidates.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  };

  const updateCandidatePlan = (
    id: string,
    patch: Partial<StickerCandidate["plan"]>,
  ) => {
    updateActiveProject((p) => ({
      ...p,
      candidates: p.candidates.map((c) =>
        c.id === id ? { ...c, plan: { ...c.plan, ...patch } } : c,
      ),
    }));
  };

  const removeCandidate = (id: string) => {
    updateActiveProject((p) => ({
      ...p,
      candidates: p.candidates.filter((c) => c.id !== id),
    }));
  };

  // 以下はVer1のUIからはまだ呼ばれない、将来の複数プロジェクト切り替えUI向けの
  // 管理用メソッド（データ構造としては既に対応済み）。
  const createProject = (name: string) => {
    const project = createEmptyStickerCharacterProject(name);
    setWorkspace((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      activeProjectId: project.id,
    }));
    return project;
  };

  const switchProject = (id: string) => {
    setWorkspace((prev) =>
      prev.projects.some((p) => p.id === id)
        ? { ...prev, activeProjectId: id }
        : prev,
    );
  };

  const renameProject = (id: string, name: string) => {
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  };

  const deleteProject = (id: string) => {
    setWorkspace((prev) => {
      const remaining = prev.projects.filter((p) => p.id !== id);
      if (remaining.length === 0) return prev; // 最低1件は残す
      return {
        ...prev,
        projects: remaining,
        activeProjectId:
          prev.activeProjectId === id ? remaining[0].id : prev.activeProjectId,
      };
    });
  };

  return {
    data: activeProject,
    workspace,
    loadWorkspace,
    updateCharacterSettings,
    addLibraryItems,
    updateLibraryItem,
    removeLibraryItem,
    addBatchWithCandidates,
    updateCandidate,
    updateCandidatePlan,
    removeCandidate,
    createProject,
    switchProject,
    renameProject,
    deleteProject,
  };
}
