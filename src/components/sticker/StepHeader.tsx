type Props = {
  step: number;
  title: string;
  description?: string;
};

// スタンプ制作フローの各セクション先頭に置く、共通の「STEP n」見出し。
export function StepHeader({ step, title, description }: Props) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {step}
      </span>
      <div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}
