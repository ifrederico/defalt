/**
 * Express Server for Railway Deployment
 *
 * Serves the built Vite app and handles API routes:
 * - GET /api/member - Proxy to Ghost member API (forwards cookies)
 * - POST /api/theme/export - Theme ZIP export
 */

import express, { type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import os from 'os'
import crypto from 'crypto'
import archiver from 'archiver'
import { fileURLToPath } from 'url'
import pg from 'pg'

// =============================================================================
// PostgreSQL Database Connection
// =============================================================================
const { Pool } = pg

// Railway internal networking doesn't need SSL
// Only use SSL for external connections (DATABASE_PUBLIC_URL)
const dbUrl = process.env.DATABASE_URL
const needsSsl = dbUrl?.includes('railway.tcp.proxy') || dbUrl?.includes('amazonaws.com')

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,  // Fail fast if DB unreachable
  idleTimeoutMillis: 30000
})

// Auto-create schema on startup
async function initDatabase() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS member_themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghost_member_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT 'Untitled Theme',
        description TEXT,
        theme_json JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_member_themes_ghost_member_id ON member_themes(ghost_member_id);
      CREATE INDEX IF NOT EXISTS idx_member_themes_active ON member_themes(ghost_member_id, is_active) WHERE is_active = true;

      CREATE TABLE IF NOT EXISTS member_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ghost_member_id VARCHAR(255) NOT NULL UNIQUE,
        ghost_api_url TEXT,
        ghost_content_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_member_settings_ghost_member_id ON member_settings(ghost_member_id);

      DROP TRIGGER IF EXISTS update_member_settings_updated_at ON member_settings;
      CREATE TRIGGER update_member_settings_updated_at
        BEFORE UPDATE ON member_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_member_themes_updated_at ON member_themes;
      CREATE TRIGGER update_member_themes_updated_at
        BEFORE UPDATE ON member_themes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `)
    console.log('Database schema initialized')
  } catch (err) {
    console.error('Failed to initialize database schema:', err)
  } finally {
    client.release()
  }
}

import {
  generateHomeTemplate,
  applyNavigationCustomization,
  applyFooterCustomization,
  applyDefaultTemplateCustomization,
  applyAnnouncementBarCustomization,
  applyHeroCustomization,
  applyMainSectionCustomization,
  applyGhostCardsCustomization,
  applyGhostGridCustomization,
  applyImageWithTextCustomization,
  applyPageTemplateCustomization,
  applyPostTemplateCustomization
} from './defalt-rendering/theme/exportTheme.ts'
import {
  THEME_DOCUMENT_FILENAME,
  normalizeThemeDocument,
  type SectionConfig,
  type ThemeDocument
} from './defalt-utils/config/themeConfig.ts'
import { themeExportRequestSchema, type ThemeExportRequest } from './defalt-utils/config/themeValidation.ts'
import { canAccessSection, isPlusTier, type SubscriptionTier } from './defalt-utils/types/subscription.ts'
import { getPremiumFeatures } from './defalt-sections/premiumConfig.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = Number(process.env.PORT || 3000)
const GHOST_URL = process.env.VITE_GHOST_URL || process.env.GHOST_URL

// Middleware
app.use(express.json({ limit: '2mb' }))


// =============================================================================
// Auth Helper: Get Ghost Member from request
// =============================================================================
interface GhostMember {
  uuid: string
  email: string
  name: string | null
  paid: boolean
}

async function getGhostMember(req: Request): Promise<GhostMember | null> {
  if (!GHOST_URL) return null
  try {
    const response = await fetch(`${GHOST_URL}/members/api/member`, {
      headers: {
        cookie: req.headers.cookie || '',
        authorization: req.headers.authorization || ''
      }
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

type ThemeRow = {
  id: string
  ghost_member_id: string
  name: string
  description: string | null
  theme_json: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// API: Health Check (for debugging)
// =============================================================================
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'not configured'
  if (process.env.DATABASE_URL) {
    try {
      await pool.query('SELECT 1')
      dbStatus = 'connected'
    } catch {
      dbStatus = 'error'
    }
  }

  res.json({
    status: 'ok',
    ghostUrl: GHOST_URL || 'not configured',
    database: dbStatus,
    timestamp: new Date().toISOString()
  })
})

// =============================================================================
// API: CSRF Token
// =============================================================================
const CSRF_COOKIE_NAME = 'csrf_token'

app.get('/api/auth/csrf', (_req, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000 // 1 hour
  })
  res.json({ token })
})

// =============================================================================
// API: Theme Config (in-memory for Railway)
// =============================================================================
let inMemoryThemeConfig: ThemeDocument | null = null

function validateThemeDocumentPayload(payload: unknown): { valid: boolean, error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Theme document must be an object.' }
  }
  const doc = payload as Record<string, unknown>
  if (!doc.header || typeof doc.header !== 'object') {
    return { valid: false, error: 'Theme document is missing a valid "header" object.' }
  }
  if (!doc.footer || typeof doc.footer !== 'object') {
    return { valid: false, error: 'Theme document is missing a valid "footer" object.' }
  }
  if (!doc.pages || typeof doc.pages !== 'object') {
    return { valid: false, error: 'Theme document is missing a valid "pages" object.' }
  }
  return { valid: true }
}

app.post('/api/theme-config', (req, res) => {
  const validation = validateThemeDocumentPayload(req.body)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    inMemoryThemeConfig = normalizeThemeDocument(req.body as ThemeDocument)
    return res.json({ success: true })
  } catch (error) {
    console.error('Error saving theme config:', error)
    return res.status(500).json({ error: 'Failed to save theme config' })
  }
})

app.delete('/api/theme-config', (_req, res) => {
  inMemoryThemeConfig = null
  return res.json({ success: true })
})

app.get('/api/theme-config', (_req, res) => {
  if (inMemoryThemeConfig) {
    return res.json(inMemoryThemeConfig)
  }
  return res.status(404).json({ error: 'No theme config found' })
})

// =============================================================================
// API: Ghost Member Proxy
// =============================================================================
app.get('/api/member', async (req, res) => {
  if (!GHOST_URL) {
    return res.status(500).json({ error: 'Ghost URL not configured' })
  }

  try {
    const response = await fetch(`${GHOST_URL}/members/api/member`, {
      headers: {
        cookie: req.headers.cookie || '',
        authorization: req.headers.authorization || ''
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Not authenticated' })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      console.error('Ghost member response not JSON', { status: response.status, body: text })
      return res.status(502).json({ error: 'Invalid response from Ghost' })
    }

    const member = await response.json().catch(err => {
      console.error('Ghost member JSON parse error', err)
      return null
    })
    if (!member) {
      return res.status(502).json({ error: 'Invalid response from Ghost' })
    }
    return res.json(member)
  } catch (error) {
    console.error('Failed to fetch Ghost member:', error)
    return res.status(500).json({ error: 'Failed to fetch member' })
  }
})

// =============================================================================
// API: Member Settings (Ghost Credentials)
// =============================================================================
type SettingsRow = {
  id: string
  ghost_member_id: string
  ghost_api_url: string | null
  ghost_content_key: string | null
  created_at: string
  updated_at: string
}

app.get('/api/settings', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const result = await pool.query<SettingsRow>(
      'SELECT * FROM member_settings WHERE ghost_member_id = $1',
      [member.uuid]
    )
    if (result.rows.length === 0) {
      return res.json({ ghost_api_url: null, ghost_content_key: null })
    }
    const settings = result.rows[0]
    return res.json({
      ghost_api_url: settings.ghost_api_url,
      ghost_content_key: settings.ghost_content_key
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

app.put('/api/settings', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { ghost_api_url, ghost_content_key } = req.body ?? {}

  try {
    const result = await pool.query<SettingsRow>(
      `INSERT INTO member_settings (ghost_member_id, ghost_api_url, ghost_content_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (ghost_member_id)
       DO UPDATE SET ghost_api_url = $2, ghost_content_key = $3
       RETURNING *`,
      [member.uuid, ghost_api_url || null, ghost_content_key || null]
    )
    return res.json({
      ghost_api_url: result.rows[0].ghost_api_url,
      ghost_content_key: result.rows[0].ghost_content_key
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return res.status(500).json({ error: 'Failed to save settings' })
  }
})

app.delete('/api/settings', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    await pool.query(
      'DELETE FROM member_settings WHERE ghost_member_id = $1',
      [member.uuid]
    )
    return res.json({ success: true })
  } catch (error) {
    console.error('Error deleting settings:', error)
    return res.status(500).json({ error: 'Failed to delete settings' })
  }
})

// =============================================================================
// API: Themes CRUD (PostgreSQL)
// =============================================================================
app.get('/api/themes', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const result = await pool.query<ThemeRow>(
      'SELECT * FROM member_themes WHERE ghost_member_id = $1 ORDER BY updated_at DESC',
      [member.uuid]
    )
    return res.json(result.rows)
  } catch (error) {
    console.error('Error fetching themes:', error)
    return res.status(500).json({ error: 'Failed to fetch themes' })
  }
})

app.post('/api/themes', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { name, description, theme_json } = req.body ?? {}
  try {
    const result = await pool.query<ThemeRow>(
      `INSERT INTO member_themes (ghost_member_id, name, description, theme_json, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [member.uuid, name || 'Untitled Theme', description || null, JSON.stringify(theme_json ?? {})]
    )
    return res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating theme:', error)
    return res.status(500).json({ error: 'Failed to create theme' })
  }
})

