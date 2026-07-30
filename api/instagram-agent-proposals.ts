import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listAgentProposals } from "../server/instagramAgentProposalHandler.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GETのみ対応しています。" });
    return;
  }
  try {
    const result = await listAgentProposals();
    res.status(200).json({ result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました。";
    res.status(500).json({ error: message });
  }
}
