import fs from 'fs/promises'
import path from 'path'
import {
  extractHeaderSettings,
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig,
  DEFAULT_HEADER_SETTINGS,
  CSS_DEFAULT_PADDING,
  CSS_DEFAULT_MARGIN,
} from '../../defalt-utils/config/themeConfig.js'
import type {
  PageConfig,
  FooterConfig,
  SectionConfig,
  SectionSettings,
  ThemeDocument,
  AnnouncementBarConfig,
  AnnouncementContentConfig,
  AnnouncementBarInstance,
  AnnouncementBlock,
  SectionPadding,
  SectionMargin,
} from '../../defalt-utils/config/themeConfig.js'
// Import from individual files to avoid pulling in sectionRegistry (which uses import.meta.glob)
// This is needed because exportTheme runs during Vite config loading
import { heroConfigSchema, type HeroConfig } from '../../defalt-sections/sections/hero/schema.js'
import type { GhostCardsSectionConfig } from '../../defalt-sections/sections/ghostCards/schema.js'
import type { GhostGridSectionConfig } from '../../defalt-sections/sections/ghostGrid/schema.js'
import { imageWithTextConfigSchema, type ImageWithTextSectionConfig } from '../../defalt-sections/sections/image-with-text/schema.js'
import { ghostCardsConfigSchema } from '../../defalt-sections/sections/ghostCards/schema.js'
import { ghostGridConfigSchema } from '../../defalt-sections/sections/ghostGrid/schema.js'
import { formatInternalTag, toApiTagSlug, parseGhostCardIdSuffix } from '../../defalt-sections/utils/tagUtils.js'

// Known section types that can be exported
const KNOWN_SECTION_TYPES = new Set(['hero', 'ghostCards', 'ghostGrid', 'image-with-text'])

// Path to the new section templates (source of truth)
const SECTIONS_SOURCE_DIR = path.resolve(import.meta.dirname, '../../defalt-sections/sections')

// Static template path mapping for export context
// (avoids importing sectionRegistry which uses import.meta.glob - doesn't work during Vite config loading)
const SECTION_TEMPLATE_PATHS: Record<string, string> = {
  'hero': 'hero/hero.hbs',
  'ghostCards': 'ghostCards/ghostCards.hbs',
  'ghostGrid': 'ghostGrid/ghostGrid.hbs',
  'image-with-text': 'image-with-text/image-with-text.hbs',
}

function getSectionTemplatePath(sectionId: string): string | null {
  return SECTION_TEMPLATE_PATHS[sectionId] ?? null
}

/**
 * Read a section template from `defalt-sections` (single source of truth).
 */
async function readSectionTemplate(sectionId: string): Promise<string | null> {
  const templatePath = getSectionTemplatePath(sectionId)
  if (!templatePath) {
    return null
  }
  const fullPath = path.join(SECTIONS_SOURCE_DIR, templatePath)
  try {
    return await fs.readFile(fullPath, 'utf-8')
  } catch {
    return null
  }
}

type ThemeConfig = {
  sections: Record<string, SectionConfig>
  order: {
    template: string[]
    footer: string[]
  }
  footerMargin?: SectionMargin
}

type ThemePageConfig = PageConfig

export type TemplatePartial = {
  name: string
  content: string
}

type PaddingConfig = {
  top: number
  bottom: number
  left?: number
  right?: number
}

type TemplateBuildResult = {
  content: string
  partialFiles: TemplatePartial[]
}

function escapeHandlebarsString(value: string): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
}

function sanitizeHexColor(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'transparent') {
    return normalized
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(normalized)) {
    if (normalized.length === 4) {
      const r = normalized[1]
      const g = normalized[2]
      const b = normalized[3]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return normalized
  }
  return fallback
}

function normalizePaddingValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return Math.max(0, Math.round(fallback))
}

function resolveSectionPadding(
  sectionConfig: ThemeConfig['sections'][string] | undefined,
  fallback: PaddingConfig
): PaddingConfig {
  const settings = sectionConfig?.settings
  if (!settings) {
    return { ...fallback }
  }

  const rawPadding = settings.padding as { top?: unknown, bottom?: unknown, left?: unknown, right?: unknown } | undefined
  if (rawPadding && (typeof rawPadding === 'object')) {
    const top = normalizePaddingValue(rawPadding.top, fallback.top)
    const bottom = normalizePaddingValue(rawPadding.bottom, fallback.bottom)
    const left = normalizePaddingValue(rawPadding.left, fallback.left ?? 0)
    const right = normalizePaddingValue(rawPadding.right, fallback.right ?? 0)
    return { top, bottom, left, right }
  }

  const paddingBlock = settings.paddingBlock
  if (typeof paddingBlock === 'number') {
    const unified = normalizePaddingValue(paddingBlock, fallback.top)
    return {
      top: unified,
      bottom: unified,
      left: fallback.left,
      right: fallback.right
    }
  }

  return { ...fallback }
}

function findSectionByDefinitionId(config: ThemeConfig, definitionId: string): ThemeConfig['sections'][string] | undefined {
  const direct = config.sections?.[definitionId]
  if (direct && direct.settings?.definitionId === definitionId) {
    return direct
  }
  const sections = config.sections || {}
  for (const key of Object.keys(sections)) {
    const section = sections[key]
    if (!section) continue
    if (section.settings?.definitionId === definitionId || key === definitionId) {
      return section
    }
  }
  return undefined
}

type SectionWithKey = {
  key: string
  section: ThemeConfig['sections'][string]
}

function findAllSectionsByDefinitionId(config: ThemeConfig, definitionId: string): SectionWithKey[] {
  const sections = config.sections || {}
  const results: SectionWithKey[] = []
  for (const key of Object.keys(sections)) {
    const section = sections[key]
    if (!section) continue
    if (section.settings?.definitionId === definitionId) {
      results.push({ key, section })
    }
  }
  return results
}

function getSectionInstanceSuffix(sectionKey: string, definitionId: string): string {
  // Extract numeric suffix from section key (e.g., "ghost-cards-2" -> "-2", "image-with-text-3" -> "-3")
  // Keys like "ghost-cards" or "image-with-text" have no suffix
  const basePatterns: Record<string, RegExp> = {
    'hero': /^(?:hero|hero-defalt|header-defalt)(?:-(\d+))?$/i,
    'ghostCards': /^ghost-cards?(-(\d+))?$/i,
    'image-with-text': /^image-with-text(-(\d+))?$/i,
  }
  const pattern = basePatterns[definitionId]
  if (pattern) {
    const match = sectionKey.match(pattern)
    const numericSuffix = match?.[2] ?? match?.[1]
    if (numericSuffix) {
      return `-${numericSuffix}`
    }
  }
  return ''
}

function buildSectionStyle(padding: PaddingConfig): string {
  const styles: string[] = []
  if (padding.top > 0) {
    styles.push(`padding-top: ${padding.top}px`)
  }
  if (padding.bottom > 0) {
    styles.push(`padding-bottom: ${padding.bottom}px`)
  }
  if ((padding.left ?? 0) > 0) {
    styles.push(`padding-left: ${padding.left}px`)
  }
  if ((padding.right ?? 0) > 0) {
    styles.push(`padding-right: ${padding.right}px`)
  }
  return styles.join('; ')
}

function resolveContainerPaddingX(contentWidth: string): string {
  return contentWidth === 'none' ? '0px' : 'var(--container-gap, 24px)'
}

function resolveImageColumns(imageWidth: string): { imageColumn: string; textColumn: string } {
  if (imageWidth === '2/3') return { imageColumn: '2fr', textColumn: '1fr' }
  if (imageWidth === '3/4') return { imageColumn: '3fr', textColumn: '1fr' }
  return { imageColumn: '1fr', textColumn: '1fr' }
}

function resolveImageAspectRatio(imageAspect: string): string {
  if (imageAspect === 'square') return '1 / 1'
  if (imageAspect === 'portrait') return '3 / 4'
  if (imageAspect === 'wide') return '16 / 9'
  if (imageAspect === 'tall') return '9 / 16'
  if (imageAspect === 'landscape') return '4 / 3'
  return ''
}

function toTagFilter(internalTag: string): string {
  return `tag:${toApiTagSlug(internalTag)}`
}

function resolveHeroFallbackTag(sectionKey: string): string {
  const match = sectionKey.trim().toLowerCase().match(/^(?:hero-defalt|header-defalt|hero)(?:-(\d+))?$/)
  const suffix = match?.[1]
  return suffix ? `#hero-${suffix}` : '#hero'
}

function resolveImageWithTextFallbackTag(sectionKey: string): string {
  const match = sectionKey.trim().toLowerCase().match(/^image-with-text(?:-(\d+))?$/)
  const suffix = match?.[1]
  return suffix ? `#image-text-${suffix}` : '#image-text'
}

function resolveGhostCardsFallbackTag(sectionKey: string): string {
  const suffix = parseGhostCardIdSuffix(sectionKey)
  if (suffix <= 1) return '#cards'
  return `#cards-${suffix}`
}

