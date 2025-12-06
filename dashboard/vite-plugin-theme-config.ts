/**
 * Vite Plugin: Theme Config API
 *
 * Provides endpoints for saving theme configuration files
 * and exporting the customized theme during development.
 */

import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import crypto from 'crypto'
import { config as dotenvConfig } from 'dotenv'
import { fileURLToPath } from 'url'

// Load .env file for server-side access (Vite only exposes VITE_ prefixed vars)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenvConfig({ path: path.join(__dirname, '.env') })
import {
  generateHomeTemplate,
  readThemePackageName,
  applyNavigationCustomization,
  applyFooterCustomization,
  applyDefaultTemplateCustomization,
  applyAnnouncementBarCustomization,
  applyHeroCustomization,
  applyMainSectionCustomization,
  applyGhostCardsCustomization,
  applyGhostGridCustomization,
  applyImageWithTextCustomization,
} from './defalt-rendering/theme/exportTheme'
import type { TemplatePartial } from './defalt-rendering/theme/exportTheme'
import { THEME_DOCUMENT_FILENAME, normalizeThemeDocument } from './defalt-utils/config/themeConfig'
import type { ThemeDocument, SectionConfig, SectionMargin } from './defalt-utils/config/themeConfig'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './defalt-utils/security/constants.js'

// Inline helper functions (previously in server-utils/helpers.ts)
const headerValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

function extractAuthToken(req: IncomingMessage): string {
  const authHeader = headerValue(req.headers?.authorization)
  if (authHeader) {
    const trimmed = authHeader.trim()
    if (trimmed.startsWith('Bearer ')) return trimmed.slice(7).trim()
    if (trimmed.length > 0) return trimmed
  }
  const fallbackHeaders = ['x-auth-secret', 'x-auth-key', 'x-access-token'] as const
  for (const key of fallbackHeaders) {
    const value = headerValue(req.headers?.[key])
    if (value?.trim()) return value.trim()
  }
  return ''
}

async function readRequestBody(req: IncomingMessage, limitBytes = 2 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      total += buffer.length
      if (total > limitBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(buffer)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

type ThemeConfig = {
  sections: Record<string, SectionConfig>
  order: {
    template: string[]
    footer: string[]
  }
  footerMargin?: SectionMargin
}

async function runCommand(command: string, args: string[], cwd: string) {
  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    childProcess.on('error', reject)
    childProcess.on('close', (code: number | null) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })
  })
}

async function ensureDependenciesInstalled(themeDir: string) {
  const nodeModulesPath = path.join(themeDir, 'node_modules')
  try {
    await fs.access(nodeModulesPath)
    return
  } catch {
    // node_modules missing, install dependencies
  }

  await runCommand('bun', ['install', '--frozen-lockfile'], themeDir)
}

function ensureAuthorized(req: IncomingMessage, res: ServerResponse, routeName: string): boolean {
  const expectedSecret = process.env.AUTH_SECRET?.trim()
  if (!expectedSecret) {
    return true
  }

  if (extractAuthToken(req) === expectedSecret) {
    return true
  }

  res.statusCode = 401
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: `Unauthorized request to ${routeName}` }))
  return false
}

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) {
    return {}
  }
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [name, ...rest] = cookie.split('=')
    if (!name) {
      return acc
    }
    acc[name.trim()] = decodeURIComponent(rest.join('=').trim())
    return acc
  }, {})
}

const devSecureCookie = process.env.NODE_ENV === 'production'

const serializeCsrfCookie = (token: string): string => {
  const parts = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'SameSite=Strict',
    'HttpOnly',
    'Max-Age=3600'
  ]
  if (devSecureCookie) {
    parts.push('Secure')
  }
  return parts.join('; ')
}

