import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { defineConfig, type Plugin } from 'vitest/config'
import { loadEnv } from 'vite'
import type { Connect } from 'vite'
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
      const mounts = new Set<string>(['/sections'])
      const base = server.config.base || '/'
      if (base !== '/') {
        mounts.add(`${base.replace(/\/$/, '')}/sections`)
      }

      const root = path.resolve(sectionsDir)

      const handler: Connect.NextHandleFunction = (req, res, next) => {
        const rawUrl = req.url || ''
        const url = rawUrl.split('?')[0] || ''
        if (!url.endsWith('.hbs')) {
          return next()
        }

        const requestedPath = url.replace(/^\/+/, '')
        const resolved = path.resolve(root, requestedPath)
        if (!resolved.startsWith(root + path.sep)) {
          res.statusCode = 404
          res.end('Template not found')
          return
        }

        if (!fs.existsSync(resolved)) {
          res.statusCode = 404
          res.end('Template not found')
          return
        }

        const content = fs.readFileSync(resolved, 'utf-8')
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(content)
      }

      for (const mount of mounts) {
        server.middlewares.use(mount, handler)
      }
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
