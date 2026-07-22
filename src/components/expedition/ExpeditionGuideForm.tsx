import {
  REQUIRED_EXPEDITION_FIELDS,
  expeditionGuideInputHasAnyValue,
  type ExpeditionGuideInput,
} from "../../types/expeditionGuide";
import { reviewFieldClass } from "../../lib/formStyles";

type FieldConfig = {
  field: keyof ExpeditionGuideInput;
  label: string;
  placeholder: string;
};

const FIELDS: FieldConfig[] = [
  { field: "tournamentName", label: "大会名", placeholder: "例：第◯回東京都春季水球大会" },
  { field: "schedule", label: "日程", placeholder: "例：2026年8月1日（土）〜8月2日（日）" },
  { field: "meetingPlace", label: "集合場所", placeholder: "例：〇〇小学校 正門前" },
  { field: "meetingTime", label: "集合時間", placeholder: "例：7:00" },
  { field: "departureTime", label: "出発時間", placeholder: "例：7:15" },
  { field: "dismissalTime", label: "解散予定", placeholder: "例：18:00頃（現地にて解散）" },
  { field: "venue", label: "会場", placeholder: "例：〇〇市民プール" },
  { field: "accommodation", label: "宿泊先", placeholder: "例：〇〇ホテル（現地宿泊なしの場合は空欄でOK）" },
  { field: "fee", label: "参加費", placeholder: "例：5,000円（交通費・宿泊費込み）" },
  { field: "extraItems", label: "持ち物追加", placeholder: "例：水分2本、タオル2枚、常備薬" },
  { field: "lunch", label: "昼食", placeholder: "例：各自持参、または現地で購入可" },
  { field: "notes", label: "注意事項", placeholder: "例：体調不良の場合は前日までにご連絡ください" },
  { field: "emergencyContact", label: "緊急連絡先", placeholder: "例：引率 山田（090-xxxx-xxxx）" },
];

type Props = {
  input: ExpeditionGuideInput;
  onUpdateField: (field: keyof ExpeditionGuideInput, value: string) => void;
  onGenerate: () => void;
};

export function ExpeditionGuideForm({
  input,
  onUpdateField,
  onGenerate,
}: Props) {
  const canGenerate = expeditionGuideInputHasAnyValue(input);
  const isRequired = (field: keyof ExpeditionGuideInput) =>
    (REQUIRED_EXPEDITION_FIELDS as string[]).includes(field);

  return (
    <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {label}
              {isRequired(field) && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  （基本項目）
                </span>
              )}
            </label>
            <input
              type="text"
              value={input[field]}
              onChange={(e) => onUpdateField(field, e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${
                isRequired(field) ? reviewFieldClass(input[field]) : "border-gray-300"
              }`}
            />
          </div>
        ))}
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