app.get('/api/themes/:id', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const result = await pool.query<ThemeRow>(
      'SELECT * FROM member_themes WHERE id = $1 AND ghost_member_id = $2',
      [req.params.id, member.uuid]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theme not found' })
    }
    return res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching theme:', error)
    return res.status(500).json({ error: 'Failed to fetch theme' })
  }
})

app.put('/api/themes/:id', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { name, description, theme_json, is_active } = req.body ?? {}

  try {
    // Build dynamic update query based on provided fields
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }
    if (theme_json !== undefined) {
      updates.push(`theme_json = $${paramIndex++}`)
      values.push(JSON.stringify(theme_json))
    }
    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(is_active)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(req.params.id, member.uuid)
    const result = await pool.query<ThemeRow>(
      `UPDATE member_themes SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND ghost_member_id = $${paramIndex}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theme not found' })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating theme:', error)
    return res.status(500).json({ error: 'Failed to update theme' })
  }
})

app.delete('/api/themes/:id', async (req: Request, res: Response) => {
  const member = await getGhostMember(req)
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const result = await pool.query(
      'DELETE FROM member_themes WHERE id = $1 AND ghost_member_id = $2',
      [req.params.id, member.uuid]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Theme not found' })
    }
    return res.status(204).end()
  } catch (error) {
    console.error('Error deleting theme:', error)
    return res.status(500).json({ error: 'Failed to delete theme' })
  }
})

// =============================================================================
// API: Theme Export
// =============================================================================
const MAX_JSON_SIZE_BYTES = 2 * 1024 * 1024

const PREMIUM_SECTION_PARTIALS: Record<string, string> = {
  about: 'defalt-about.hbs',
  faq: 'defalt-faq.hbs',
  grid: 'defalt-grid.hbs',
  testimonials: 'defalt-testimonials.hbs',
  'image-with-text': 'defalt-image-with-text.hbs',
  hero: 'defalt-hero.hbs'
}

function collectSectionConfigs(document: ThemeDocument): SectionConfig[] {
  const sections: Array<SectionConfig | undefined> = []

  if (document.header?.sections) {
    sections.push(...Object.values(document.header.sections))
  }
  if (document.footer?.sections) {
    sections.push(...Object.values(document.footer.sections))
  }
  Object.values(document.pages || {}).forEach(pageConfig => {
    if (pageConfig?.sections) {
      sections.push(...Object.values(pageConfig.sections))
    }
  })

  return sections.filter((section): section is SectionConfig => Boolean(section))
}

function isAnnouncementBarEnabled(document: ThemeDocument): boolean {
  const announcementSectionVisible = document.header?.sections?.['announcement-bar']?.settings?.visible
  const headerSettingVisible = document.header?.sections?.header?.settings?.announcementBarVisible

  if (typeof announcementSectionVisible === 'boolean') {
    return announcementSectionVisible
  }

  return headerSettingVisible === true
}

async function validatePremiumFeatures(
  document: ThemeDocument
): Promise<{ error: string | null, tier: SubscriptionTier }> {
  // For now, grant plus_monthly to all users (Ghost handles subscription)
  const tier: SubscriptionTier = 'plus_monthly'

  const sections = collectSectionConfigs(document)

  for (const section of sections) {
    const definitionId = section?.settings?.definitionId
    if (definitionId && !canAccessSection(definitionId, tier)) {
      return {
        error: `${definitionId} section requires Plus subscription.`,
        tier
      }
    }
  }

  return { error: null, tier }
}

async function syncThemeToWorkspace(
  themeRoot: string,
  workspaceThemeDir: string
): Promise<void> {
  const workspaceRoot = path.dirname(workspaceThemeDir)

  await fs.mkdir(workspaceRoot, { recursive: true })
  await fs.mkdir(workspaceThemeDir, { recursive: true })

  await fs.cp(themeRoot, workspaceThemeDir, {
    recursive: true,
    force: true,
    filter: (src) => {
      const relative = path.relative(themeRoot, src)
      if (!relative) return true
      if (relative.startsWith('dist')) return false
      return true
    }
  })

  const heroPartialPath = path.join(workspaceThemeDir, 'partials', 'sections', 'defalt-hero.hbs')
  await fs.rm(heroPartialPath, { force: true })
}

async function cleanupUnusedPartials(
  workspaceThemeDir: string,
  document: ThemeDocument,
  tier: SubscriptionTier
): Promise<void> {
  const partialsDir = path.join(workspaceThemeDir, 'partials', 'sections')
  const sections = collectSectionConfigs(document)

  const hasGhostCards = sections.some(s => s?.settings?.definitionId === 'ghostCards')
  const hasGhostGrid = sections.some(s => s?.settings?.definitionId === 'ghostGrid')
  const hasImageWithText = sections.some(s => s?.settings?.definitionId === 'image-with-text')
  const hasAnnouncementBar = isAnnouncementBarEnabled(document)

  if (!hasGhostCards) {
    await fs.rm(path.join(partialsDir, 'defalt-ghost-cards.hbs'), { force: true })
  }
  if (!hasGhostGrid) {
    await fs.rm(path.join(partialsDir, 'defalt-ghost-grid.hbs'), { force: true })
  }
  if (!hasImageWithText) {
    await fs.rm(path.join(partialsDir, 'defalt-image-with-text.hbs'), { force: true })
  }
  if (!hasAnnouncementBar) {
    await fs.rm(path.join(partialsDir, 'announcement-bar.hbs'), { force: true })
  }

  if (!isPlusTier(tier)) {
    const premiumFeatures = getPremiumFeatures()
    for (const featureId of premiumFeatures) {
      const partialName = PREMIUM_SECTION_PARTIALS[featureId]
      if (partialName) {
        await fs.rm(path.join(partialsDir, partialName), { force: true })
      }
    }
  }
}

async function readThemePackageName(themeDir: string): Promise<string> {
  const pkgPath = path.join(themeDir, 'package.json')
  try {
    const pkgRaw = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgRaw)
    return pkg.name as string
  } catch {
    return 'defalt-theme'
  }
}

async function createThemeArchive(themeDir: string, outputDir: string): Promise<string> {
  const packageName = await readThemePackageName(themeDir)
  const zipPath = path.join(outputDir, `${packageName}.zip`)
  await fs.mkdir(outputDir, { recursive: true })

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)

    archive.pipe(output)
    archive.glob('**/*', {
      cwd: themeDir,
      dot: true,
      ignore: ['node_modules/**', 'dist/**', '.DS_Store', '*.zip']
    })

    void archive.finalize()
  })

  return zipPath
}

app.post('/api/theme/export', async (req, res) => {
  let workspaceRoot: string | null = null

  try {
    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength, 10) > MAX_JSON_SIZE_BYTES) {
      return res.status(413).json({ error: 'Payload too large' })
    }

    let validatedPayload: ThemeExportRequest
    try {
      validatedPayload = themeExportRequestSchema.parse(req.body)
    } catch {
      return res.status(400).json({ error: 'Invalid request payload' })
    }

    const providedDocument = validatedPayload.document

    const projectRoot = __dirname
    const themeDirName = 'source-complete'
    const themeRoot = path.join(projectRoot, 'public', 'themes', themeDirName)
    const themeConfigPath = path.join(projectRoot, 'public', 'theme-config', THEME_DOCUMENT_FILENAME)

    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'defalt-export-'))
    const workspaceThemeDir = path.join(workspaceRoot, themeDirName)

    await syncThemeToWorkspace(themeRoot, workspaceThemeDir)

    let document: ThemeDocument
    if (providedDocument && typeof providedDocument === 'object') {
      document = normalizeThemeDocument(providedDocument as ThemeDocument)
    } else {
      const configRaw = await fs.readFile(themeConfigPath, 'utf-8')
      document = normalizeThemeDocument(JSON.parse(configRaw) as ThemeDocument)
    }

    const homepageConfig = document.pages?.homepage
    const headerConfig = document.header?.sections?.header
    const footerConfig = document.footer

    if (!homepageConfig || !headerConfig || !footerConfig) {
      return res.status(400).json({
        error: 'Invalid theme document',
        message: 'Theme document must include homepage, header, and footer configurations.'
      })
    }

    const { error: validationError, tier } = await validatePremiumFeatures(document)
    if (validationError) {
      return res.status(403).json({ error: 'Premium feature access denied', message: validationError })
    }

    const pageConfig = homepageConfig
    const { content, partialFiles } = generateHomeTemplate(pageConfig, headerConfig, footerConfig)
    await fs.writeFile(path.join(workspaceThemeDir, 'home.hbs'), content, 'utf-8')

    if (partialFiles.length > 0) {
      const partialsDir = path.join(workspaceThemeDir, 'partials')
      await fs.mkdir(partialsDir, { recursive: true })

      for (const partial of partialFiles) {
        const partialPath = path.join(partialsDir, partial.name)
        await fs.writeFile(partialPath, partial.content, 'utf-8')
      }
    }

    const themeConfigForAssets = {
      sections: {
        header: headerConfig,
        ...pageConfig.sections,
        ...footerConfig.sections
      },
      order: {
        template: Array.isArray(pageConfig.order) ? [...pageConfig.order] : [],
        footer: Array.isArray(footerConfig.order) ? [...footerConfig.order] : []
      }
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
    await applyPageTemplateCustomization(workspaceThemeDir, document.pages.page)
    await applyPostTemplateCustomization(workspaceThemeDir, document.pages.post)

    await cleanupUnusedPartials(workspaceThemeDir, document, tier)

    const zipPath = await createThemeArchive(workspaceThemeDir, workspaceRoot)
    const zipBuffer = await fs.readFile(zipPath)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(zipPath)}"`)
    return res.send(zipBuffer)

  } catch (error) {
    console.error('Error exporting theme:', error)
    return res.status(500).json({
      error: 'Failed to export theme',
      details: error instanceof Error ? error.message : String(error)
    })
  } finally {
    if (workspaceRoot) {
      try {
        await fs.rm(workspaceRoot, { recursive: true, force: true })
      } catch (cleanupError) {
        console.error('Failed to clean up workspace:', cleanupError)
      }
    }
  }
})

// =============================================================================
// Static File Serving (SPA)
// =============================================================================
const distPath = path.join(__dirname, 'dist')

app.use(express.static(distPath))

// SPA fallback - serve index.html for non-static routes
// Exclude: /api/, /themes/, /theme-config/
app.get(/^\/(?!api\/|themes\/|theme-config\/).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// =============================================================================
// Start Server
// =============================================================================
async function startServer() {
  // Initialize database schema (non-blocking - server starts even if DB unavailable)
  if (process.env.DATABASE_URL) {
    initDatabase().catch(err => {
      console.error('Database initialization failed (server will continue):', err.message)
    })
  } else {
    console.log('DATABASE_URL not set - theme storage disabled')
  }

  // Verify dist folder exists
  try {
    const indexPath = path.join(distPath, 'index.html')
    await fs.access(indexPath)
    console.log(`Static files ready at: ${distPath}`)
  } catch {
    console.error(`WARNING: dist/index.html not found at ${distPath}`)
    console.error('Run "npm run build" first to generate static files')
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Ghost URL: ${GHOST_URL || 'not configured'}`)
    console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'disabled'}`)
  })
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})
