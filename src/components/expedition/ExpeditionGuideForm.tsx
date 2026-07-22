import {
  expeditionGuideInputHasAnyValue,
  type ExpeditionGuideInput,
} from "../../types/expeditionGuide";
import { reviewFieldClass } from "../../lib/formStyles";

type FieldConfig = {
  field: keyof ExpeditionGuideInput;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

// スマホでもさっと埋められるよう、本当に無いと困る5項目だけを常時表示にする。
// それ以外は「詳細項目」として折りたたんでおく。
const BASIC_FIELDS: FieldConfig[] = [
  { field: "tournamentName", label: "大会名", placeholder: "例：第◯回東京都春季水球大会" },
  { field: "schedule", label: "期日", placeholder: "例：2026年8月1日（土）〜8月2日（日）" },
  {
    field: "meetingPlace",
    label: "集合場所",
    placeholder: "例：〇〇小学校 正門前\n複数地点があれば改行して記入できます",
    multiline: true,
  },
  { field: "meetingTime", label: "集合時間", placeholder: "例：7:00" },
  {
    field: "venue",
    label: "会場",
    placeholder: "例：〇〇市民プール\n住所や最寄駅があれば改行して記入できます",
    multiline: true,
  },
];

const DETAIL_FIELDS: FieldConfig[] = [
  { field: "targetGroup", label: "対象", placeholder: "例：中学男子、小学生・中女" },
  { field: "leaders", label: "引率者", placeholder: "例：小学生：窪田　中学生：岡本" },
  { field: "practiceTime", label: "練習時間", placeholder: "例：9:00〜12:00" },
  { field: "departureTime", label: "出発時間", placeholder: "例：7:15" },
  {
    field: "dismissalTime",
    label: "解散場所・時間",
    placeholder: "例：現地解散　18:00頃\n複数地点があれば改行して記入できます",
    multiline: true,
  },
  { field: "accommodation", label: "宿泊先", placeholder: "例：〇〇ホテル（現地宿泊なしの場合は空欄でOK）" },
  {
    field: "fee",
    label: "参加費",
    placeholder: "例：1,000円\n（内訳）スタッフ費用・雑費等",
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

export function ExpeditionGuideForm({
  input,
  onUpdateField,
  onGenerate,
}: Props) {
  const canGenerate = expeditionGuideInputHasAnyValue(input);

  return (
    <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
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
        <div className="grid gap-3 border-t border-gray-100 p-3 sm:grid-cols-2">
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
