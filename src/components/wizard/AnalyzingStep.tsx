export function AnalyzingStep() {
  return (
    <section className="mx-auto max-w-xl rounded-md border border-gray-300 bg-white p-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="mt-4 text-sm font-semibold text-gray-700">
        AIが資料を解析しています...
      </p>
      <p className="mt-1 text-xs text-gray-400">
        資料の内容により数秒〜数十秒かかります。
      </p>
    </section>
  );
}