const timingSafeCompare = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) {
    return false
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function ensureCsrf(req: IncomingMessage, res: ServerResponse, routeName: string): boolean {
  const cookies = parseCookies(req.headers.cookie)
  const cookieToken = cookies[CSRF_COOKIE_NAME]
  const headerToken = headerValue(req.headers[CSRF_HEADER_NAME])?.trim()

  if (!cookieToken || !headerToken) {
    sendJson(res, 403, { error: `Missing CSRF token for ${routeName}` })
    return false
  }

  if (!timingSafeCompare(cookieToken, headerToken)) {
    sendJson(res, 403, { error: `Invalid CSRF token for ${routeName}` })
    return false
  }

  return true
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

function validateThemeConfigPayload(payload: unknown): { valid: boolean, error?: string } {
  if (!isPlainObject(payload)) {
    return { valid: false, error: 'Theme config must be an object.' }
  }

  if (!isPlainObject(payload.sections)) {
    return { valid: false, error: 'Theme config is missing a valid "sections" object.' }
  }

  const order = (payload as Record<string, unknown>).order
  if (!isStringArray(order)) {
    return { valid: false, error: 'Theme config order must be an array of strings.' }
  }

  return { valid: true }
}

function validateThemeDocumentPayload(payload: unknown): { valid: boolean, error?: string } {
  if (!isPlainObject(payload)) {
    return { valid: false, error: 'Theme document must be an object.' }
  }

  if (!isPlainObject(payload.pages)) {
    return { valid: false, error: 'Theme document is missing a valid "pages" object.' }
  }

  const pages = payload.pages as Record<string, unknown>
  for (const [pageKey, pageValue] of Object.entries(pages)) {
    const validation = validateThemeConfigPayload(pageValue)
    if (!validation.valid) {
      const reason = validation.error ?? 'Invalid theme config payload'
      return { valid: false, error: `Invalid config for page "${pageKey}": ${reason}` }
    }
  }

  if (!isPlainObject(payload.header)) {
    return { valid: false, error: 'Theme document is missing a valid "header" object.' }
  }

  if (!isPlainObject(payload.footer)) {
    return { valid: false, error: 'Theme document is missing a valid "footer" object.' }
  }

  return { valid: true }
}

const sendJson = (res: ServerResponse, statusCode: number, payload: Record<string, unknown>) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function themeConfigPlugin(): Plugin {
  const themeDirName = 'source-complete'
  const themeRoot = path.join(process.cwd(), 'public', 'themes', themeDirName)
  const workspaceRoot = path.join(process.cwd(), '.theme-export-workspace')
  const workspaceThemeDir = path.join(workspaceRoot, themeDirName)

  async function syncThemeToWorkspace() {
    await fs.mkdir(workspaceRoot, { recursive: true })
    await fs.mkdir(workspaceThemeDir, { recursive: true })

    await fs.cp(themeRoot, workspaceThemeDir, {
      recursive: true,
      force: true,
      filter: (src) => {
        const relative = path.relative(themeRoot, src)
        if (!relative) {
          return true
        }
        if (relative.startsWith('node_modules')) {
          return false
        }
        if (relative.startsWith('dist')) {
          return false
        }
        return true
      }
    })

    // Remove internal-only hero partial so it never ships in export
    const heroPartialPath = path.join(workspaceThemeDir, 'partials', 'sections', 'defalt-hero.hbs')
    await fs.rm(heroPartialPath, { force: true })
  }

  return {
    name: 'theme-config-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url === '/api/auth/csrf') {
            if (req.method !== 'GET') {
              res.statusCode = 405
              res.setHeader('Allow', 'GET')
              sendJson(res, 405, { error: 'Method not allowed' })
              return
            }

            const token = crypto.randomBytes(32).toString('hex')
            res.setHeader('Set-Cookie', serializeCsrfCookie(token))
            sendJson(res, 200, { token })
            return
          }

          // Ghost Content API proxy for development (disabled)
          if (req.url?.startsWith('/api/ghost/content') && req.method === 'GET') {
            sendJson(res, 410, { success: false, error: 'Ghost proxy disabled; call Ghost directly.' })
            return
          }

          // Ghost Member proxy for development
          if (req.url === '/api/member' && req.method === 'GET') {
            const ghostUrl = process.env.VITE_GHOST_URL
            if (!ghostUrl) {
              sendJson(res, 500, { error: 'Ghost URL not configured' })
              return
            }

            try {
              const response = await fetch(`${ghostUrl}/members/api/member`, {
                headers: {
                  cookie: req.headers.cookie || '',
                  authorization: (req.headers.authorization as string) || ''
                }
              })

              if (!response.ok) {
                sendJson(res, response.status, { error: 'Not authenticated' })
                return
              }

              const contentType = response.headers.get('content-type') || ''
              if (!contentType.includes('application/json')) {
                sendJson(res, 502, { error: 'Invalid response from Ghost' })
                return
              }

              const member = await response.json()
              sendJson(res, 200, member)
            } catch (error) {
              console.error('Failed to fetch Ghost member:', error)
              sendJson(res, 500, { error: 'Failed to fetch member' })
            }
            return
          }

          if (req.url === '/api/theme-config') {
            if (req.method === 'DELETE') {
              if (!ensureAuthorized(req, res, '/api/theme-config')) {
                return
              }
              if (!ensureCsrf(req, res, '/api/theme-config')) {
                return
              }

              try {
                const configPath = path.join(process.cwd(), 'public', 'theme-config', THEME_DOCUMENT_FILENAME)
                try {
                  await fs.unlink(configPath)
                } catch (error) {
                  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    throw error
                  }
                }
                sendJson(res, 200, { success: true })
              } catch (error) {
                console.error('Error deleting theme document:', error)
                sendJson(res, 500, { error: 'Failed to delete theme document' })
              }
              return
            }

            if (req.method === 'POST') {
              if (!ensureAuthorized(req, res, '/api/theme-config')) {
                return
              }
              if (!ensureCsrf(req, res, '/api/theme-config')) {
                return
              }

              let rawBody: string
              try {
                rawBody = await readRequestBody(req)
              } catch (error) {
                if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
                  sendJson(res, 413, { error: 'Payload too large' })
                  return
                }
                console.error('Error reading theme-config request body:', error)
                sendJson(res, 400, { error: 'Invalid request body' })
                return
              }

              let documentPayload: unknown
              try {
                documentPayload = JSON.parse(rawBody)
              } catch {
                sendJson(res, 400, { error: 'Request body must be valid JSON' })
                return
              }

              const validation = validateThemeDocumentPayload(documentPayload)
              if (!validation.valid) {
                sendJson(res, 400, { error: validation.error ?? 'Invalid theme document payload' })
                return
              }

              try {
                const document = normalizeThemeDocument(documentPayload as ThemeDocument)
                const configDir = path.join(process.cwd(), 'public', 'theme-config')
                await fs.mkdir(configDir, { recursive: true })
                const configPath = path.join(configDir, THEME_DOCUMENT_FILENAME)
                await fs.writeFile(configPath, JSON.stringify(document, null, 2), 'utf-8')
                sendJson(res, 200, { success: true })
              } catch (error) {
                console.error('Error saving theme document:', error)
                sendJson(res, 500, { error: 'Failed to save theme document' })
              }
              return
            }

            next()
            return
          }

          if (req.url === '/api/theme/export' && req.method === 'POST') {
            if (!ensureAuthorized(req, res, '/api/theme/export')) {
              return
            }
            if (!ensureCsrf(req, res, '/api/theme/export')) {
              return
            }

            let rawBody: string
            try {
              rawBody = await readRequestBody(req)
            } catch (error) {
              if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
                sendJson(res, 413, { error: 'Payload too large' })
                return
              }
              console.error('Error reading export request body:', error)
              sendJson(res, 400, { error: 'Invalid request body' })
              return
            }

            let payload: { document?: unknown }
            if (rawBody.trim().length > 0) {
              try {
                payload = JSON.parse(rawBody)
              } catch {
                sendJson(res, 400, { error: 'Request body must be valid JSON' })
                return
              }
            } else {
              payload = {}
            }

            if (payload.document) {
              const validation = validateThemeDocumentPayload(payload.document)
              if (!validation.valid) {
                sendJson(res, 400, { error: validation.error ?? 'Invalid theme document payload' })
                return
              }
            }

            try {
              const themeConfigPath = path.join(process.cwd(), 'public', 'theme-config', THEME_DOCUMENT_FILENAME)

              await syncThemeToWorkspace()
              await ensureDependenciesInstalled(workspaceThemeDir)

              let document: ThemeDocument
              if (payload.document && typeof payload.document === 'object') {
                document = normalizeThemeDocument(payload.document as ThemeDocument)
              } else {
                const configRaw = await fs.readFile(themeConfigPath, 'utf-8')
                document = normalizeThemeDocument(JSON.parse(configRaw) as ThemeDocument)
              }

              const pageConfig = document.pages.homepage
              const headerConfig = document.header.sections.header
              const footerConfig = document.footer

              const { content, partialFiles } = generateHomeTemplate(pageConfig, headerConfig, footerConfig)
              await fs.writeFile(path.join(workspaceThemeDir, 'home.hbs'), content, 'utf-8')

              if (partialFiles.length > 0) {
                const partialsDir = path.join(workspaceThemeDir, 'partials')
                await fs.mkdir(partialsDir, { recursive: true })
                await Promise.all(partialFiles.map(async (partial: TemplatePartial) => {
                  const partialPath = path.join(partialsDir, partial.name)
                  await fs.writeFile(partialPath, partial.content, 'utf-8')
                }))
              }

              const themeConfigForAssets: ThemeConfig = {
                sections: {
                  header: headerConfig,
                  ...pageConfig.sections,
                  ...footerConfig.sections,
                },
                order: {
                  template: Array.isArray(pageConfig.order) ? [...pageConfig.order] : [],
                  footer: Array.isArray(footerConfig.order) ? [...footerConfig.order] : []
                },
                footerMargin: footerConfig.margin
              }

              await applyDefaultTemplateCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyAnnouncementBarCustomization(workspaceThemeDir, themeConfigForAssets, document)
              await applyHeroCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyMainSectionCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyGhostCardsCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyGhostGridCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyImageWithTextCustomization(workspaceThemeDir, themeConfigForAssets)
              await applyNavigationCustomization(workspaceThemeDir, themeConfigForAssets, document)
              await applyFooterCustomization(workspaceThemeDir, themeConfigForAssets)

              await fs.rm(path.join(workspaceThemeDir, 'dist'), { recursive: true, force: true })
              await runCommand('bun', ['run', 'zip'], workspaceThemeDir)

              const packageName = await readThemePackageName(workspaceThemeDir)
              const zipPath = path.join(workspaceThemeDir, 'dist', `${packageName}.zip`)
              const zipBuffer = await fs.readFile(zipPath)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/zip')
              res.setHeader('Content-Disposition', `attachment; filename="${packageName}.zip"`)
              res.end(zipBuffer)
            } catch (error) {
              console.error('Error exporting theme:', error)
              sendJson(res, 500, { error: 'Failed to export theme' })
            }
            return
          }

          next()
        } catch (error) {
          console.error('Unexpected error in theme-config middleware:', error)
          sendJson(res, 500, { error: 'Internal server error' })
        }
      })
    }
  }
}