export function generateHomeTemplate(
  pageConfig: PageConfig,
  headerConfig: SectionConfig,
  footerConfig: FooterConfig
): TemplateBuildResult {
  const themeConfig: ThemeConfig = {
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

  const sections = themeConfig.sections || {}
  const order = themeConfig.order?.template || []

  const templateLines: string[] = []
  templateLines.push('{{!< default}}')
  templateLines.push('{{!-- Generated by Ghost Theme Editor. Do not edit directly. --}}', '')

  const sectionSnippets: string[] = []
  const partialFiles: TemplatePartial[] = []
  const headerSnippet = '{{> "components/header" headerStyle=@custom.header_style}}'
  const headerSettingsPlaceholder = [
    '<div class="defalt-settings-placeholder" hidden>',
    '  {{@custom.header_text}}',
    '  {{#if @custom.background_image}}true{{/if}}',
    '</div>'
  ].join('\n')
  let headerInserted = false
  for (const key of order) {
    if (key === 'subheader') {
      // NOTE: "subheader" section controls the {{> "components/header"}} partial (Magazine/Search/Highlight/Landing styles)
      // Do NOT confuse with "header" section which controls {{> "components/navigation"}} (the nav bar in default.hbs)
      const subheaderVisible = sections.subheader?.settings?.visible !== false
      if (subheaderVisible) {
        sectionSnippets.push(headerSnippet)
      } else {
        sectionSnippets.push('<div class="hidden">')
        sectionSnippets.push(headerSnippet)
        sectionSnippets.push('</div>')
      }
      headerInserted = true
    } else if (key === 'featured') {
      // Featured posts section - separate toggle from subheader, only appears with Magazine style
      const featuredVisible = sections.featured?.settings?.visible !== false
      const featuredContent = [
        '{{#match @custom.header_style "Magazine"}}',
        '    {{> "components/featured" showFeatured=@custom.show_featured_posts limit=4}}',
        '{{/match}}',
        '',
        '{{> "components/cta"}}'
      ]
      if (featuredVisible) {
        sectionSnippets.push(...featuredContent)
      } else {
        sectionSnippets.push('<div class="hidden">')
        sectionSnippets.push(...featuredContent)
        sectionSnippets.push('</div>')
      }
    } else if (key === 'main') {
      // Include main content, wrapped in hidden if not visible
      const mainVisible = sections[key]?.settings?.visible !== false
      const mainContent = '{{> "components/post-list" feed="home" postFeedStyle=@custom.post_feed_style showTitle=true showSidebar=@custom.show_publication_info_sidebar}}'
      if (mainVisible) {
        sectionSnippets.push(mainContent)
      } else {
        sectionSnippets.push('<div class="hidden">')
        sectionSnippets.push(mainContent)
        sectionSnippets.push('</div>')
      }
    } else {
      const sectionConfig = sections[key]

      const definitionId = sectionConfig?.settings?.definitionId
      if (!definitionId || !KNOWN_SECTION_TYPES.has(definitionId)) {
        continue
      }

      // Check visibility - wrap in hidden div if not visible
      const sectionVisible = sectionConfig?.settings?.visible !== false
      let sectionPartial = ''

      const resolvedPadding = resolveSectionPadding(sectionConfig, { top: 48, bottom: 48, left: 0, right: 0 })
      const sectionStyle = buildSectionStyle(resolvedPadding)

      if (definitionId === 'hero') {
        const heroConfig: HeroConfig = (() => {
          const parsed = heroConfigSchema.safeParse(sectionConfig.settings?.customConfig ?? {})
          if (parsed.success) {
            return parsed.data
          }
          return heroConfigSchema.parse({})
        })()

        const containerPaddingX = resolveContainerPaddingX(heroConfig.contentWidth)
        const backgroundColor = sanitizeHexColor(heroConfig.backgroundColor, 'transparent')
        const internalTag = formatInternalTag(heroConfig.tag) || resolveHeroFallbackTag(key)
        const tagFilter = toTagFilter(internalTag)
        const imageOnRight = heroConfig.invert === true || heroConfig.imagePosition === 'right'
        const { imageColumn, textColumn } = resolveImageColumns(heroConfig.imageWidth)
        const imageAspectRatio = resolveImageAspectRatio(heroConfig.imageAspect)
        const imageBorderRadius = Math.max(0, Math.min(96, Math.round(heroConfig.imageBorderRadius)))

        sectionPartial = `{{> "defalt-hero" sectionId=${JSON.stringify(key)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(heroConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} textAlignment=${JSON.stringify(heroConfig.textAlignment)} pageTitle=${heroConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
      } else if (definitionId === 'ghostCards') {
        const rawConfig = (sectionConfig.settings?.customConfig ?? {}) as Record<string, unknown>

        const cardsConfig: GhostCardsSectionConfig = (() => {
          const parsed = ghostCardsConfigSchema.safeParse(rawConfig)
          if (parsed.success) {
            return parsed.data
          }
          return ghostCardsConfigSchema.parse({})
        })()

	        const containerPaddingX = resolveContainerPaddingX(cardsConfig.contentWidth)
	        const backgroundColor = sanitizeHexColor(cardsConfig.backgroundColor, 'transparent')
	        const internalTag = formatInternalTag(cardsConfig.tag) || resolveGhostCardsFallbackTag(key)
	        const tagFilter = toTagFilter(internalTag)

	        sectionPartial = `{{> "defalt-ghost-cards" sectionId=${JSON.stringify(key)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(cardsConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${cardsConfig.pageTitle} textAlignment=${JSON.stringify(cardsConfig.textAlignment)} titleSize=${JSON.stringify(cardsConfig.titleSize)} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
      } else if (definitionId === 'ghostGrid') {
        const rawConfig = (sectionConfig.settings?.customConfig ?? {}) as Record<string, unknown>

        const gridConfig: GhostGridSectionConfig = (() => {
          const parsed = ghostGridConfigSchema.safeParse(rawConfig)
          if (parsed.success) {
            return parsed.data
          }
          return ghostGridConfigSchema.parse({})
        })()

        const containerPaddingX = resolveContainerPaddingX(gridConfig.contentWidth)
        const backgroundColor = sanitizeHexColor(gridConfig.backgroundColor, 'transparent')
	        const internalTagLeft = formatInternalTag(gridConfig.tagLeft) || '#grid-left'
	        const internalTagRight = formatInternalTag(gridConfig.tagRight) || '#grid-right'
	        const leftTagFilter = toTagFilter(internalTagLeft)
	        const rightTagFilter = toTagFilter(internalTagRight)
	        const anyTagFilter = `${leftTagFilter},${rightTagFilter}`

		        sectionPartial = `{{> "defalt-ghost-grid" sectionId=${JSON.stringify(key)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(gridConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${gridConfig.pageTitle} textAlignment=${JSON.stringify(gridConfig.textAlignment)} titleSize=${JSON.stringify(gridConfig.titleSize)} stackOnMobile=${gridConfig.stackOnMobile} gap=${gridConfig.gap} leftTagFilter=${JSON.stringify(leftTagFilter)} rightTagFilter=${JSON.stringify(rightTagFilter)} anyTagFilter=${JSON.stringify(anyTagFilter)} internalTagLeft=${JSON.stringify(internalTagLeft)} internalTagRight=${JSON.stringify(internalTagRight)} }}`
      } else if (definitionId === 'image-with-text') {
        const rawConfig = (sectionConfig.settings?.customConfig ?? {}) as Record<string, unknown>

        const imageTextConfig: ImageWithTextSectionConfig = (() => {
          const parsed = imageWithTextConfigSchema.safeParse(rawConfig)
          if (parsed.success) {
            return parsed.data
          }
          return imageWithTextConfigSchema.parse({})
        })()

        const containerPaddingX = resolveContainerPaddingX(imageTextConfig.contentWidth)
        const backgroundColor = sanitizeHexColor(imageTextConfig.backgroundColor, 'transparent')
        const internalTag = formatInternalTag(imageTextConfig.tag) || resolveImageWithTextFallbackTag(key)
        const tagFilter = toTagFilter(internalTag)
        const imageOnRight = imageTextConfig.invert === true || imageTextConfig.imagePosition === 'right'
        const { imageColumn, textColumn } = resolveImageColumns(imageTextConfig.imageWidth)
        const imageAspectRatio = resolveImageAspectRatio(imageTextConfig.imageAspect)
        const imageBorderRadius = Math.max(0, Math.min(96, Math.round(imageTextConfig.imageBorderRadius)))

        sectionPartial = `{{> "defalt-image-with-text" sectionId=${JSON.stringify(key)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(imageTextConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} textAlignment=${JSON.stringify(imageTextConfig.textAlignment)} pageTitle=${imageTextConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
      }

      if (sectionVisible) {
        sectionSnippets.push(sectionPartial)
      } else {
        sectionSnippets.push('<div class="hidden">')
        sectionSnippets.push(sectionPartial)
        sectionSnippets.push('</div>')
      }
    }
  }

  // If header wasn't inserted via order, add placeholder to ensure custom settings are available
  if (!headerInserted) {
    sectionSnippets.unshift(headerSettingsPlaceholder)
  }

  if (sectionSnippets.length) {
    templateLines.push(...sectionSnippets)
  }

  const content = templateLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n'

  return { content, partialFiles }
}

/**
 * Reads the theme's package.json to capture the name/version metadata.
 *
 * @param themeDir - Absolute path to the theme root on disk.
 * @returns Package name string, defaults to `defalt-theme` on failure.
 */
export async function readThemePackageName(themeDir: string) {
  const pkgPath = path.join(themeDir, 'package.json')
  try {
    const pkgRaw = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgRaw)
    return pkg.name as string
  } catch {
    return 'defalt-theme'
  }
}

/**
 * Applies navigation layout/customizations to `default.hbs` based on
 * the editor configuration before packaging the theme.
 *
 * @param themeDir - Absolute path to the theme root.
 * @param config - Current sidebar configuration payload.
 * @param document - Optional theme document containing settings overrides.
 */
export async function applyNavigationCustomization(themeDir: string, config: ThemeConfig, document?: ThemeDocument) {
  const navigationPath = path.join(themeDir, 'partials', 'components', 'navigation.hbs')

  let navigationContent: string
  try {
    navigationContent = await fs.readFile(navigationPath, 'utf-8')
  } catch {
    return
  }

  const headerSettings = extractHeaderSettings(config.sections.header, document)

  const headerVisible = config.sections?.header?.settings?.visible !== false

  // If header is hidden, wrap entire navigation content in hidden div
  if (!headerVisible) {
    navigationContent = `<div class="hidden">\n${navigationContent}\n</div>`
    await fs.writeFile(navigationPath, navigationContent, 'utf-8')
    return
  }

  if (!headerSettings.searchEnabled) {
    const searchToggleRegex = /{{>\s*"search-toggle"}}\s*/g
    navigationContent = navigationContent.replace(searchToggleRegex, '')
  }

  const navIdIndex = navigationContent.indexOf('id="gh-navigation"')
  if (navIdIndex !== -1) {
    const classAttrStart = navigationContent.indexOf('class="', navIdIndex)
    if (classAttrStart !== -1) {
      const valueStart = classAttrStart + 'class="'.length
      let cursor = valueStart
      let depth = 0
      let valueEnd = -1

      while (cursor < navigationContent.length) {
        if (navigationContent.startsWith('{{', cursor)) {
          depth += 1
          cursor += 2
          continue
        }
        if (navigationContent.startsWith('}}', cursor)) {
          depth = Math.max(0, depth - 1)
          cursor += 2
          continue
        }
        if (navigationContent[cursor] === '"' && depth === 0) {
          valueEnd = cursor
          break
        }
        cursor += 1
      }

      if (valueEnd !== -1) {
        let classValue = navigationContent.slice(valueStart, valueEnd)

        const removeToken = (token: string) => {
          const pattern = new RegExp(`(^|\\s)${token}(?=\\s|$)`, 'g')
          classValue = classValue.replace(pattern, '$1')
        }

        ['is-search-hidden', 'is-typography-uppercase', 'is-sticky-always', 'is-sticky-scroll-up'].forEach(removeToken)
        classValue = classValue.replace(/\s{2,}/g, ' ').trim()

        const ensureToken = (token: string) => {
          const pattern = new RegExp(`(^|\\s)${token}(?=\\s|$)`)
          if (!pattern.test(classValue)) {
            classValue = classValue.length > 0 ? `${classValue} ${token}` : token
          }
        }

        if (!headerSettings.searchEnabled) {
          ensureToken('is-search-hidden')
        }

        const typographyCase = headerSettings.typographyCase ?? 'default'
        if (typographyCase === 'uppercase') {
          ensureToken('is-typography-uppercase')
        }

        const stickyMode = headerSettings.stickyHeaderMode ?? 'Never'
        if (stickyMode === 'Always') {
          ensureToken('is-sticky-always')
        } else if (stickyMode === 'Scroll up') {
          ensureToken('is-sticky-scroll-up')
        }

        navigationContent =
          navigationContent.slice(0, valueStart) +
          classValue +
          navigationContent.slice(valueEnd)
      }
    }
  }

  const stickyMode = headerSettings.stickyHeaderMode ?? 'Never'

  const extraBlocks: string[] = []

  if (!headerSettings.searchEnabled) {
    extraBlocks.push(`<style id="defalt-nav-search-style">
#gh-navigation.is-search-hidden .gh-search { display: none !important; }
#gh-navigation.is-search-hidden .gh-navigation-menu .gh-search { display: none !important; }
</style>`)
  }

  if ((headerSettings.typographyCase ?? 'default') === 'uppercase') {
    extraBlocks.push(`<style id="defalt-nav-typography-style">
#gh-navigation.is-typography-uppercase,
#gh-navigation.is-typography-uppercase a,
#gh-navigation.is-typography-uppercase button {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>`)
  }

  if (stickyMode === 'Always' || stickyMode === 'Scroll up') {
    extraBlocks.push(`<style id="defalt-nav-sticky-style">
.gh-navigation.is-sticky-always,
.gh-navigation.is-sticky-scroll-up {
  position: sticky;
  top: 0;
  z-index: 4000000;
}

.gh-navigation.is-sticky-scroll-up {
  transition: transform 0.3s ease;
  will-change: transform;
}

.gh-navigation.is-sticky-scroll-up.is-sticky-hidden {
  transform: translateY(-110%);
}
</style>`)

    const stickyScript = `<script id="defalt-nav-sticky-script">
(function(){
  if (typeof window === 'undefined') { return; }
  if (window.__defaltStickyInit) { return; }
  window.__defaltStickyInit = true;

  var header = document.getElementById('gh-navigation');
  if (!header) { return; }
  var mode = '${stickyMode}';

  var setPadding = function() {
    var rect = header.getBoundingClientRect();
    var height = rect && rect.height ? Math.round(rect.height) : 0;
    if (height > 0) {
      document.documentElement.style.scrollPaddingTop = height + 'px';
    }
  };

  if (mode === 'Always') {
    setPadding();
    window.addEventListener('resize', setPadding, { passive: true });
    return;
  }

  if (mode === 'Scroll up') {
    setPadding();
    var thresholdBase = header.getBoundingClientRect().height || 0;
    var threshold = Math.max(thresholdBase, 80);
    var lastY = window.scrollY || 0;

    window.addEventListener('scroll', function() {
      var current = window.scrollY || 0;
      var hide = current > threshold && current > lastY;
      header.classList.toggle('is-sticky-hidden', hide);
      lastY = current;
    }, { passive: true });

    window.addEventListener('resize', function() {
      header.classList.remove('is-sticky-hidden');
      setPadding();
      lastY = window.scrollY || 0;
    }, { passive: true });
  }
})();
</script>`

    extraBlocks.push(stickyScript)
  }

  const markerStart = '{{!-- defalt-navigation-customizations --}}'
  const markerEnd = '{{!-- /defalt-navigation-customizations --}}'
  const markerRegex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\s*`, 'g')
  navigationContent = navigationContent.replace(markerRegex, '')

  if (extraBlocks.length > 0) {
    navigationContent = navigationContent.replace(
      '</header>',
      `</header>\n${markerStart}\n${extraBlocks.join('\n')}\n${markerEnd}`
    )
  }

  await fs.writeFile(navigationPath, navigationContent, 'utf-8')
}

/**
 * Applies editor-driven overrides to the default template file, such as
 * hero sections, announcement bar markup, and custom CSS.
 *
 * @param themeDir - Path to the theme files.
 * @param config - Template configuration describing section order/state.
 */
export async function applyDefaultTemplateCustomization(themeDir: string, config: ThemeConfig) {
  const defaultTemplatePath = path.join(themeDir, 'default.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(defaultTemplatePath, 'utf-8')
  } catch {
    return
  }

  const sections = config.sections || {}
  const headerSettings = sections.header?.settings as (SectionSettings & { announcementBarVisible?: boolean }) | undefined

  // NOTE: "header" section controls {{> "components/navigation"}} (nav bar in default.hbs)
  // "subheader" section controls {{> "components/header"}} (Magazine/Search/Highlight/Landing in home.hbs)
  // NOTE: Announcement bars are handled in applyAnnouncementBarCustomization
  // (it adds/removes the include and generates the partial when needed).
  const navigationVisible = headerSettings?.visible !== false

  // Wrap navigation block in hidden div if not visible
  if (!navigationVisible) {
    const markerStart = '{{!-- defalt-navigation-start --}}'
    const markerEnd = '{{!-- defalt-navigation-end --}}'
    const lowerContent = originalContent.toLowerCase()
    const startIdx = lowerContent.indexOf(markerStart.toLowerCase())
    const endIdx = lowerContent.indexOf(markerEnd.toLowerCase(), startIdx)

    if (startIdx !== -1 && endIdx !== -1) {
      const blockEnd = endIdx + markerEnd.length
      const blockContent = originalContent.slice(startIdx, blockEnd)
      originalContent = originalContent.slice(0, startIdx) + `<div class="hidden">\n${blockContent}\n</div>` + originalContent.slice(blockEnd)
    }
  }

  await fs.writeFile(defaultTemplatePath, originalContent, 'utf-8')
}

/**
 * Generates announcement bar partial for the exported theme.
 * Adds/removes the include in default.hbs based on visibility.
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 * @param document - Optional theme document for resolving defaults.
 */
export async function applyAnnouncementBarCustomization(themeDir: string, config: ThemeConfig, document?: ThemeDocument) {
  const defaultTemplatePath = path.join(themeDir, 'default.hbs')
  const partialPath = path.join(themeDir, 'partials', 'announcement-bar.hbs')

  const sections = config.sections || {}
  const headerSettings = sections.header?.settings as (SectionSettings & {
    announcementBars?: AnnouncementBarInstance[]
    announcementBarVisible?: boolean
    announcementBarConfig?: AnnouncementBarConfig
    announcementContentConfig?: AnnouncementContentConfig
  }) | undefined

  const resolveLegacyAnnouncementBars = (): AnnouncementBarInstance[] => {
    const legacyVisible = typeof headerSettings?.announcementBarVisible === 'boolean'
      ? headerSettings.announcementBarVisible
      : undefined
    if (legacyVisible === undefined) {
      return []
    }

    const legacyBar = normalizeAnnouncementBarConfig(
      headerSettings?.announcementBarConfig ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
      DEFAULT_ANNOUNCEMENT_BAR_CONFIG
    )
    const legacyContent = normalizeAnnouncementContentConfig(
      headerSettings?.announcementContentConfig ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
      DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
      headerSettings?.announcementBarConfig
    )

    const announcements = legacyContent.announcements.length > 0
      ? legacyContent.announcements
      : DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements

    return announcements.map((announcement, idx) => ({
      id: idx === 0 ? 'announcement-bar' : `announcement-bar-${idx + 1}`,
      hidden: !legacyVisible,
      bar: { ...legacyBar },
      content: {
        ...legacyContent,
        announcements: [announcement]
      }
    }))
  }

  const announcementBars = Array.isArray(headerSettings?.announcementBars)
    ? headerSettings.announcementBars
    : resolveLegacyAnnouncementBars()

  const addedBars = announcementBars.filter((bar) => bar && typeof bar === 'object')
  if (addedBars.length === 0) {
    await syncDefaultAnnouncementBarInclude(defaultTemplatePath, false)
    await fs.rm(partialPath, { force: true })
    return
  }

  await syncDefaultAnnouncementBarInclude(defaultTemplatePath, true)
  await fs.mkdir(path.dirname(partialPath), { recursive: true })

  const accentReference = (document?.accentColor ?? DEFAULT_HEADER_SETTINGS.accentColor)?.toLowerCase() ?? ''
  const resolveBackgroundColor = (value: string) =>
    value.toLowerCase() === accentReference ? 'var(--ghost-accent-color)' : value

  const resolveTypographyStyle = (block: AnnouncementBlock) => {
    const size = block.typographySize
    const weight = block.typographyWeight
    const spacing = block.typographySpacing
    const casing = block.typographyCase

    const fontSize =
      size === 'small' ? '1.2rem' :
        size === 'large' ? '1.6rem' :
          size === 'x-large' ? '1.8rem' :
            '1.4rem'

    const fontWeight =
      weight === 'light' ? '300' :
        weight === 'bold' ? '700' :
          '500'

    const letterSpacing =
      spacing === 'tight' ? '-0.02em' :
        spacing === 'wide' ? '0.05em' :
          '0'

    const textTransform = casing === 'uppercase' ? 'uppercase' : 'none'

    return `font-size: ${fontSize}; font-weight: ${fontWeight}; letter-spacing: ${letterSpacing}; text-transform: ${textTransform};`
  }

  const styleBlock = `{{!-- Announcement Bars - Generated by Defalt Theme Editor --}}
<style>
.announcement-bar {
  background-color: var(--announcement-bar-background-color);
  color: var(--announcement-bar-text-color);
  border-bottom: var(--announcement-bar-divider-thickness) solid var(--announcement-bar-divider-color);
  text-align: center;
}

.announcement-bar__content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
}

.announcement-bar--narrow .announcement-bar__content {
  max-width: 960px;
}

.announcement-bar__item {
  display: inline;
}

.announcement-bar__item p {
  display: inline;
  margin: 0;
}

.announcement-bar__item a {
  color: inherit;
  text-decoration: none;
}

.announcement-bar__item a:hover {
  opacity: 0.8;
}

.announcement-bar__link {
  color: inherit;
  text-decoration: none;
}

.announcement-bar__link:hover {
  opacity: 0.8;
}

.announcement-bar__separator {
  opacity: 0.5;
  margin: 0 0.25em;
}
</style>
`

  const renderedBars = addedBars.map((bar) => {
    const normalizedBar = normalizeAnnouncementBarConfig(bar.bar ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG, DEFAULT_ANNOUNCEMENT_BAR_CONFIG)
    const normalizedContent = normalizeAnnouncementContentConfig(
      bar.content ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
      DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
      bar.bar
    )

    const announcements = normalizedContent.announcements.length > 0
      ? normalizedContent.announcements.slice(0, 1)
      : []

    const className = normalizedBar.width === 'narrow'
      ? 'announcement-bar announcement-bar--narrow'
      : 'announcement-bar'
    const isHidden = bar.hidden === true
    const classNameWithVisibility = isHidden ? `${className} hidden` : className

    const style = [
      `padding-top: ${normalizedBar.paddingTop}px`,
      `padding-bottom: ${normalizedBar.paddingBottom}px`,
      `--announcement-bar-background-color: ${resolveBackgroundColor(normalizedBar.backgroundColor)}`,
      `--announcement-bar-text-color: ${normalizedBar.textColor}`,
      `--announcement-bar-divider-thickness: ${normalizedBar.dividerThickness}px`,
      `--announcement-bar-divider-color: ${normalizedBar.dividerColor}`,
    ].join('; ')

    const announcement = announcements[0]
    if (!announcement) {
      return ''
    }

    const typographyStyle = resolveTypographyStyle(announcement)

    const internalTag = formatInternalTag(announcement.tag) || '#announcement'
    const tagFilter = toTagFilter(internalTag)

    const manualText = typeof announcement.text === 'string' ? announcement.text.trim() : ''
    const manualLink = typeof announcement.link === 'string' ? announcement.link.trim() : ''

    const manualMarkup = (() => {
      if (!manualText) {
        return ''
      }
      const safeText = escapeHandlebarsString(manualText)
      const safeLink = manualLink ? escapeHandlebarsString(manualLink) : ''
      if (safeLink) {
        return `<a href="${safeLink}" class="announcement-bar__link announcement-bar__item" style="${typographyStyle}">${safeText}</a>`
      }
      return `<span class="announcement-bar__item" style="${typographyStyle}">${safeText}</span>`
    })()

    // Ghost-first rendering: use page HTML content when a page exists for the tag.
    // Fallback: manual text/link.
    return `{{#get "pages" filter="${escapeHandlebarsString(tagFilter)}" limit="1" include="tags"}}
  {{#if pages}}
    <section class="${classNameWithVisibility}" style="${style}"${isHidden ? ' aria-hidden="true"' : ''}>
      <div class="announcement-bar__content">
        {{#foreach pages}}
          <div class="announcement-bar__item" style="${typographyStyle}">{{{html}}}</div>
        {{/foreach}}
      </div>
    </section>
  {{else}}
    ${manualMarkup ? `<section class="${classNameWithVisibility}" style="${style}"${isHidden ? ' aria-hidden="true"' : ''}>
      <div class="announcement-bar__content">
        ${manualMarkup}
      </div>
    </section>` : ''}
  {{/if}}
{{/get}}`
  })

  const nextContent = `${styleBlock}\n${renderedBars.filter(Boolean).join('\n')}\n`
  await fs.writeFile(partialPath, nextContent, 'utf-8')
}

async function syncDefaultAnnouncementBarInclude(defaultTemplatePath: string, enabled: boolean) {
  let content: string
  try {
    content = await fs.readFile(defaultTemplatePath, 'utf-8')
  } catch {
    return
  }

  const include = '{{> "announcement-bar"}}'
  const includeLine = /^[ \t]*{{>\s*["'](?:sections\/)?announcement-bar["']\s*}}[ \t]*\r?\n?/gm

  if (!enabled) {
    const updated = content.replace(includeLine, '')
    if (updated !== content) {
      await fs.writeFile(defaultTemplatePath, updated, 'utf-8')
    }
    return
  }

  const strippedContent = content.replace(includeLine, '')

  const viewportMarker = '<div class="gh-viewport">'
  const viewportIdx = strippedContent.indexOf(viewportMarker)
  if (viewportIdx !== -1) {
    const insertAt = viewportIdx + viewportMarker.length
    const updated = `${strippedContent.slice(0, insertAt)}\n\n    ${include}${strippedContent.slice(insertAt)}`
    await fs.writeFile(defaultTemplatePath, updated, 'utf-8')
    return
  }

  const bodyMarker = '{{{body}}}'
  const bodyIdx = strippedContent.indexOf(bodyMarker)
  if (bodyIdx !== -1) {
    const updated = `${strippedContent.slice(0, bodyIdx)}${include}\n\n${strippedContent.slice(bodyIdx)}`
    await fs.writeFile(defaultTemplatePath, updated, 'utf-8')
  }
}

/**
 * Copies custom section partials from `defalt-sections` into the exported theme.
 * Templates are copied as-is (Ghost runs them natively).
 */
export async function applyCustomSectionTemplates(themeDir: string, config: ThemeConfig) {
  const order = Array.isArray(config.order?.template) ? config.order.template : []
  const requiredSectionTypes = new Set<string>()

  for (const key of order) {
    const section = config.sections?.[key]
    const definitionId = section?.settings?.definitionId
    if (typeof definitionId === 'string' && KNOWN_SECTION_TYPES.has(definitionId)) {
      requiredSectionTypes.add(definitionId)
    }
  }

  if (requiredSectionTypes.size === 0) {
    return
  }

  const partialsDir = path.join(themeDir, 'partials')
  await fs.mkdir(partialsDir, { recursive: true })

  const mappings: Array<{ id: string; filename: string }> = [
    { id: 'hero', filename: 'defalt-hero.hbs' },
    { id: 'ghostCards', filename: 'defalt-ghost-cards.hbs' },
    { id: 'ghostGrid', filename: 'defalt-ghost-grid.hbs' },
    { id: 'image-with-text', filename: 'defalt-image-with-text.hbs' }
  ]

  for (const mapping of mappings) {
    if (!requiredSectionTypes.has(mapping.id)) {
      continue
    }
    const content = await readSectionTemplate(mapping.id)
    if (!content) {
      continue
    }
    await fs.writeFile(path.join(partialsDir, mapping.filename), content, 'utf-8')
  }
}

/**
 * Applies Hero section customization based on user configuration.
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 */
export async function applyHeroCustomization(themeDir: string, config: ThemeConfig) {
  const basePartialPath = path.join(themeDir, 'partials', 'defalt-hero.hbs')

  // Find all hero sections (supports multiple instances)
  const allHeroSections = findAllSectionsByDefinitionId(config, 'hero')
  if (allHeroSections.length === 0) return

  await fs.mkdir(path.dirname(basePartialPath), { recursive: true })

  const formatInternalTag = (input: unknown) => {
    if (typeof input !== 'string') {
      return ''
    }
    const trimmed = input.trim()
    if (!trimmed) {
      return ''
    }
    const stripped = trimmed.replace(/^#+/, '')
    if (!stripped) {
      return ''
    }
    return `#${stripped}`
  }

  const toTagSlug = (internalTag: string) => {
    const stripped = internalTag.trim().replace(/^#+/, '')
    if (!stripped) {
      return 'hash-hero'
    }
    return stripped.startsWith('hash-') ? stripped : `hash-${stripped}`
  }

  const styleBlock = [
    '<style>',
    '.gd-hero-split {',
    '    width: 100%;',
    '    padding-top: var(--gd-hero-padding-top);',
    '    padding-bottom: var(--gd-hero-padding-bottom);',
    '    padding-left: var(--gd-hero-padding-left);',
    '    padding-right: var(--gd-hero-padding-right);',
    '    background-color: var(--gd-hero-background);',
    '}',
    '',
    '.gd-hero-split__inner {',
    '    max-width: var(--gd-hero-content-width);',
    '    margin: 0 auto;',
    '    padding: 0 var(--gd-hero-inner-padding-x);',
    '}',
    '',
    '.gd-hero-split__content {',
    '    display: grid;',
    '    grid-template-columns: var(--gd-hero-image-column) var(--gd-hero-text-column);',
    '    gap: clamp(32px, 5vw, 64px);',
    '    align-items: center;',
    '}',
    '',
    '.gd-hero-split__content.gd-hero-split__content--image-right {',
    '    grid-template-columns: var(--gd-hero-text-column) var(--gd-hero-image-column);',
    '}',
    '',
    '.gd-hero-split__content.gd-hero-split__content--image-right .gd-hero-split__image {',
    '    order: 2;',
    '}',
    '',
    '.gd-hero-split__content.gd-hero-split__content--image-right .gd-hero-split__text {',
    '    order: 1;',
    '}',
    '',
    '@media (max-width: 768px) {',
    '    .gd-hero-split__content,',
    '    .gd-hero-split__content.gd-hero-split__content--image-right {',
    '        grid-template-columns: 1fr;',
    '    }',
    '    .gd-hero-split__content.gd-hero-split__content--image-right .gd-hero-split__image,',
    '    .gd-hero-split__content.gd-hero-split__content--image-right .gd-hero-split__text {',
    '        order: 0;',
    '    }',
    '}',
    '',
    '.gd-hero-split__image {',
    '    width: 100%;',
    '    aspect-ratio: var(--gd-hero-image-aspect, auto);',
    '    border-radius: var(--gd-hero-image-radius, 0px);',
    '    overflow: hidden;',
    '    background-color: rgba(0, 0, 0, 0.05);',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '}',
    '',
    '.gd-hero-split__image img {',
    '    width: 100%;',
    '    height: 100%;',
    '    object-fit: cover;',
    '    display: block;',
    '}',
    '',
    '.gd-hero-split__placeholder {',
    '    width: 100%;',
    '    height: 100%;',
    '    min-height: 160px;',
    '    background: linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02));',
    '}',
    '',
    '.gd-hero-split__text {',
    '    display: flex;',
    '    flex-direction: column;',
    '    gap: 16px;',
    '}',
    '',
    '.gd-hero-split__heading {',
    '    margin: 0;',
    '    font-family: var(--gh-font-heading, var(--font-sans));',
    '    font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));',
    '    font-weight: 700;',
    '    letter-spacing: -0.028em;',
    '    line-height: 1.1;',
    '    color: inherit;',
    '}',
    '',
    '.gd-hero-split__description {',
    '    margin: 0;',
    '    font-size: 1.8rem;',
    '    line-height: 1.5;',
    '    letter-spacing: -0.015em;',
    '    opacity: 0.85;',
    '    color: inherit;',
    '}',
    '',
    '.gd-hero-split__description code {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    padding: 2px 6px;',
    '    margin: 0 2px;',
    '    border-radius: 4px;',
    '    background-color: #ffffff;',
    '    border: 1px solid #e0e0e0;',
    '    font-size: 12px;',
    '    font-family: inherit;',
    '}',
    '',
    '.gd-hero-split__ctas {',
    '    display: flex;',
    '    flex-wrap: wrap;',
    '    align-items: center;',
    '    gap: 12px;',
    '    margin-top: 8px;',
    '}',
    '',
    '.gd-hero-split__ctas > :not(.kg-button-card) {',
    '    display: none !important;',
    '}',
    '',
    '.gd-hero-split__ctas .kg-button-card {',
    '    margin: 0;',
    '    display: inline-flex;',
    '}',
    '',
    '.gd-hero-split__ctas .kg-button-card .kg-btn {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    min-height: 46px;',
    '    padding: 0 1.2em;',
    '    border-radius: 4px;',
    '    font-size: 1.05em;',
    '    font-weight: 600;',
    '    line-height: 1em;',
    '    letter-spacing: 0.2px;',
    '    text-decoration: none;',
    '    white-space: nowrap;',
    '    background-color: var(--ghost-accent-color);',
    '    color: #ffffff;',
    '}',
    '',
    '.gd-hero-split__ctas .kg-button-card .kg-btn:hover {',
    '    opacity: 0.85;',
    '}',
    '',
    '.gd-hero-split-align-left .gd-hero-split__text {',
    '    text-align: left;',
    '    align-items: flex-start;',
    '}',
    '',
    '.gd-hero-split-align-center .gd-hero-split__text {',
    '    text-align: center;',
    '    align-items: center;',
    '}',
    '',
    '.gd-hero-split-align-right .gd-hero-split__text {',
    '    text-align: right;',
    '    align-items: flex-end;',
    '}',
    '</style>'
  ].join('\n')

	  for (const { key, section } of allHeroSections) {
	    const suffix = getSectionInstanceSuffix(key, 'hero')
	    const partialPath = suffix
	      ? path.join(themeDir, 'partials', `defalt-hero${suffix}.hbs`)
	      : basePartialPath

    const heroConfig: HeroConfig = (() => {
      const parsed = heroConfigSchema.safeParse(section.settings?.customConfig ?? {})
      if (parsed.success) {
        return parsed.data
      }
      return heroConfigSchema.parse({})
    })()

    const contentWidth = heroConfig.contentWidth
    const pageTitle = heroConfig.pageTitle
    const headerAlignment = heroConfig.textAlignment

    const backgroundColor = sanitizeHexColor(
      typeof heroConfig.backgroundColor === 'string' ? heroConfig.backgroundColor : 'transparent',
      'transparent'
    )

    const isInverted = heroConfig.invert === true
    const imagePosition =
      isInverted
        ? 'right'
        : heroConfig.imagePosition === 'right'
          ? 'right'
          : 'left'

    const imageWidthSetting =
      heroConfig.imageWidth === '2/3' || heroConfig.imageWidth === '3/4'
        ? heroConfig.imageWidth
        : '1/2'

    const { imageColumn, textColumn } = (() => {
      // Matches current hero preview behavior: "2/3" and "3/4" bias space toward text.
      if (imageWidthSetting === '2/3') return { imageColumn: '1fr', textColumn: '2fr' }
      if (imageWidthSetting === '3/4') return { imageColumn: '1fr', textColumn: '3fr' }
      return { imageColumn: '1fr', textColumn: '1fr' }
    })()

    const aspectSetting =
      heroConfig.imageAspect === 'square' ||
      heroConfig.imageAspect === 'portrait' ||
      heroConfig.imageAspect === 'landscape' ||
      heroConfig.imageAspect === 'wide' ||
      heroConfig.imageAspect === 'tall'
        ? heroConfig.imageAspect
        : 'default'

    const imageAspect = (() => {
      if (aspectSetting === 'square') return '1 / 1'
      if (aspectSetting === 'portrait') return '3 / 4'
      if (aspectSetting === 'wide') return '16 / 9'
      if (aspectSetting === 'tall') return '9 / 16'
      if (aspectSetting === 'landscape') return '4 / 3'
      return 'auto'
    })()

    const imageBorderRadius = (() => {
      const raw = typeof heroConfig.imageBorderRadius === 'number' && Number.isFinite(heroConfig.imageBorderRadius)
        ? heroConfig.imageBorderRadius
        : 0
      return Math.max(0, Math.min(96, Math.round(raw)))
    })()

    const resolvedPadding = resolveSectionPadding(section, { top: 48, bottom: 48, left: 0, right: 0 })
    const paddingTop = normalizePaddingValue(resolvedPadding.top, 48)
    const paddingBottom = normalizePaddingValue(resolvedPadding.bottom, 48)
    const paddingLeft = normalizePaddingValue(resolvedPadding.left, 0)
    const paddingRight = normalizePaddingValue(resolvedPadding.right, 0)

    const innerPaddingX = contentWidth === 'none' ? '0px' : 'var(--container-gap, 24px)'

    const fallbackTag = suffix ? `#hero${suffix}` : '#hero'
    const internalTag = formatInternalTag(heroConfig.tag) || fallbackTag
    const tagSlug = toTagSlug(internalTag)

    const sectionClasses: string[] = []
    sectionClasses.push(`gd-hero-split-align-${headerAlignment}`)
    const sectionClassInsertion = sectionClasses.length ? ' ' + sectionClasses.join(' ') : ''

    const contentClassInsertion = imagePosition === 'right' ? ' gd-hero-split__content--image-right' : ''

    const inlineStyle = [
      `--gd-hero-content-width: ${contentWidth};`,
      `--gd-hero-inner-padding-x: ${innerPaddingX};`,
      `--gd-hero-padding-top: ${paddingTop}px;`,
      `--gd-hero-padding-bottom: ${paddingBottom}px;`,
      `--gd-hero-padding-left: ${paddingLeft}px;`,
      `--gd-hero-padding-right: ${paddingRight}px;`,
      `--gd-hero-background: ${backgroundColor};`,
      `--gd-hero-image-aspect: ${imageAspect};`,
      `--gd-hero-image-radius: ${imageBorderRadius}px;`,
      `--gd-hero-image-column: ${imageColumn};`,
      `--gd-hero-text-column: ${textColumn};`
    ].join(' ')

    const headingHtml = pageTitle
      ? '                            <h1 class="gd-hero-split__heading">{{title}}</h1>\n'
      : ''
    const placeholderHeadingHtml = pageTitle
      ? '                    <h1 class="gd-hero-split__heading">Page title</h1>\n'
      : ''

    const template = `
${styleBlock}

{{#get "pages" filter="tag:${tagSlug}" limit="1" include="tags,authors"}}
    {{#if pages}}
        {{#foreach pages}}
            <section class="gd-hero-split${sectionClassInsertion}" data-section-type="hero" data-section-id="${escapeHandlebarsString(key)}" data-page-id="{{id}}" style="${inlineStyle}">
                <div class="gd-hero-split__inner">
                    <div class="gd-hero-split__content{{#unless feature_image}} gd-hero-split__content--no-image{{/unless}}${contentClassInsertion}">
                        <div class="gd-hero-split__image">
                            {{#if feature_image}}
                                <img src="{{img_url feature_image size="xl"}}" alt="{{#if feature_image_alt}}{{feature_image_alt}}{{else}}{{title}}{{/if}}">
                            {{else}}
                                <div class="gd-hero-split__placeholder" aria-hidden="true"></div>
                            {{/if}}
                        </div>
                        <div class="gd-hero-split__text">
${headingHtml}                            <p class="gd-hero-split__description">
                                {{#if custom_excerpt}}
                                    {{custom_excerpt}}
                                {{else}}
                                    {{#if excerpt}}
                                        {{excerpt}}
                                    {{else}}
                                        Tag a page with <code>${internalTag}</code> to display content here.
                                    {{/if}}
                                {{/if}}
                            </p>
                            {{#if html}}
                                <div class="gd-hero-split__ctas">
                                    {{{html}}}
                                </div>
                            {{/if}}
                        </div>
                    </div>
                </div>
            </section>
        {{/foreach}}
    {{else}}
        <section class="gd-hero-split${sectionClassInsertion}" data-section-type="hero" data-section-id="${escapeHandlebarsString(key)}" style="${inlineStyle}">
            <div class="gd-hero-split__inner">
                <div class="gd-hero-split__content${contentClassInsertion}">
                    <div class="gd-hero-split__image">
                        <div class="gd-hero-split__placeholder" aria-hidden="true"></div>
                    </div>
                    <div class="gd-hero-split__text">
${placeholderHeadingHtml}                    <p class="gd-hero-split__description">Tag a page with <code>${internalTag}</code> to display content here.</p>
                    </div>
                </div>
            </div>
        </section>
    {{/if}}
{{/get}}
`.trim() + '\n'

    await fs.writeFile(partialPath, template, 'utf-8')
  }
}

/**
 * Applies padding overrides to the main post list section via CSS variables.
 *
 * @param themeDir - Path to the theme files.
 * @param config - Template configuration describing section order/state.
 */
export async function applyMainSectionCustomization(themeDir: string, config: ThemeConfig) {
  const partialPath = path.join(themeDir, 'partials', 'components', 'post-list.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(partialPath, 'utf-8')
  } catch {
    return
  }

  const defaultMainPadding = CSS_DEFAULT_PADDING.main
  let fallback: PaddingConfig
  if (typeof defaultMainPadding === 'number') {
    fallback = { top: defaultMainPadding, bottom: defaultMainPadding, left: 0, right: 0 }
  } else {
    const paddingObject = (defaultMainPadding ?? {}) as SectionPadding
    fallback = {
      top: paddingObject.top ?? 0,
      bottom: paddingObject.bottom ?? 0,
      left: paddingObject.left ?? 0,
      right: paddingObject.right ?? 0,
    }
  }

  const mainSection = config.sections?.main
  const resolvedPadding = resolveSectionPadding(mainSection, fallback)

  // Style block (prepended to template content)
  const styleBlock = [
    '<style>',
    '.defalt-main-section {',
    `    --defalt-main-padding-top: ${resolvedPadding.top}px;`,
    `    --defalt-main-padding-bottom: ${resolvedPadding.bottom}px;`,
    '    padding-top: var(--defalt-main-padding-top);',
    '    padding-bottom: var(--defalt-main-padding-bottom);',
    '}',
    '</style>'
  ].join('\n')

  // Prepend style block to content
  const updatedContent = styleBlock + '\n' + originalContent

  await fs.writeFile(partialPath, updatedContent, 'utf-8')
}

/**
 * Applies Ghost Cards section customization based on user configuration.
 * Handles multiple instances by creating unique partials (defalt-ghost-cards.hbs, defalt-ghost-cards-2.hbs, etc.)
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 */
export async function applyGhostCardsCustomization(themeDir: string, config: ThemeConfig) {
  // Read from new section template location (source of truth)
  const baseContent = await readSectionTemplate('ghostCards')
  if (!baseContent) {
    return
  }

  const basePartialPath = path.join(themeDir, 'partials', 'defalt-ghost-cards.hbs')

  // Find all ghostCards sections
  const allGhostCardsSections = findAllSectionsByDefinitionId(config, 'ghostCards')
  if (allGhostCardsSections.length === 0) return

  const formatInternalTag = (input: unknown) => {
    if (typeof input !== 'string') {
      return ''
    }
    const trimmed = input.trim()
    if (!trimmed) {
      return ''
    }
    const stripped = trimmed.replace(/^#+/, '')
    if (!stripped) {
      return ''
    }
    const ghostMatch = stripped.toLowerCase().match(/^ghost-cards?-?(\d+)?$/)
    if (ghostMatch) {
      const suffix = ghostMatch[1]
      return suffix ? `#ghost-card-${suffix}` : '#ghost-card'
    }
    return `#${stripped}`
  }

  // Process each ghost cards section instance
	  for (const { key, section } of allGhostCardsSections) {
	    const suffix = getSectionInstanceSuffix(key, 'ghostCards')
	    const partialPath = suffix
	      ? path.join(themeDir, 'partials', `defalt-ghost-cards${suffix}.hbs`)
	      : basePartialPath

    let content = baseContent

    const rawConfig = (section.settings?.customConfig ?? {}) as Record<string, unknown>

    const cardsConfig: GhostCardsSectionConfig = (() => {
      const parsed = ghostCardsConfigSchema.safeParse(rawConfig)
      if (parsed.success) {
        return parsed.data
      }
      return ghostCardsConfigSchema.parse({})
    })()

    const padding = resolveSectionPadding(section, { top: 48, bottom: 48, left: 0, right: 0 })
    const showHeader = cardsConfig.pageTitle
    const headerAlignment = cardsConfig.textAlignment
    const titleSize = cardsConfig.titleSize

    const paddingTop = Math.max(0, Math.round(padding.top))
    const paddingBottom = Math.max(0, Math.round(padding.bottom))
    const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
    const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

    // Get the tag for this specific instance
    const fallbackTag = suffix ? `#ghost-card${suffix}` : '#ghost-card'
    const internalTag = formatInternalTag(cardsConfig.tag) || fallbackTag
    const slugTag = internalTag.length > 1 ? `hash-${internalTag.slice(1)}` : 'hash-ghost-card'

    // Style block (prepended to template content)
    const styleBlock = [
      '<style>',
      '.gh-outer {',
      '    padding: 0 max(4vmin, 20px);',
      '}',
      '',
      '.gd-ghost-cards-section {',
      '    background-color: var(--gd-ghost-cards-background, #ffffff);',
      '    color: var(--gd-ghost-cards-text, #151515);',
      '}',
      '',
      '.gd-ghost-cards-inner {',
      `    --gd-ghost-cards-padding-top: ${paddingTop}px;`,
      `    --gd-ghost-cards-padding-bottom: ${paddingBottom}px;`,
      `    --gd-ghost-cards-padding-left: ${paddingLeft}px;`,
      `    --gd-ghost-cards-padding-right: ${paddingRight}px;`,
      '    padding-top: var(--gd-ghost-cards-padding-top);',
      '    padding-bottom: var(--gd-ghost-cards-padding-bottom);',
      '    padding-left: var(--gd-ghost-cards-padding-left);',
      '    padding-right: var(--gd-ghost-cards-padding-right);',
      '}',
      '',
      '.gd-ghost-cards-hide-header .gh-article-header {',
      '    display: none;',
      '}',
      '',
      '.gd-ghost-cards-header-left .gh-article-header {',
      '    text-align: left;',
      '}',
      '',
      '.gd-ghost-cards-header-right .gh-article-header {',
      '    text-align: right;',
      '}',
      '',
      '.gd-ghost-cards-header-center .gh-article-header {',
      '    text-align: center;',
      '}',
      '',
      '.gd-ghost-title-small .gh-article-header .gh-article-title {',
      '    font-family: var(--gh-font-heading, var(--font-sans));',
      '    font-size: calc(2.4rem * var(--factor, 1));',
      '    font-weight: 725;',
      '    letter-spacing: -0.015em;',
      '    line-height: 1.1;',
      '}',
      '',
      '.gd-ghost-title-normal .gh-article-header .gh-article-title {',
      '    font-family: var(--gh-font-heading, var(--font-sans));',
      '    font-size: calc(clamp(2.8rem, 1.36vw + 2.25rem, 4rem) * var(--factor, 1));',
      '    font-weight: 700;',
      '    letter-spacing: -0.03em;',
      '    line-height: 1.1;',
      '}',
      '',
      '.gd-ghost-title-large .gh-article-header .gh-article-title {',
      '    font-family: var(--gh-font-heading, var(--font-sans));',
      '    font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));',
      '    font-weight: 700;',
      '    letter-spacing: -0.028em;',
      '    line-height: 1.1;',
      '}',
      '',
      '.gd-ghost-placeholder-header {',
      '    margin-bottom: 24px;',
      '    opacity: 0.5;',
      '}',
      '',
      '.gd-ghost-placeholder-header .gh-article-title {',
      '    color: rgba(21, 21, 21, 0.55);',
      '}',
      '',
      '.gd-ghost-cards-hide-header .gd-ghost-placeholder-header {',
      '    display: none;',
      '}',
      '',
      '.gd-ghost-cards-placeholder {',
      '    border: 1px dashed #d4d4d4;',
      '    border-radius: 12px;',
      '    padding: 24px;',
      '    background-color: #fafafa;',
      '    text-align: center;',
      '    color: #6b7280;',
      '}',
      '',
      '.gd-ghost-cards-placeholder-title {',
      '    margin-bottom: 8px;',
      '    font-weight: 600;',
      '    color: #151515;',
      '}',
      '',
      '.gd-ghost-cards-placeholder code {',
      '    display: inline-flex;',
      '    align-items: center;',
      '    padding: 2px 6px;',
      '    margin: 0 2px;',
      '    border-radius: 4px;',
      '    background-color: #ffffff;',
      '    border: 1px solid #e0e0e0;',
      '    font-size: 12px;',
      '    font-family: inherit;',
      '}',
      '</style>'
    ].join('\n')

    // Prepend style block to content
    content = styleBlock + '\n' + content

    const sectionClasses: string[] = []
    if (!showHeader) {
      sectionClasses.push('gd-ghost-cards-hide-header')
    }
    sectionClasses.push(`gd-ghost-cards-header-${headerAlignment}`)
    sectionClasses.push(`gd-ghost-title-${titleSize}`)
    const classInsertion = sectionClasses.length ? ' ' + sectionClasses.join(' ') : ''
    content = content.replace('{{!-- defalt-ghost-cards-section-classes --}}', classInsertion)

    // Replace tag filters with this instance's tag
	    const filterPlaceholders = [
	      'filter="tag:hash-ghost-cards"',
	      'filter="tag:hash-ghost-card"',
	    ]
	    filterPlaceholders.forEach((placeholder) => {
	      if (content.includes(placeholder)) {
	        const replacement = `filter="tag:${slugTag}"`
	        content = content.replace(new RegExp(placeholder, 'g'), replacement)
	      }
	    })

    // Update placeholder text to show correct tag for this instance
    content = content.replace(
      /<code>#ghost-card<\/code>/g,
      `<code>${internalTag}</code>`
    )

    await fs.writeFile(partialPath, content, 'utf-8')
  }
}

export async function applyGhostGridCustomization(themeDir: string, config: ThemeConfig) {
  // Read from new section template location (source of truth)
  let originalContent = await readSectionTemplate('ghostGrid')
  if (!originalContent) {
    return
  }

	  const partialPath = path.join(themeDir, 'partials', 'defalt-ghost-grid.hbs')
  const ghostGridSection = findSectionByDefinitionId(config, 'ghostGrid')
  if (!ghostGridSection) return

  const rawConfig = (ghostGridSection.settings?.customConfig ?? {}) as Record<string, unknown>

  const gridConfig: GhostGridSectionConfig = (() => {
    const parsed = ghostGridConfigSchema.safeParse(rawConfig)
    if (parsed.success) {
      return parsed.data
    }
    return ghostGridConfigSchema.parse({})
  })()

  const padding = resolveSectionPadding(ghostGridSection, { top: 48, bottom: 48, left: 0, right: 0 })
  const showHeader = gridConfig.pageTitle
  const headerAlignment = gridConfig.textAlignment
  const titleSize = gridConfig.titleSize
  const stackOnMobile = gridConfig.stackOnMobile
  const columnGap = gridConfig.gap

  const paddingTop = Math.max(0, Math.round(padding.top))
  const paddingBottom = Math.max(0, Math.round(padding.bottom))
  const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
  const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

  // Style block (prepended to template content)
  const styleBlock = [
    '<style>',
    '.gh-outer {',
    '    padding: 0 max(4vmin, 20px);',
    '}',
    '',
    '.gd-ghost-cards-section {',
    `    --gd-ghost-grid-gap: ${columnGap}px;`,
    '    flex-grow: 1;',
    '}',
    '',
    '.gd-ghost-cards-inner {',
    `    --gd-ghost-cards-padding-top: ${paddingTop}px;`,
    `    --gd-ghost-cards-padding-bottom: ${paddingBottom}px;`,
    `    --gd-ghost-cards-padding-left: ${paddingLeft}px;`,
    `    --gd-ghost-cards-padding-right: ${paddingRight}px;`,
    '    padding-top: var(--gd-ghost-cards-padding-top);',
    '    padding-bottom: var(--gd-ghost-cards-padding-bottom);',
    '    padding-left: var(--gd-ghost-cards-padding-left);',
    '    padding-right: var(--gd-ghost-cards-padding-right);',
    '}',
    '',
    '.gd-ghost-cards-grid {',
    '    display: grid;',
    '    gap: clamp(20px, 3vw, 32px);',
    '    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));',
    '}',
    '',
    '.gd-ghost-title-small .gh-article-header .gh-article-title {',
    '    font-family: var(--gh-font-heading, var(--font-sans));',
    '    font-size: calc(2.4rem * var(--factor, 1));',
    '    font-weight: 725;',
    '    letter-spacing: -0.015em;',
    '    line-height: 1.1;',
    '}',
    '',
    '.gd-ghost-title-normal .gh-article-header .gh-article-title {',
    '    font-family: var(--gh-font-heading, var(--font-sans));',
    '    font-size: calc(clamp(2.8rem, 1.36vw + 2.25rem, 4rem) * var(--factor, 1));',
    '    font-weight: 700;',
    '    letter-spacing: -0.03em;',
    '    line-height: 1.1;',
    '}',
    '',
    '.gd-ghost-title-large .gh-article-header .gh-article-title {',
    '    font-family: var(--gh-font-heading, var(--font-sans));',
    '    font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));',
    '    font-weight: 700;',
    '    letter-spacing: -0.028em;',
    '    line-height: 1.1;',
    '}',
    '',
    '.gd-ghost-placeholder-header {',
    '    margin-bottom: 24px;',
    '    opacity: 0.5;',
    '}',
    '',
    '.gd-ghost-placeholder-header .gh-article-title {',
    '    color: rgba(21, 21, 21, 0.55);',
    '}',
    '',
    '.gd-ghost-cards-hide-header .gd-ghost-placeholder-header {',
    '    display: none;',
    '}',
    '',
    '[data-section-type="ghost-grid"] .gd-ghost-cards-grid {',
    '    gap: var(--gd-ghost-grid-gap, clamp(20px, 3vw, 32px));',
    '}',
    '',
    '[data-section-type="ghost-grid"].gd-ghost-grid-no-stack .gd-ghost-cards-grid {',
    '    grid-template-columns: repeat(2, minmax(0, 1fr));',
    '}',
    '',
    '.gd-ghost-grid-placeholder {',
    '    display: grid;',
    '    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));',
    '    gap: var(--gd-ghost-grid-gap, 20px);',
    '}',
    '',
    '[data-section-type="ghost-grid"].gd-ghost-grid-no-stack .gd-ghost-grid-placeholder {',
    '    grid-template-columns: repeat(2, minmax(0, 1fr));',
    '}',
    '',
    '.gd-ghost-grid-placeholder-column {',
      '    display: flex;',
      '    flex-direction: column;',
      '    gap: 12px;',
    '}',
    '',
    '.gd-ghost-grid-placeholder-card {',
    '    border: 1px dashed rgba(107, 114, 128, 0.45);',
    '    border-radius: 10px;',
    '    background: #fafafa;',
    '    padding: 16px;',
    '    text-align: left;',
    '    color: #6b7280;',
    '}',
    '',
    '.gd-ghost-grid-placeholder-title {',
    '    margin-bottom: 8px;',
    '    font-weight: 600;',
    '    color: #151515;',
    '}',
    '',
    '.gd-ghost-grid-placeholder-copy {',
    '    margin: 0;',
    '    line-height: 1.5;',
    '}',
    '',
'.gd-ghost-grid-placeholder code {',
'    display: inline-flex;',
    '    align-items: center;',
    '    padding: 2px 6px;',
    '    margin: 0 2px;',
    '    border-radius: 4px;',
    '    background-color: #ffffff;',
    '    border: 1px solid #e0e0e0;',
    '    font-size: 12px;',
    '    font-family: inherit;',
    '}',
    '</style>'
  ].join('\n')

  // Prepend style block to content
  originalContent = styleBlock + '\n' + originalContent

  const sectionClasses: string[] = []
  if (!showHeader) {
    sectionClasses.push('gd-ghost-cards-hide-header')
  }
  sectionClasses.push(`gd-ghost-cards-header-${headerAlignment}`)
  sectionClasses.push(`gd-ghost-title-${titleSize}`)
  if (!stackOnMobile) {
    sectionClasses.push('gd-ghost-grid-no-stack')
  }
  const classInsertion = sectionClasses.length ? ' ' + sectionClasses.join(' ') : ''
  originalContent = originalContent.replace('{{!-- defalt-ghost-grid-section-classes --}}', classInsertion)

  await fs.writeFile(partialPath, originalContent, 'utf-8')
}

/**
 * Applies Image with Text section customization based on user configuration.
 * Handles multiple instances by creating unique partials (defalt-image-with-text.hbs, defalt-image-with-text-2.hbs, etc.)
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 */
export async function applyImageWithTextCustomization(themeDir: string, config: ThemeConfig) {
  // Read from new section template location (source of truth)
  const baseContent = await readSectionTemplate('image-with-text')
  if (!baseContent) {
    return
  }

  const basePartialPath = path.join(themeDir, 'partials', 'defalt-image-with-text.hbs')

  // Find all image-with-text sections
  const allImageWithTextSections = findAllSectionsByDefinitionId(config, 'image-with-text')
  if (allImageWithTextSections.length === 0) return

  const formatInternalTag = (input: unknown) => {
    if (typeof input !== 'string') {
      return ''
    }
    const trimmed = input.trim()
    if (!trimmed) {
      return ''
    }
    const stripped = trimmed.replace(/^#+/, '')
    if (!stripped) {
      return ''
    }
    const imageMatch = stripped.toLowerCase().match(/^image-with-text-?(\d+)?$/)
    if (imageMatch) {
      const suffix = imageMatch[1]
      return suffix ? `#image-with-text-${suffix}` : '#image-with-text'
    }
    return `#${stripped}`
  }

  // Process each image-with-text section instance
	  for (const { key, section } of allImageWithTextSections) {
	    const suffix = getSectionInstanceSuffix(key, 'image-with-text')
	    const partialPath = suffix
	      ? path.join(themeDir, 'partials', `defalt-image-with-text${suffix}.hbs`)
	      : basePartialPath

    let content = baseContent

    const rawConfig = (section.settings?.customConfig ?? {}) as Record<string, unknown>

    const sectionConfig: ImageWithTextSectionConfig = (() => {
      const parsed = imageWithTextConfigSchema.safeParse(rawConfig)
      if (parsed.success) {
        return parsed.data
      }
      return imageWithTextConfigSchema.parse({})
    })()

    const padding = resolveSectionPadding(section, { top: 48, bottom: 48, left: 0, right: 0 })
    const paddingTop = Math.max(0, Math.round(padding.top))
    const paddingBottom = Math.max(0, Math.round(padding.bottom))
    const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
    const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

    const showHeader = sectionConfig.pageTitle

    const headerAlignment = sectionConfig.textAlignment

    const isInverted = sectionConfig.invert === true
    const imagePosition = isInverted ? 'right' : sectionConfig.imagePosition === 'right' ? 'right' : 'left'

    const imageBorderRadius = Math.max(0, Math.min(96, Math.round(sectionConfig.imageBorderRadius)))

    const contentWidth = sectionConfig.contentWidth

    const imageWidthSetting = sectionConfig.imageWidth

    const { imageColumn, textColumn } = (() => {
      if (imageWidthSetting === '2/3') return { imageColumn: '2fr', textColumn: '1fr' }
      if (imageWidthSetting === '3/4') return { imageColumn: '3fr', textColumn: '1fr' }
      return { imageColumn: '1fr', textColumn: '1fr' }
    })()

    const aspectSetting = sectionConfig.imageAspect

    const aspectRatioValue =
      aspectSetting === 'square' ? '1 / 1'
      : aspectSetting === 'portrait' ? '3 / 4'
      : aspectSetting === 'wide' ? '16 / 9'
      : aspectSetting === 'tall' ? '9 / 16'
      : aspectSetting === 'landscape' ? '4 / 3'
      : null

    const contentAlignmentClass = headerAlignment === 'left'
      ? ' gd-align-left'
      : headerAlignment === 'right'
        ? ' gd-align-right'
        : ' gd-align-center'

    // Get the tag for this specific instance
    const fallbackTag = suffix ? `#image-with-text${suffix}` : '#image-with-text'
    const internalTag = formatInternalTag(sectionConfig.tag) || fallbackTag
    const slugTag = internalTag.length > 1 ? `hash-${internalTag.slice(1)}` : 'hash-image-with-text'

    const backgroundColor = sanitizeHexColor(
      typeof sectionConfig.backgroundColor === 'string' ? sectionConfig.backgroundColor : 'transparent',
      'transparent'
    )

    // Style block (prepended to template content)
    const styleBlock = [
      '<style>',
      '.gd-image-text-section {',
      `    --container-width: ${contentWidth};`,
      `    --gd-image-text-padding-top: ${paddingTop}px;`,
      `    --gd-image-text-padding-bottom: ${paddingBottom}px;`,
      `    --gd-image-text-padding-left: ${paddingLeft}px;`,
      `    --gd-image-text-padding-right: ${paddingRight}px;`,
      `    --gd-image-text-background: ${backgroundColor};`,
      '    --gd-image-text-text-color: #151515;',
      `    --gd-image-text-aspect: ${aspectRatioValue ?? 'auto'};`,
      `    --gd-image-text-image-radius: ${imageBorderRadius}px;`,
      '    --gd-image-text-button-color: #151515;',
      '    --gd-image-text-button-text-color: #ffffff;',
      '    --gd-image-text-button-radius: 3px;',
      '    background-color: var(--gd-image-text-background);',
      '    color: var(--gd-image-text-text-color);',
      '    padding-top: var(--gd-image-text-padding-top);',
      '    padding-bottom: var(--gd-image-text-padding-bottom);',
      '    padding-left: var(--gd-image-text-padding-left);',
      '    padding-right: var(--gd-image-text-padding-right);',
      '}',
      '',
      '.gd-image-text-container {',
      '    max-width: var(--container-width, 1120px);',
      '    margin: 0 auto;',
      '    padding-left: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));',
      '    padding-right: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));',
      '}',
      '',
      '.gd-image-text-content {',
      '    display: grid;',
      `    grid-template-columns: ${imageColumn} ${textColumn};`,
      '    gap: 64px;',
      '    align-items: center;',
      '}',
      '',
      '.gd-image-text-content.gd-image-text-image-right {',
      `    grid-template-columns: ${textColumn} ${imageColumn};`,
      '}',
      '',
      '.gd-image-text-content.gd-image-text-image-right .gd-image-text-image {',
      '    order: 2;',
      '}',
      '',
      '.gd-image-text-content.gd-image-text-image-right .gd-image-text-text {',
      '    order: 1;',
      '}',
      '',
      '.gd-image-text-content.gd-image-text-no-image {',
      '    grid-template-columns: 1fr;',
      '}',
      '',
      '@media (max-width: 767px) {',
      '    .gd-image-text-content {',
      '        grid-template-columns: 1fr;',
      '        gap: 32px;',
      '    }',
      '    .gd-image-text-content.gd-image-text-image-right .gd-image-text-image,',
      '    .gd-image-text-content.gd-image-text-image-right .gd-image-text-text {',
      '        order: 0;',
      '    }',
      '}',
      '',
      '.gd-image-text-image {',
      '    width: 100%;',
      '    aspect-ratio: var(--gd-image-text-aspect, auto);',
      '    border-radius: var(--gd-image-text-image-radius);',
      '    overflow: hidden;',
      '    background-color: rgba(0, 0, 0, 0.05);',
      '}',
      '',
      '.gd-image-text-image img {',
      '    width: 100%;',
      '    height: 100%;',
      '    object-fit: cover;',
      '    display: block;',
      '}',
      '',
      '.gd-image-text-text {',
      '    display: flex;',
      '    flex-direction: column;',
      '    gap: 16px;',
      '}',
      '',
      '.gd-image-text-heading {',
      '    margin: 0;',
      '    font-family: var(--gh-font-heading, var(--font-sans));',
      '    font-size: calc(clamp(2.8rem, 1.36vw + 2.25rem, 4rem) * var(--factor, 1));',
      '    font-weight: 700;',
      '    letter-spacing: -0.03em;',
      '    line-height: 1.1;',
      '    color: inherit;',
      '}',
      '',
      '.gd-image-text-description {',
      '    margin: 0;',
      '    font-size: 1.6rem;',
      '    line-height: 1.6;',
      '    letter-spacing: -0.014em;',
      '    color: inherit;',
      '    opacity: 0.9;',
      '}',
      '',
      '.gd-image-text-buttons {',
      '    display: flex;',
      '    gap: 12px;',
      '    align-items: center;',
      '    flex-wrap: wrap;',
      '}',
      '',
      '.gd-image-text-buttons > :not(.kg-button-card) {',
      '    display: none !important;',
      '}',
      '',
      '.gd-image-text-buttons .kg-button-card {',
      '    margin: 0;',
      '    display: inline-flex;',
      '}',
      '',
      '.gd-image-text-buttons .kg-button-card .kg-btn {',
      '    display: inline-flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    min-height: 46px;',
      '    padding: 0 1.2em;',
      '    border-radius: var(--gd-image-text-button-radius);',
      '    font-size: 1.05em;',
      '    font-weight: 600;',
      '    line-height: 1em;',
      '    letter-spacing: 0.2px;',
      '    text-decoration: none;',
      '    white-space: nowrap;',
      '    background-color: var(--gd-image-text-button-color);',
      '    color: var(--gd-image-text-button-text-color);',
      '}',
      '',
      '.gd-image-text-buttons .kg-button-card .kg-btn:hover {',
      '    opacity: 0.85;',
      '}',
      '',
      '.gd-image-text-align-left .gd-image-text-text {',
      '    text-align: left;',
      '    align-items: flex-start;',
      '}',
      '',
      '.gd-image-text-align-center .gd-image-text-text {',
      '    text-align: center;',
      '    align-items: center;',
      '}',
      '',
      '.gd-image-text-align-right .gd-image-text-text {',
      '    text-align: right;',
      '    align-items: flex-end;',
      '}',
      '',
      '.gd-image-text-hide-heading .gd-image-text-heading {',
      '    display: none;',
      '}',
      '</style>'
    ].join('\n')

    // Prepend style block to content
    content = styleBlock + '\n' + content

    const sectionClasses: string[] = []
    if (!showHeader) {
      sectionClasses.push('gd-image-text-hide-heading')
    }
    sectionClasses.push(`gd-image-text-align-${headerAlignment}`)
    const sectionClassInsertion = sectionClasses.length ? ' ' + sectionClasses.join(' ') : ''
    content = content.replace('{{!-- defalt-image-with-text-section-classes --}}', sectionClassInsertion)

    const contentClassInsertion = `${imagePosition === 'right' ? ' gd-image-text-image-right' : ''}${contentAlignmentClass}`
    content = content.replace('{{!-- defalt-image-with-text-content-classes --}}', contentClassInsertion)

    // Replace tag filters with this instance's tag
    const filterPlaceholders = [
      'filter="tag:hash-image-with-text"',
      "filter='tag:hash-image-with-text'"
    ]
    filterPlaceholders.forEach((placeholder) => {
      if (content.includes(placeholder)) {
        content = content.replace(new RegExp(placeholder, 'g'), `filter="tag:${slugTag}"`)
      }
    })

    // Update placeholder text to show correct tag for this instance
    content = content.replace(
      /<code>#image-with-text<\/code>/g,
      `<code>${internalTag}</code>`
    )

    await fs.writeFile(partialPath, content, 'utf-8')
  }
}

/**
 * Reorders footer sections and applies spacing/visibility rules before export.
 *
 * @param themeDir - Path to the theme files.
 * @param config - Current editor configuration (footer order + settings).
 */
export async function applyFooterCustomization(themeDir: string, config: ThemeConfig) {
  const footerPath = path.join(themeDir, 'partials', 'components', 'footer.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(footerPath, 'utf-8')
  } catch {
    return
  }

  const sections = config.sections || {}
  const includeSignup = sections.footerSignup?.settings?.visible !== false
  const includeBar = sections.footerBar?.settings?.visible !== false

  type FooterKey = 'footerSignup' | 'footerBar'
  const markers: Record<FooterKey, { start: string, end: string }> = {
    footerSignup: {
      start: '{{!-- defalt-footer-signup-start --}}',
      end: '{{!-- defalt-footer-signup-end --}}'
    },
    footerBar: {
      start: '{{!-- defalt-footer-bar-start --}}',
      end: '{{!-- defalt-footer-bar-end --}}'
    }
  }

  const blocks = new Map<FooterKey, { start: number, end: number, content: string }>()
  let regionStart = Infinity
  let regionEnd = -Infinity
  const missingMarkers: FooterKey[] = []
  const lowerContent = originalContent.toLowerCase()

  const markerKeys = Object.keys(markers) as FooterKey[]
  for (const key of markerKeys) {
    const { start, end } = markers[key]
    const lowerStart = start.toLowerCase()
    const lowerEnd = end.toLowerCase()
    const startIndex = lowerContent.indexOf(lowerStart)
    if (startIndex === -1) {
      missingMarkers.push(key)
      continue
    }
    const endIndex = lowerContent.indexOf(lowerEnd, startIndex)
    if (endIndex === -1) {
      missingMarkers.push(key)
      continue
    }
    const blockEnd = endIndex + lowerEnd.length
    const content = originalContent.slice(startIndex, blockEnd)
    blocks.set(key, { start: startIndex, end: blockEnd, content })
    regionStart = Math.min(regionStart, startIndex)
    regionEnd = Math.max(regionEnd, blockEnd)
  }

  if (missingMarkers.length > 0) {
    throw new Error(`Missing footer markers: ${missingMarkers.join(', ')}. Ensure the Defalt footer comment anchors are present.`)
  }

  if (!blocks.size || regionStart === Infinity || regionEnd === -Infinity) {
    throw new Error('Unable to locate footer customization region. Verify footer comment anchors are present.')
  }

  const sortedBlocks = Array.from(blocks.values()).sort((a, b) => a.start - b.start)
  const separator = sortedBlocks.length > 1
    ? originalContent.slice(sortedBlocks[0].end, sortedBlocks[1].start)
    : '\n\n'

  const requestedOrder = Array.isArray(config.order?.footer) ? config.order.footer : []
  const validOrder = requestedOrder.filter((key): key is FooterKey => key === 'footerSignup' || key === 'footerBar')
  const fallbackOrder: FooterKey[] = ['footerBar', 'footerSignup']
  const resolvedOrder = validOrder.length > 0 ? validOrder : fallbackOrder

  const includeMap: Record<FooterKey, boolean> = {
    footerSignup: includeSignup,
    footerBar: includeBar
  }

  const orderedBlocks: string[] = []
  const added = new Set<FooterKey>()

  for (const key of resolvedOrder) {
    if (added.has(key)) {
      continue
    }
    const entry = blocks.get(key)
    if (entry) {
      // Wrap in hidden div if not visible, otherwise include as-is
      if (includeMap[key]) {
        orderedBlocks.push(entry.content)
      } else {
        orderedBlocks.push(`<div class="hidden">\n${entry.content}\n</div>`)
      }
      added.add(key)
    }
  }

  for (const key of markerKeys) {
    if (added.has(key)) {
      continue
    }
    const entry = blocks.get(key)
    if (entry) {
      // Wrap in hidden div if not visible, otherwise include as-is
      if (includeMap[key]) {
        orderedBlocks.push(entry.content)
      } else {
        orderedBlocks.push(`<div class="hidden">\n${entry.content}\n</div>`)
      }
      added.add(key)
    }
  }

  const newRegion = orderedBlocks.join(separator)

  const reorderedContent = `${originalContent.slice(0, regionStart)}${newRegion}${originalContent.slice(regionEnd)}`

  let updatedContent = reorderedContent

  const footerBarSettings = sections.footerBar?.settings as (SectionSettings & { margin?: SectionMargin }) | undefined
  const footerBarMarginDefault = CSS_DEFAULT_MARGIN.footerBar?.bottom ?? 30
  const footerBarMarginBottom = Math.max(
    0,
    Math.round(
      typeof footerBarSettings?.margin?.bottom === 'number'
        ? footerBarSettings.margin.bottom
        : footerBarMarginDefault
    )
  )

  // Footer container margin-top customization
  const footerMarginDefault = CSS_DEFAULT_MARGIN.footer?.top ?? 172
  const footerMarginTop = Math.max(
    0,
    Math.round(
      typeof config.footerMargin?.top === 'number'
        ? config.footerMargin.top
        : footerMarginDefault
    )
  )

  // Style block (prepended to template content)
  const styleBlock = [
    '<style>',
    '.gh-footer {',
    `    --defalt-footer-margin-top: ${footerMarginTop}px;`,
    '    margin-top: var(--defalt-footer-margin-top);',
    '}',
    '.gh-footer-bar {',
    `    --defalt-footer-bar-margin-bottom: ${footerBarMarginBottom}px;`,
    '    margin-bottom: var(--defalt-footer-bar-margin-bottom);',
    '}',
    '</style>'
  ].join('\n')

  // Prepend style block to content
  updatedContent = styleBlock + '\n' + updatedContent

  if (updatedContent !== originalContent) {
    await fs.writeFile(footerPath, updatedContent, 'utf-8')
  }
}

/**
 * Applies custom spacing/visibility overrides to the static page template.
 *
 * @param themeDir - Theme root directory.
 * @param pageConfig - Page configuration for the generic `page.hbs`.
 */
export async function applyPageTemplateCustomization(themeDir: string, pageConfig: ThemePageConfig) {
  const pagePath = path.join(themeDir, 'page.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(pagePath, 'utf-8')
  } catch {
    return
  }

  const sections = pageConfig.sections || {}
  const mainHidden = sections.main?.settings?.visible === false
  const isHidden = (key: string) => sections[key]?.settings?.visible === false

  // Helper to wrap matched content in hidden div instead of removing
  const wrapInHidden = (content: string, regex: RegExp): string => {
    return content.replace(regex, (match) => `<div class="hidden">\n${match}\n</div>`)
  }

  // Wrap page wrapper in hidden div if hidden
  if (isHidden('page') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-page-start --\}\}[\s\S]*?\{\{!-- defalt-page-end --\}\}/g
    )
  }

  // Wrap page content in hidden div if hidden
  if (isHidden('page-content') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-page-content-start --\}\}[\s\S]*?\{\{!-- defalt-page-content-end --\}\}/g
    )
  }

  await fs.writeFile(pagePath, originalContent, 'utf-8')
}

/**
 * Applies custom spacing/visibility overrides to the post template prior export.
 *
 * @param themeDir - Theme root directory.
 * @param postConfig - Page configuration describing post layout.
 */
export async function applyPostTemplateCustomization(themeDir: string, postConfig: ThemePageConfig) {
  const postPath = path.join(themeDir, 'post.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(postPath, 'utf-8')
  } catch {
    return
  }

  const sections = postConfig.sections || {}
  const mainHidden = sections.main?.settings?.visible === false
  const isHidden = (key: string) => sections[key]?.settings?.visible === false

  // Helper to wrap matched content in hidden div instead of removing
  const wrapInHidden = (content: string, regex: RegExp): string => {
    return content.replace(regex, (match) => `<div class="hidden">\n${match}\n</div>`)
  }

  // Wrap post wrapper in hidden div if hidden
  if (isHidden('post') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-start --\}\}[\s\S]*?\{\{!-- defalt-post-start-end --\}\}/g
    )
  }

  // Wrap post article in hidden div if hidden
  if (isHidden('post-article') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-article-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-end --\}\}/g
    )
  }

  // Wrap post article header in hidden div if hidden
  if (isHidden('post-article-header') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-article-header-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-header-end --\}\}/g
    )
  }

  // Wrap post article tag in hidden div if hidden
  if (isHidden('post-article-tag') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-article-tag-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-tag-end --\}\}/g
    )
  }

  // Wrap post article title in hidden div if hidden
  if (isHidden('post-article-title') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-article-title-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-title-end --\}\}/g
    )
  }

  // Wrap post article content in hidden div if hidden
  if (isHidden('post-article-content') || mainHidden) {
    originalContent = wrapInHidden(
      originalContent,
      /\{\{!-- defalt-post-article-content-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-content-end --\}\}/g
    )
  }

  await fs.writeFile(postPath, originalContent, 'utf-8')
}
