import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { extractApiPlugin } from './server/viteExtractPlugin'
import { stickerApiPlugin } from './server/viteStickerApiPlugin'
import { instagramAiApiPlugin } from './server/viteInstagramAiApiPlugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 第3引数を '' にすることで、VITE_ プレフィックスなしの変数（ANTHROPIC_API_KEY等）も読み込む。
  // ここで読んだ値は Node側のプラグインにのみ渡し、クライアントバンドルには一切含めない。
  const env = loadEnv(mode, process.cwd(), '')
  // server/db/client.ts はモジュール読み込み時に process.env.DATABASE_URL を
  // 直接参照する（Instagram AI機能のDB接続、tokyowaves-sns-agentと同じ既存Neon DBを
  // 共有する）ため、他のAPIキーのように引数で渡すのではなく、ここでprocess.envへ
  // 反映してからプラグインを構成する必要がある。
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      tailwindcss(),
      extractApiPlugin(env.ANTHROPIC_API_KEY),
      stickerApiPlugin(env.ANTHROPIC_API_KEY),
      instagramAiApiPlugin(env.ANTHROPIC_API_KEY),
    ],
  }
})
