import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import build from '@hono/vite-build/node'

export default defineConfig({
  plugins: [
    devServer({ entry: 'src/index.ts' }),
    build({
      entry: 'src/index.ts',
      port: 3000,
      // Native addons can't be bundled into ESM (their loaders rely on
      // __filename); keep them external so node require()s them at runtime.
      external: ['better-sqlite3'],
    }),
  ],
  // Dev server must stay on 3000 — the web app proxies /api there.
  server: { port: 3000 },
})
