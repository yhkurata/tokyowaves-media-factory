import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { extractApiPlugin } from './server/viteExtractPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 第3引数を '' にすることで、VITE_ プレフィックスなしの変数（ANTHROPIC_API_KEY等）も読み込む。
  // ここで読んだ値は Node側のプラグインにのみ渡し、クライアントバンドルには一切含めない。
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), extractApiPlugin(env.ANTHROPIC_API_KEY)],
  }
})
