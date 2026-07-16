import { useState } from "react";
import {
  createEmptyStickerProjectData,
  type CharacterSettings,
  type StickerBatch,
  type StickerCandidate,
  type StickerLibraryItem,
  type StickerProjectData,
} from "../types/sticker";

function createId() {
  return crypto.randomUUID();
}

export function useStickerData() {
  const [data, setData] = useState<StickerProjectData>(
    createEmptyStickerProjectData(),
  );

  const loadProject = (next: StickerProjectData) => {
    setData(next);
  };

  const updateCharacterSettings = (patch: Partial<CharacterSettings>) => {
    setData((prev) => ({
      ...prev,
      characterSettings: {
        ...prev.characterSettings,
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
    setData((prev) => ({ ...prev, library: [...prev.library, ...next] }));
    return next;
  };

  const updateLibraryItem = (
    id: string,
    patch: Partial<Pick<StickerLibraryItem, "label" | "gender">>,
  ) => {
    setData((prev) => ({
      ...prev,
      library: prev.library.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeLibraryItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      library: prev.library.filter((item) => item.id !== id),
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
    setData((prev) => ({
      ...prev,
      batches: [...prev.batches, newBatch],
      candidates: [...prev.candidates, ...newCandidates],
    }));
    return newCandidates;
  };

  const updateCandidate = (id: string, patch: Partial<StickerCandidate>) => {
    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  };

  const updateCandidatePlan = (
    id: string,
    patch: Partial<StickerCandidate["plan"]>,
  ) => {
    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === id ? { ...c, plan: { ...c.plan, ...patch } } : c,
      ),
    }));
  };

  const removeCandidate = (id: string) => {
    setData((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }));
  };

  return {
    data,
    loadProject,
    updateCharacterSettings,
    addLibraryItems,
    updateLibraryItem,
    removeLibraryItem,
    addBatchWithCandidates,
    updateCandidate,
    updateCandidatePlan,
    removeCandidate,
  };
}
