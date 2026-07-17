import { useState } from "react";

export function CopyableBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-xs text-gray-800">
        {text}
      </pre>
    </div>
  );
}
