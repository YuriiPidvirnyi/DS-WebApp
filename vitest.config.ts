import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      // API route handlers live under app/api — include them so their coverage
      // is actually measured, not just the src/ tree.
      include: ['src/**/*.{ts,tsx}', 'app/api/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/locales/**',
        'src/content/**',
      ],
      // Thresholds reflect current coverage after API route additions.
      // Raise these incrementally as test coverage improves.
      thresholds: {
        lines: 17,
        functions: 15,
        branches: 13,
        statements: 17,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
