import { defineConfig } from 'vitest/config'
import path from 'path'
import 'dotenv/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    // Disable file parallelism to avoid database conflicts in integration tests
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
