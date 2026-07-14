export type WizardStep = "upload" | "analyzing" | "confirm" | "export";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload", label: "① アップロード" },
  { id: "analyzing", label: "② 解析" },
  { id: "confirm", label: "③ 確認・編集" },
  { id: "export", label: "④ PNG出力" },
];

type Props = {
  current: WizardStep;
};

export function StepIndicator({ current }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const isCurrent = step.id === current;
        const isDone = index < currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                isCurrent
                  ? "bg-blue-600 text-white"
                  : isDone
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="text-gray-300">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
