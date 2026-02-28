import { defineConfig } from 'vitest/config'
import path from 'path'
import 'dotenv/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
