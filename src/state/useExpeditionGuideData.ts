import { useEffect, useRef, useState } from "react";
import {
  createEmptyExpeditionGuideInput,
  type ExpeditionGuideInput,
  type ExpeditionGuideOutput,
} from "../types/expeditionGuide";
import {
  loadExpeditionGuideSnapshot,
  saveExpeditionGuideSnapshot,
} from "../lib/expeditionGuideAutoSave";
import { buildExpeditionGuideOutput } from "../lib/expeditionGuideTemplate";

const AUTO_SAVE_DEBOUNCE_MS = 800;

// 遠征要項AIのフォーム入力と生成結果を保持するフック。
// 基本生成はテンプレートエンジン（buildExpeditionGuideOutput）が同期的に行うため
// APIコールもローディング状態も不要。AIによる「強化」結果はsetOutputで反映する。
// 入力値はlocalStorageへ自動保存し、ページ再訪時に復元する。
export function useExpeditionGuideData() {
  // 項目追加前の古いlocalStorageデータ（新フィールドが欠けている）を読み込んでも
  // 落ちないよう、必ず空のデフォルト値にマージしてから使う。
  const [input, setInput] = useState<ExpeditionGuideInput>(() => ({
    ...createEmptyExpeditionGuideInput(),
    ...loadExpeditionGuideSnapshot(),
  }));
  const [output, setOutput] = useState<ExpeditionGuideOutput | null>(null);

  const saveTimeoutRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (saveTimeoutRef.current !== undefined) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveExpeditionGuideSnapshot(input);
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current !== undefined) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [input]);

  const updateField = (field: keyof ExpeditionGuideInput, value: string) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const generate = () => {
    setOutput(buildExpeditionGuideOutput(input));
  };

  return {
    input,
    updateField,
    output,
    generate,
    setOutput,
  };
}
