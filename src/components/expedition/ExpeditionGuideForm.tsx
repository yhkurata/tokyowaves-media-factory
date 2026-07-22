import {
  expeditionGuideInputHasAnyValue,
  LEADER_OPTIONS,
  TARGET_GROUP_OPTIONS,
  type ExpeditionGuideInput,
} from "../../types/expeditionGuide";
import { reviewFieldClass } from "../../lib/formStyles";
import {
  getExpeditionGuideFieldHistory,
  type ExpeditionGuideHistoryField,
} from "../../lib/expeditionGuideFieldHistory";
import { ExpeditionGuideTemplatePicker } from "./ExpeditionGuideTemplatePicker";

type FieldConfig = {
  field: keyof ExpeditionGuideInput;
  label: string;
  placeholder: string;
  multiline?: boolean;
  historyField?: ExpeditionGuideHistoryField;
  presetInserts?: string[];
};

// スマホでもさっと埋められるよう、本当に無いと困る5項目だけを常時表示にする。
// それ以外は「詳細項目」として折りたたんでおく。
const BASIC_FIELDS: FieldConfig[] = [
  { field: "tournamentName", label: "大会名", placeholder: "例：第◯回東京都春季水球大会" },
  { field: "schedule", label: "期日", placeholder: "例：2026年8月1日（土）〜8月2日（日）" },
  {
    field: "meetingPlace",
    label: "集合場所",
    placeholder: "例：現地　7:00\n複数地点があれば改行して記入できます",
    multiline: true,
    presetInserts: ["現地", "立川駅"],
  },
  { field: "meetingTime", label: "集合時間", placeholder: "例：7:00" },
  {
    field: "venue",
    label: "会場",
    placeholder: "例：〇〇市民プール\n住所や最寄駅があれば改行して記入できます",
    multiline: true,
    historyField: "venue",
  },
];

// 対象・引率者は特殊項目（チェックボックス群）として別枠で扱うため、ここには含めない
const DETAIL_FIELDS: FieldConfig[] = [
  { field: "practicePartner", label: "練習相手", placeholder: "例：エス水球クラブ" },
  { field: "practiceTime", label: "練習時間", placeholder: "例：9:00〜12:00" },
  { field: "departureTime", label: "出発時間", placeholder: "例：7:15" },
  {
    field: "dismissalTime",
    label: "解散場所・時間",
    placeholder: "例：現地　18:00頃\n複数地点があれば改行して記入できます",
    multiline: true,
    presetInserts: ["現地", "立川駅"],
  },
  { field: "accommodation", label: "宿泊先", placeholder: "例：〇〇ホテル（現地宿泊なしの場合は空欄でOK）" },
  {
    field: "fee",
    label: "参加費",
    placeholder: "例：1,000円",
    multiline: true,
  },
  {
    field: "extraItems",
    label: "持ち物追加",
    placeholder: "例：水分2本、タオル2枚、常備薬\n箇条書きで改行して記入できます",
    multiline: true,
  },
  { field: "lunch", label: "昼食", placeholder: "例：各自持参、または現地で購入可" },
  {
    field: "notes",
    label: "注意事項",
    placeholder: "例：体調不良の場合は前日までにご連絡ください\n箇条書きで改行して記入できます",
    multiline: true,
  },
  { field: "emergencyContact", label: "緊急連絡先", placeholder: "例：引率 山田（090-xxxx-xxxx）" },
];

type Props = {
  input: ExpeditionGuideInput;
  onUpdateField: (field: keyof ExpeditionGuideInput, value: string) => void;
  onLoadTemplate: (input: ExpeditionGuideInput) => void;
  onGenerate: () => void;
};

function HistoryChips({
  historyField,
  onPick,
}: {
  historyField: ExpeditionGuideHistoryField;
  onPick: (value: string) => void;
}) {
  const history = getExpeditionGuideFieldHistory(historyField);
  if (history.length === 0) return null;
  return (
    <div className="mb-1 flex flex-wrap gap-1">
      {history.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="max-w-full truncate rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
          title={value}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

// 「現地」「立川駅」のようによく使う場所の断片をワンタップで挿入するチップ。
// 履歴チップ（置き換え）と違い、複数地点を書き足せるよう末尾に追記する。
function PresetInsertChips({
  presets,
  currentValue,
  onInsert,
}: {
  presets: string[];
  currentValue: string;
  onInsert: (value: string) => void;
}) {
  return (
    <div className="mb-1 flex flex-wrap gap-1">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() =>
            onInsert(
              currentValue.trim() === ""
                ? `${preset}　`
                : `${currentValue}\n${preset}　`,
            )
          }
          className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
        >
          + {preset}
        </button>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  label,
  placeholder,
  multiline,
  historyField,
  presetInserts,
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
      {historyField && (
        <HistoryChips historyField={historyField} onPick={onChange} />
      )}
      {presetInserts && (
        <PresetInsertChips
          presets={presetInserts}
          currentValue={value}
          onInsert={onChange}
        />
      )}
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

// チェックボックスで選ぶ項目（対象・引率者）の共通部品。
// 値は「・」区切りの1本の文字列として保持し、選択肢に無い分は
// allowFreeText時のみ自由記入欄の内容として末尾にくっつける。
function CheckboxGroupField({
  label,
  options,
  value,
  onChange,
  allowFreeText,
  freeTextPlaceholder,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
}) {
  const parts = value
    .split("・")
    .map((v) => v.trim())
    .filter(Boolean);
  const selected = parts.filter((p) => (options as readonly string[]).includes(p));
  const extra = parts
    .filter((p) => !(options as readonly string[]).includes(p))
    .join("・");

  const rebuild = (nextSelected: string[], nextExtra: string) => {
    const joined = [...nextSelected, ...(nextExtra.trim() ? [nextExtra.trim()] : [])];
    onChange(joined.join("・"));
  };

  const toggle = (option: string) => {
    const nextSelected = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    rebuild(nextSelected, extra);
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
          placeholder={freeTextPlaceholder}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      )}
    </div>
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

      <div className="grid gap-3 sm:grid-cols-2">
        {BASIC_FIELDS.map((config) => (
          <FieldInput
            key={config.field}
            {...config}
            value={input[config.field]}
            onChange={(value) => onUpdateField(config.field, value)}
            highlight
          />
        ))}
      </div>

      <details className="rounded-md border border-gray-200">
        <summary className="cursor-pointer select-none px-3 py-3 text-sm font-semibold text-gray-700">
          詳細項目（任意・タップで開く）
        </summary>
        <div className="space-y-3 border-t border-gray-100 p-3">
          <CheckboxGroupField
            label="対象"
            options={TARGET_GROUP_OPTIONS}
            value={input.targetGroup}
            onChange={(value) => onUpdateField("targetGroup", value)}
          />
          <CheckboxGroupField
            label="引率者"
            options={LEADER_OPTIONS}
            value={input.leaders}
            onChange={(value) => onUpdateField("leaders", value)}
            allowFreeText
            freeTextPlaceholder="その他の引率者（自由記入）"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {DETAIL_FIELDS.map((config) => (
              <FieldInput
                key={config.field}
                {...config}
                value={input[config.field]}
                onChange={(value) => onUpdateField(config.field, value)}
                highlight={false}
              />
            ))}
          </div>
        </div>
      </details>

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
