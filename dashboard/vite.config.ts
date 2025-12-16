import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { defineConfig, type Plugin } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { themeConfigPlugin } from './vite-plugin-theme-config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vite plugin to serve section HBS templates
 * Maps /sections/* requests to defalt-sections/sections/*
 */
function sectionTemplatesPlugin(): Plugin {
  const sectionsDir = path.resolve(__dirname, 'defalt-sections/sections')

  return {
    name: 'section-templates',
    configureServer(server) {
      server.middlewares.use('/sections', (req, res, next) => {
        const url = req.url || ''
        // Only handle .hbs files
        if (!url.endsWith('.hbs')) {
          return next()
        }

        const filePath = path.join(sectionsDir, url)

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Template not found')
          return
        }

        // Read and serve the file
        const content = fs.readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(content)
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars using __dirname (ESM-safe) instead of process.cwd()
  const env = loadEnv(mode, __dirname, 'VITE_')

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), themeConfigPlugin(), sectionTemplatesPlugin()],
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
  }
})
