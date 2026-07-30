import { useState } from "react";
import { BrandContextScreen } from "./BrandContextScreen";
import { PostListScreen } from "./PostListScreen";
import { ProposalListScreen } from "./ProposalListScreen";
import { ProposalScreen } from "./ProposalScreen";

type SubScreen = "propose" | "proposal-list" | "post-list" | "brand-context";

const SUB_TABS: { id: SubScreen; label: string }[] = [
  { id: "propose", label: "次の投稿を提案" },
  { id: "proposal-list", label: "提案一覧" },
  { id: "post-list", label: "投稿一覧" },
  { id: "brand-context", label: "ブランドコンテキスト" },
];

// tokyowaves-sns-agent（別プロジェクト）のInstagram投稿提案機能をMedia Factory
// に統合したもの。DBはsns-agent側と同じNeon Postgresを共有する
// （将来的にsns-agentプロジェクト自体をこちらへ統合する前提のため）。
export function InstagramAiScreen() {
  const [subScreen, setSubScreen] = useState<SubScreen>("propose");

  return (
    <div>
      <nav className="border-b border-gray-200 bg-white px-6">
        <div className="mx-auto flex max-w-3xl gap-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubScreen(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                subScreen === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {subScreen === "propose" && <ProposalScreen />}
      {subScreen === "proposal-list" && <ProposalListScreen />}
      {subScreen === "post-list" && <PostListScreen />}
      {subScreen === "brand-context" && <BrandContextScreen />}
    </div>
  );
}
