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
