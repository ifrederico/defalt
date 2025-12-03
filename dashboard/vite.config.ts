import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { themeConfigPlugin } from './vite-plugin-theme-config'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), themeConfigPlugin()],
  resolve: {
    alias: {
      '@defalt/app': path.resolve(__dirname, 'defalt-app'),
      '@defalt/ui': path.resolve(__dirname, 'defalt-ui'),
      '@defalt/sections': path.resolve(__dirname, 'defalt-sections'),
      '@defalt/rendering': path.resolve(__dirname, 'defalt-rendering'),
      '@defalt/utils': path.resolve(__dirname, 'defalt-utils'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'ghost-source-code/**'],
  },
})
