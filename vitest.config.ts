import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './jest.setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@clerk/nextjs': path.resolve(__dirname, 'src/__tests__/__mocks__/@clerk/nextjs.ts'),
      '@aurinko/client': path.resolve(__dirname, 'src/__tests__/__mocks__/@aurinko/client.ts'),
      '@/lib/stripe-actions': path.resolve(__dirname, 'src/__tests__/__mocks__/@/lib/stripe-actions.ts'),
    }
  }
})
