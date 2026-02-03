import dotenv from 'dotenv'
import { expand as dotenvExpand } from 'dotenv-expand'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Load test env defaults from .env.sample without clobbering existing variables, and expand nested refs.
const envResult = dotenv.config({ path: path.resolve(process.cwd(), '.env.sample'), override: false })
dotenvExpand(envResult)

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    fileParallelism: false,
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
  },
})
