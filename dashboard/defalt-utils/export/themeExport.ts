import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import path from 'path'
import archiver from 'archiver'
import type { FooterConfig, PageConfig, SectionConfig, SectionMargin, ThemeDocument } from '../config/themeConfig'
import { canAccessSection, isPlusTier, type SubscriptionTier } from '../types/subscription'
import { getPremiumFeatures } from '../config/premiumConfig'
import {
  generateHomeTemplate,
  readThemePackageName,
  applyPackageJsonCustomization,
  applyCustomCssCustomization,
  applyNavigationCustomization,
  applyFooterCustomization,
  applyDefaultTemplateCustomization,
  applyAnnouncementBarCustomization,
  applyCustomSectionTemplates,
  applyMainSectionCustomization,
  applyPageTemplateCustomization,
  applyPostTemplateCustomization,
} from '../../defalt-rendering/theme/exportTheme'

export type ThemeAssetsConfig = {
  sections: Record<string, SectionConfig>
  order: {
    template: string[]
    footer: string[]
  }
  footerMargin?: SectionMargin
}

export type ThemeExportInputs = {
  workspaceThemeDir: string
  document: ThemeDocument
  pageConfig: PageConfig
  headerConfig: SectionConfig
  footerConfig: FooterConfig
}

const PREMIUM_SECTION_PARTIALS: Record<string, string> = {
  'image-with-text': 'defalt-image-with-text.hbs',
  hero: 'defalt-hero.hbs',
  ghostCards: 'defalt-ghost-cards.hbs',
  ghostGrid: 'defalt-ghost-grid.hbs'
}

export function buildThemeAssetsConfig(
  pageConfig: PageConfig,
  headerConfig: SectionConfig,
  footerConfig: FooterConfig
): ThemeAssetsConfig {
  return {
    sections: {
      header: headerConfig,
      ...pageConfig.sections,
      ...footerConfig.sections
    },
    order: {
      template: Array.isArray(pageConfig.order) ? [...pageConfig.order] : [],
      footer: Array.isArray(footerConfig.order) ? [...footerConfig.order] : []
    },
    footerMargin: footerConfig.margin
  }
}

export async function syncThemeToWorkspace(themeRoot: string, workspaceThemeDir: string): Promise<void> {
  const workspaceRoot = path.dirname(workspaceThemeDir)

  await fs.mkdir(workspaceRoot, { recursive: true })
  await fs.rm(workspaceThemeDir, { recursive: true, force: true })
  await fs.mkdir(workspaceThemeDir, { recursive: true })

  await fs.cp(themeRoot, workspaceThemeDir, {
    recursive: true,
    force: true,
    filter: (src) => {
      const relative = path.relative(themeRoot, src)
      if (!relative) return true
      if (relative.startsWith('node_modules')) return false
      if (relative.startsWith('dist')) return false
      return true
    }
  })
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
  const headerSettings = document.header?.sections?.header?.settings
  const announcementBars = headerSettings?.announcementBars
  return Array.isArray(announcementBars) && announcementBars.length > 0
}

export function resolveExportTierOverride(): SubscriptionTier | null {
  const raw = process.env.DEFALT_EXPORT_TIER
  if (raw === 'free' || raw === 'plus_monthly' || raw === 'plus_lifetime') {
    return raw
  }
  return null
}

export async function validatePremiumFeatures(
  document: ThemeDocument,
  tier: SubscriptionTier
): Promise<{ error: string | null, tier: SubscriptionTier }> {

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

export async function cleanupUnusedPartials(
  workspaceThemeDir: string,
  document: ThemeDocument,
  tier: SubscriptionTier
): Promise<void> {
  const partialsDir = path.join(workspaceThemeDir, 'partials')
  const sections = collectSectionConfigs(document)

  const hasGhostCards = sections.some(s => s?.settings?.definitionId === 'ghostCards')
  const hasGhostGrid = sections.some(s => s?.settings?.definitionId === 'ghostGrid')
  const hasImageWithText = sections.some(s => s?.settings?.definitionId === 'image-with-text')
  const hasHero = sections.some(s => s?.settings?.definitionId === 'hero')
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
  if (!hasHero) {
    await fs.rm(path.join(partialsDir, 'defalt-hero.hbs'), { force: true })
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

export async function applyThemeExportCustomizations({
  workspaceThemeDir,
  document,
  pageConfig,
  headerConfig,
  footerConfig
}: ThemeExportInputs): Promise<void> {
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

  await applyPackageJsonCustomization(workspaceThemeDir, document)
  await applyCustomCssCustomization(workspaceThemeDir, document)

  const themeConfigForAssets = buildThemeAssetsConfig(pageConfig, headerConfig, footerConfig)

  await applyDefaultTemplateCustomization(workspaceThemeDir, themeConfigForAssets)
  await applyAnnouncementBarCustomization(workspaceThemeDir, themeConfigForAssets, document)
  await applyMainSectionCustomization(workspaceThemeDir, themeConfigForAssets)
  await applyCustomSectionTemplates(workspaceThemeDir, themeConfigForAssets)
  await applyNavigationCustomization(workspaceThemeDir, themeConfigForAssets, document)
  await applyFooterCustomization(workspaceThemeDir, themeConfigForAssets)
  await applyPageTemplateCustomization(workspaceThemeDir, document.pages.page)
  await applyPostTemplateCustomization(workspaceThemeDir, document.pages.post)
}

export async function createThemeArchive(themeDir: string, outputDir: string): Promise<string> {
  const rawPackageName = await readThemePackageName(themeDir)
  // Sanitize package name to prevent path traversal: only allow alphanumeric, dash, underscore
  const packageName = rawPackageName.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'theme'
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
