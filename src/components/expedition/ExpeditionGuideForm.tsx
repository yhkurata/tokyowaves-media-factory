import {
  expeditionGuideInputHasAnyValue,
  LEADER_OPTIONS,
  REQUIRED_EXPEDITION_FIELDS,
  TARGET_GROUP_OPTIONS,
  type ExpeditionGuideInput,
} from "../../types/expeditionGuide";
import { reviewFieldClass } from "../../lib/formStyles";
import { buildTransitSearchUrl } from "../../lib/transitSearch";
import { ExpeditionGuideTemplatePicker } from "./ExpeditionGuideTemplatePicker";

type FieldConfig = {
  field: keyof ExpeditionGuideInput;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  checkboxOptions?: readonly string[];
  allowFreeText?: boolean;
};

// 実際にTokyoWAVESが記入している流れの通りに、1画面で上から順に埋められる構成
// （詳細項目として折りたたまない）。黄色枠になる基本項目はREQUIRED_EXPEDITION_FIELDSで判定する。
const ORDERED_FIELDS: FieldConfig[] = [
  { field: "tournamentName", label: "タイトル", placeholder: "例：第◯回東京都春季水球大会" },
  {
    field: "leaders",
    label: "引率",
    checkboxOptions: LEADER_OPTIONS,
    allowFreeText: true,
  },
  {
    field: "schedule",
    label: "期日",
    placeholder: "例：2026年8月1日（土）〜8月2日（日）\n複数日の詳細スケジュールがあれば改行して記入できます",
    multiline: true,
  },
  {
    field: "venue",
    label: "会場",
    placeholder: "例：〇〇市民プール\n住所や最寄駅があれば改行して記入できます",
    multiline: true,
  },
  { field: "targetGroup", label: "対象", checkboxOptions: TARGET_GROUP_OPTIONS },
  {
    field: "extraItems",
    label: "持ち物",
    placeholder: "箇条書きで改行して記入できます",
    multiline: true,
  },
  { field: "practiceTime", label: "練習時間", placeholder: "例：9:00〜12:00" },
  { field: "practicePartner", label: "練習相手", placeholder: "例：エス水球クラブ" },
  {
    field: "meeting",
    label: "集合場所・時間",
    placeholder: "例：立川駅　7:00\n複数地点があれば改行して記入できます",
    multiline: true,
  },
  {
    field: "dismissal",
    label: "解散場所・時間",
    placeholder: "例：現地　18:00頃\n複数地点があれば改行して記入できます",
    multiline: true,
  },
  { field: "fee", label: "参加費", placeholder: "例：1,000円", multiline: true },
  {
    field: "notes",
    label: "その他",
    placeholder: "箇条書きで改行して記入できます",
    multiline: true,
  },
];

type Props = {
  input: ExpeditionGuideInput;
  onUpdateField: (field: keyof ExpeditionGuideInput, value: string) => void;
  onLoadTemplate: (input: ExpeditionGuideInput) => void;
  onGenerate: () => void;
};

function FieldInput({
  field,
  label,
  placeholder,
  multiline,
  value,
  onChange,
  highlight,
}: FieldConfig & {
  value: string;
  onChange: (value: string) => void;
  highlight: boolean;
}) {
  const className = `w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${
    highlight ? reviewFieldClass(value) : "border-gray-300"
  }`;
  return (
    <div>
      <label htmlFor={field} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {highlight && (
          <span className="ml-1 text-xs font-normal text-gray-400">
            （基本項目）
          </span>
        )}
      </label>
      {multiline ? (
        <textarea
          id={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={className}
        />
      ) : (
        <input
          id={field}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  );
}

// チェックボックスで選ぶ項目（対象・引率）の共通部品。
// 値は「・」区切りの1本の文字列として保持し、選択肢に無い分は
// allowFreeText時のみ自由記入欄の内容として末尾にくっつける。
function CheckboxGroupField({
  label,
  options,
  value,
  onChange,
  allowFreeText,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  allowFreeText?: boolean;
}) {
  const parts = value
    .split("・")
    .map((v) => v.trim())
    .filter(Boolean);
  const selected = parts.filter((p) => (options as readonly string[]).includes(p));
  const extra = parts
    .filter((p) => !(options as readonly string[]).includes(p))
    .join("・");

  // allowFreeText が無い項目（対象など）では、選択肢に一致しない古い値が
  // 見えない形で残り続けることがないよう、チェックボックス操作のたびに
  // 選択肢に無い文字列は破棄する（自由記入欄がある項目のみ保持する）。
  const rebuild = (nextSelected: string[], nextExtra: string) => {
    const keptExtra = allowFreeText && nextExtra.trim() ? [nextExtra.trim()] : [];
    onChange([...nextSelected, ...keptExtra].join("・"));
  };

  const toggle = (option: string) => {
    const nextSelected = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    rebuild(nextSelected, allowFreeText ? extra : "");
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm has-checked:border-blue-500 has-checked:bg-blue-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="accent-blue-600"
            />
            {option}
          </label>
        ))}
      </div>
      {allowFreeText && (
        <input
          type="text"
          value={extra}
          onChange={(e) => rebuild(selected, e.target.value)}
          placeholder="その他（自由記入）"
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      )}
    </div>
  );
}

// 立川から会場までの乗換案内をワンタップで調べられるようにするリンク。
// APIは使わずYahoo!路線情報の検索結果を開くだけ（結果はそちらで確認・コピーする）。
function TransitLink({ venue }: { venue: string }) {
  const url = buildTransitSearchUrl(venue);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:underline"
    >
      🚃 乗換案内を調べる（立川→会場、Yahoo!路線情報）
    </a>
  );
}

export function ExpeditionGuideForm({
  input,
  onUpdateField,
  onLoadTemplate,
  onGenerate,
}: Props) {
  const canGenerate = expeditionGuideInputHasAnyValue(input);

  return (
    <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
      <ExpeditionGuideTemplatePicker
        currentInput={input}
        onLoadTemplate={onLoadTemplate}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {ORDERED_FIELDS.map((config) =>
          config.checkboxOptions ? (
            <CheckboxGroupField
              key={config.field}
              label={config.label}
              options={config.checkboxOptions}
              value={input[config.field]}
              onChange={(value) => onUpdateField(config.field, value)}
              allowFreeText={config.allowFreeText}
            />
          ) : (
            <div key={config.field}>
              <FieldInput
                {...config}
                value={input[config.field]}
                onChange={(value) => onUpdateField(config.field, value)}
                highlight={(
                  REQUIRED_EXPEDITION_FIELDS as string[]
                ).includes(config.field)}
              />
              {config.field === "venue" && (
                <TransitLink venue={input.venue} />
              )}
            </div>
          ),
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          要項を作成する
        </button>
        <span className="text-xs text-gray-400">
          APIは使わず、その場ですぐに作成されます。黄色枠の基本項目が空欄だと「未定」として出力されます。
        </span>
      </div>
    </section>
  );
}
