import fs from 'fs/promises'
import path from 'path'
import {
  extractHeaderSettings,
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  normalizeAnnouncementBarConfig,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
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
  SectionPadding,
  SectionMargin,
} from '../../defalt-utils/config/themeConfig.js'
import { getSectionDefinition, type HeroSectionConfig, type GhostCardsSectionConfig, type GhostGridSectionConfig, type ImageWithTextSectionConfig } from '../../defalt-sections/definitions/definitions.js'
import { sanitizeHref } from '../../defalt-sections/definitions/sectionTypes.js'

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
    'ghostCards': /^ghost-cards?(-(\d+))?$/i,
    'image-with-text': /^image-with-text(-(\d+))?$/i,
  }
  const pattern = basePatterns[definitionId]
  if (pattern) {
    const match = sectionKey.match(pattern)
    if (match && match[2]) {
      return `-${match[2]}`
    }
  }
  return ''
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
        headerInserted = true
      }
    } else if (key === 'featured') {
      // Featured posts section - separate toggle from subheader, only appears with Magazine style
      const featuredVisible = sections.featured?.settings?.visible !== false
      if (featuredVisible) {
        sectionSnippets.push('{{#match @custom.header_style "Magazine"}}')
        sectionSnippets.push('    {{> "components/featured" showFeatured=@custom.show_featured_posts limit=4}}')
        sectionSnippets.push('{{/match}}')
        sectionSnippets.push('')
        sectionSnippets.push('{{> "components/cta"}}')
      }
    } else if (key === 'main') {
      // Only include main content if visible
      const mainVisible = sections[key]?.settings?.visible !== false
      if (mainVisible) {
        sectionSnippets.push('{{> "components/post-list" feed="home" postFeedStyle=@custom.post_feed_style showTitle=true showSidebar=@custom.show_publication_info_sidebar}}')
      }
    } else {
      const sectionConfig = sections[key]

      // Check visibility for all sections
      const sectionVisible = sectionConfig?.settings?.visible !== false
      if (!sectionVisible) {
        continue
      }

      const definitionId = sectionConfig?.settings?.definitionId
      if (!definitionId) {
        continue
      }
      const definition = getSectionDefinition(definitionId)
      if (!definition) {
        continue
      }
      if (definitionId === 'hero') {
        // Hero section is not exported yet (keep internal-only)
        continue
      } else if (definitionId === 'ghostCards') {
        // Ghost Cards section uses defalt-ghost-cards.hbs partial (customized by applyGhostCardsCustomization)
        // Multiple instances get unique partials: defalt-ghost-cards.hbs, defalt-ghost-cards-2.hbs, etc.
        const suffix = getSectionInstanceSuffix(key, definitionId)
        sectionSnippets.push(`{{> "sections/defalt-ghost-cards${suffix}"}}`)
      } else if (definitionId === 'ghostGrid') {
        // Ghost Grid section uses defalt-ghost-grid.hbs partial (customized by applyGhostGridCustomization)
        sectionSnippets.push('{{> "sections/defalt-ghost-grid"}}')
      } else if (definitionId === 'image-with-text') {
        // Image with Text section uses defalt-image-with-text.hbs partial
        // Multiple instances get unique partials: defalt-image-with-text.hbs, defalt-image-with-text-2.hbs, etc.
        const suffix = getSectionInstanceSuffix(key, definitionId)
        sectionSnippets.push(`{{> "sections/defalt-image-with-text${suffix}"}}`)
      } else {
        const providedConfig = sectionConfig?.settings?.customConfig ?? {}
        const finalConfig = {
          ...definition.createConfig(),
          ...providedConfig
        }
        const sectionPadding = resolveSectionPadding(sectionConfig, definition.defaultPadding)
        sectionSnippets.push(definition.renderHtml(finalConfig, { padding: sectionPadding }))
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

  if (!headerVisible) {
    const placeholder = [
      '{{!-- Defalt header hidden placeholder --}}',
      '<div class="defalt-settings-placeholder" hidden>',
      '  {{@custom.header_text}}',
      '  {{#if @custom.background_image}}true{{/if}}',
      '</div>',
      ''
    ].join('\n')

    await fs.writeFile(navigationPath, placeholder, 'utf-8')
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
 * hero sections, announcement bar visibility, and custom CSS.
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
  const announcementSectionVisible = sections['announcement-bar']?.settings?.visible
  const announcementBarVisible = typeof announcementSectionVisible === 'boolean'
    ? announcementSectionVisible
    : headerSettings?.announcementBarVisible ?? true
  const navigationVisible = headerSettings?.visible !== false

  // Remove announcement bar block if not visible
  if (!announcementBarVisible) {
    const markerStart = '{{!-- defalt-announcement-bar-start --}}'
    const markerEnd = '{{!-- defalt-announcement-bar-end --}}'
    const lowerContent = originalContent.toLowerCase()
    const startIdx = lowerContent.indexOf(markerStart.toLowerCase())
    const endIdx = lowerContent.indexOf(markerEnd.toLowerCase(), startIdx)

    if (startIdx !== -1 && endIdx !== -1) {
      const blockEnd = endIdx + markerEnd.length
      originalContent = originalContent.slice(0, startIdx) + originalContent.slice(blockEnd)
    }
  }

  // Remove navigation block if not visible
  if (!navigationVisible) {
    const markerStart = '{{!-- defalt-navigation-start --}}'
    const markerEnd = '{{!-- defalt-navigation-end --}}'
    const lowerContent = originalContent.toLowerCase()
    const startIdx = lowerContent.indexOf(markerStart.toLowerCase())
    const endIdx = lowerContent.indexOf(markerEnd.toLowerCase(), startIdx)

    if (startIdx !== -1 && endIdx !== -1) {
      const blockEnd = endIdx + markerEnd.length
      originalContent = originalContent.slice(0, startIdx) + originalContent.slice(blockEnd)
    }
  }

  await fs.writeFile(defaultTemplatePath, originalContent, 'utf-8')
}

/**
 * Injects announcement bar markup/styles into the compiled theme output.
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 * @param document - Optional theme document for resolving defaults.
 */
export async function applyAnnouncementBarCustomization(themeDir: string, config: ThemeConfig, document?: ThemeDocument) {
  const partialPath = path.join(themeDir, 'partials', 'sections', 'announcement-bar.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(partialPath, 'utf-8')
  } catch {
    return
  }

  const headerSettings = config.sections.header?.settings as (SectionSettings & {
    announcementBarConfig?: AnnouncementBarConfig,
    announcementContentConfig?: AnnouncementContentConfig
  }) | undefined
  const normalizedConfig = normalizeAnnouncementBarConfig(
    headerSettings?.announcementBarConfig ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
    DEFAULT_ANNOUNCEMENT_BAR_CONFIG
  )
  const contentConfig = normalizeAnnouncementContentConfig(
    headerSettings?.announcementContentConfig ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
    DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
    headerSettings?.announcementBarConfig
  )

  const accentReference = (document?.accentColor ?? DEFAULT_HEADER_SETTINGS.accentColor)?.toLowerCase() ?? ''
  const backgroundColorValue = normalizedConfig.backgroundColor.toLowerCase() === accentReference
    ? 'var(--ghost-accent-color)'
    : normalizedConfig.backgroundColor

  const styleBlock = [
    '{{!-- defalt-announcement-bar-style-start --}}',
    '<style>',
    '.announcement-bar {',
    `    --announcement-bar-padding-top: ${normalizedConfig.paddingTop}px;`,
    `    --announcement-bar-padding-bottom: ${normalizedConfig.paddingBottom}px;`,
    `    --announcement-bar-background-color: ${backgroundColorValue};`,
    `    --announcement-bar-text-color: ${normalizedConfig.textColor};`,
    `    --announcement-bar-divider-thickness: ${normalizedConfig.dividerThickness}px;`,
    '    background-color: var(--announcement-bar-background-color);',
    '    color: var(--announcement-bar-text-color);',
    '    padding-top: var(--announcement-bar-padding-top);',
    '    padding-bottom: var(--announcement-bar-padding-bottom);',
    '    text-align: center;',
    '    display: flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    position: relative;',
    '    border-bottom: var(--announcement-bar-divider-thickness) solid var(--color-light-gray);',
    '}',
    '',
    '.announcement-bar.gh-inner {',
    '    max-width: var(--container-width);',
    '    margin-left: auto;',
    '    margin-right: auto;',
    '}',
    '',
    '.announcement-bar__text {',
      '    display: inline-flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    flex-wrap: wrap;',
    '    column-gap: 1.2rem;',
    '    row-gap: 0.6rem;',
    '    font-size: 1.4rem;',
    '    line-height: 1.8rem;',
    '    font-weight: 500;',
    '    letter-spacing: 0.03em;',
    '}',
    '',
    '.announcement-bar__copy {',
      '    display: inline-flex;',
      '    align-items: center;',
      '    white-space: pre-wrap;',
    '}',
    '',
    '.announcement-bar__copy a {',
      '    color: inherit;',
      '    text-decoration: none;',
    '}',
    '',
    '.announcement-bar--underline-links .announcement-bar__copy a {',
      '    text-decoration: underline;',
    '}',
    '',
    '.announcement-bar__copy--rich {',
      '    display: inline-flex;',
      '    flex-wrap: wrap;',
      '    align-items: center;',
      '    justify-content: center;',
    '}',
    '',
    '.announcement-bar__copy--rich > p {',
      '    margin: 0;',
      '    display: inline;',
    '}',
    '',
    '.announcement-bar__copy--rich > :not(p:first-of-type) {',
      '    display: none !important;',
    '}',
    '',
    '.announcement-bar--size-small .announcement-bar__text {',
    '    font-size: 1.2rem;',
    '    line-height: 1.6rem;',
    '}',
    '.announcement-bar--size-large .announcement-bar__text {',
    '    font-size: 1.6rem;',
    '    line-height: 2rem;',
    '}',
    '.announcement-bar--size-x-large .announcement-bar__text {',
    '    font-size: 1.8rem;',
    '    line-height: 2.2rem;',
    '}',
    '.announcement-bar--weight-light .announcement-bar__text {',
    '    font-weight: 400;',
    '}',
    '.announcement-bar--weight-bold .announcement-bar__text {',
    '    font-weight: 600;',
    '}',
    '.announcement-bar--spacing-tight .announcement-bar__text {',
    '    letter-spacing: 0.01em;',
    '}',
    '.announcement-bar--spacing-wide .announcement-bar__text {',
    '    letter-spacing: 0.08em;',
    '}',
    '.announcement-bar--uppercase .announcement-bar__text {',
    '    text-transform: uppercase;',
    '}',
    '',
    '</style>',
    '{{!-- defalt-announcement-bar-style-end --}}'
  ].join('\n')

  const classNames: string[] = []
  if (contentConfig.typographySize === 'small') {
    classNames.push('announcement-bar--size-small')
  } else if (contentConfig.typographySize === 'large') {
    classNames.push('announcement-bar--size-large')
  } else if (contentConfig.typographySize === 'x-large') {
    classNames.push('announcement-bar--size-x-large')
  }
  if (contentConfig.typographyWeight === 'light') {
    classNames.push('announcement-bar--weight-light')
  } else if (contentConfig.typographyWeight === 'bold') {
    classNames.push('announcement-bar--weight-bold')
  }
  if (contentConfig.typographySpacing === 'tight') {
    classNames.push('announcement-bar--spacing-tight')
  } else if (contentConfig.typographySpacing === 'wide') {
    classNames.push('announcement-bar--spacing-wide')
  }
  if (contentConfig.typographyCase === 'uppercase') {
    classNames.push('announcement-bar--uppercase')
  }
  if (contentConfig.underlineLinks) {
    classNames.push('announcement-bar--underline-links')
  }
  if (normalizedConfig.width === 'narrow') {
    classNames.push('gh-inner')
  }

  const classInsertion = classNames.length > 0 ? ` ${classNames.join(' ')}` : ''

  const styleStart = '{{!-- defalt-announcement-bar-style-start --}}'
  const styleEnd = '{{!-- defalt-announcement-bar-style-end --}}'
  const startIdx = originalContent.indexOf(styleStart)
  const endIdx = originalContent.indexOf(styleEnd, startIdx)
  if (startIdx !== -1 && endIdx !== -1) {
    const blockEnd = endIdx + styleEnd.length
    originalContent = originalContent.slice(0, startIdx) + styleBlock + originalContent.slice(blockEnd)
  }

  originalContent = originalContent.replace('{{!-- defalt-announcement-bar-classes --}}', classInsertion)

  const previewBlockStart = '{{!-- defalt-announcement-bar-preview-start --}}'
  const previewBlockEnd = '{{!-- defalt-announcement-bar-preview-end --}}'
  const previewStartIdx = originalContent.indexOf(previewBlockStart)
  const previewEndIdx = originalContent.indexOf(previewBlockEnd, previewStartIdx)
  if (previewStartIdx !== -1 && previewEndIdx !== -1) {
    const blockEnd = previewEndIdx + previewBlockEnd.length
    originalContent = originalContent.slice(0, previewStartIdx) + originalContent.slice(blockEnd)
  }

  await fs.writeFile(partialPath, originalContent, 'utf-8')
}

/**
 * Applies Hero section customization based on user configuration.
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 */
export async function applyHeroCustomization(themeDir: string, config: ThemeConfig) {
  const partialPath = path.join(themeDir, 'partials', 'sections', 'defalt-hero.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(partialPath, 'utf-8')
  } catch {
    return
  }

  // Extract hero config from sections
  const heroSection = config.sections?.hero
  if (!heroSection) return

  const heroConfig = (heroSection.settings?.customConfig ?? {}) as Partial<HeroSectionConfig> & {
    placeholder?: Partial<HeroSectionConfig['placeholder']>
  }
  const padding = heroSection.settings.padding || { top: 32, bottom: 32 }
  const placeholder = {
    title: heroConfig.placeholder?.title ?? '',
    description: heroConfig.placeholder?.description ?? '',
    buttonText: heroConfig.placeholder?.buttonText ?? '',
    buttonHref: heroConfig.placeholder?.buttonHref ?? ''
  }

  const paddingTop = Math.max(0, Math.round(padding.top ?? 32))
  const paddingBottom = Math.max(0, Math.round(padding.bottom ?? 32))
  const backgroundColor = sanitizeHexColor(heroConfig.backgroundColor, '#000000')
  const buttonColor = sanitizeHexColor(heroConfig.buttonColor, '#ffffff')
  const buttonTextColor = sanitizeHexColor(heroConfig.buttonTextColor, '#151515')
  const cardBorderRadius = Math.max(0, Math.min(96, Math.round(heroConfig.cardBorderRadius ?? 24)))
  const heightMode = heroConfig.heightMode === 'expand' ? 'expand' : 'regular'
  const innerPadding = heightMode === 'expand' ? 92 : 64
  const contentAlignment = heroConfig.contentAlignment || 'center'
  const contentWidth = heroConfig.contentWidth || 'full'
  const showButton = heroConfig.showButton !== false

  const effectiveCardBorderRadius = contentWidth === 'full' ? 0 : cardBorderRadius

  // Style block
  const styleBlock = [
    '{{!-- defalt-hero-style-start --}}',
    '<style>',
    '.gd-hero-section {',
    `    --gd-hero-padding-top: ${paddingTop}px;`,
    `    --gd-hero-padding-bottom: ${paddingBottom}px;`,
    `    --gd-hero-card-radius: ${effectiveCardBorderRadius}px;`,
    `    --gd-hero-background: ${backgroundColor};`,
    '    --gd-hero-text-color: #ffffff;',
    `    --gd-hero-inner-padding-top: ${innerPadding}px;`,
    `    --gd-hero-inner-padding-bottom: ${innerPadding}px;`,
    `    --gd-hero-button-color: ${buttonColor};`,
    `    --gd-hero-button-text-color: ${buttonTextColor};`,
    '    --gd-hero-button-radius: 3px;',
    '    padding-top: var(--gd-hero-padding-top);',
    '    padding-bottom: var(--gd-hero-padding-bottom);',
    '}',
    '',
    '.gd-hero-section.gd-hero-section-regular {',
    '    padding-left: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));',
    '    padding-right: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));',
    '}',
    '',
    '.gh-hero {',
    '    border-radius: var(--gd-hero-card-radius, 0px);',
    '    overflow: hidden;',
    '}',
    '',
    '.gd-hero-card {',
    '    background-color: var(--gd-hero-background);',
    '    color: var(--gd-hero-text-color);',
    '    padding-top: var(--gd-hero-inner-padding-top);',
    '    padding-bottom: var(--gd-hero-inner-padding-bottom);',
    '    padding-left: clamp(2.5rem, 6vw, 4em);',
    '    padding-right: clamp(2.5rem, 6vw, 4em);',
    '    display: flex;',
    '    justify-content: center;',
    '    border-radius: var(--gd-hero-card-radius);',
    '    overflow: hidden;',
    '}',
    '',
    '.gd-hero-content {',
    '    display: flex;',
    '    flex-direction: column;',
    '    gap: 1.5rem;',
    '    align-items: center;',
    '    width: 100%;',
    '    margin: 0 auto;',
    '    text-align: center;',
    '}',
    '',
    '.gd-hero-content.gd-align-left {',
    '    align-items: flex-start;',
    '    text-align: left;',
    '}',
    '',
    '.gd-hero-content.gd-align-right {',
    '    align-items: flex-end;',
    '    text-align: right;',
    '}',
    '',
    '.gd-hero-content.gd-width-regular {',
    '    max-width: var(--container-width, 1120px);',
    '    padding-left: var(--container-gap, 32px);',
    '    padding-right: var(--container-gap, 32px);',
    '}',
    '',
    '.gd-hero-content.gd-width-full {',
    '    max-width: none;',
    '}',
    '',
    '.gd-hero-content.gd-width-full.gd-align-left {',
    '    margin-left: 0;',
    '    margin-right: auto;',
    '}',
    '',
    '.gd-hero-content.gd-width-full.gd-align-right {',
    '    margin-left: auto;',
    '    margin-right: 0;',
    '}',
    '',
    '.gd-hero-heading {',
    '    margin: 0;',
    '    font-family: var(--gh-font-heading, var(--font-sans));',
    '    font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));',
    '    letter-spacing: -0.028em;',
    '    line-height: 1.1;',
    '    color: inherit;',
    '}',
    '',
    '.gd-hero-subheading {',
    '    margin: 12px 0 0;',
    '    max-width: 640px;',
    '    font-size: 1.8rem;',
    '    font-weight: 450;',
    '    line-height: 1.4;',
    '    letter-spacing: -0.014em;',
    '    color: inherit;',
    '}',
    '',
    '.gd-hero-placeholder {',
    '    opacity: 0.65;',
    '}',
    '',
    '.gd-hero-button.gd-hero-placeholder,',
    '.gd-hero-card .kg-button-card.gd-hero-placeholder,',
    '.gd-hero-card .kg-button-card .kg-btn.gd-hero-placeholder {',
    '    opacity: 0.7;',
    '}',
    '',
    '.gd-hero-content-placeholder .kg-button-card,',
    '.gd-hero-content-placeholder .kg-button-card .kg-btn {',
    '    opacity: 0.7;',
    '}',
    '',
    '.gd-hero-button {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    height: 2.7em;',
    '    min-height: 46px;',
    '    padding: 0 1.2em;',
    '    border-radius: var(--gd-hero-button-radius);',
    '    font-size: 1.05em;',
    '    font-weight: 600;',
    '    line-height: 1em;',
    '    text-decoration: none;',
    '    letter-spacing: 0.2px;',
    '    white-space: nowrap;',
    '    text-overflow: ellipsis;',
    '    background-color: var(--gd-hero-button-color);',
    '    color: var(--gd-hero-button-text-color);',
    '    margin-top: 2em;',
    '}',
    '',
    '.gd-hero-button:hover {',
    '    opacity: 0.85;',
    '}',
    '',
    '.gd-hero-card .kg-button-card {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    margin-top: 2em;',
    '}',
    '',
    '.gd-hero-card .kg-button-card .kg-btn {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    justify-content: center;',
    '    min-height: 46px;',
    '    padding: 0 1.2em;',
    '    border-radius: var(--gd-hero-button-radius);',
    '    font-size: 1.05em;',
    '    font-weight: 600;',
    '    line-height: 1em;',
    '    letter-spacing: 0.2px;',
    '    text-decoration: none;',
    '    white-space: nowrap;',
    '    background-color: var(--gd-hero-button-color);',
    '    color: var(--gd-hero-button-text-color);',
    '}',
    '',
    '.gd-hero-card .kg-button-card .kg-btn:hover {',
    '    opacity: 0.85;',
    '}',
    '</style>',
    '{{!-- defalt-hero-style-end --}}'
  ].join('\n')

  // Replace style block
  const styleStartMarker = '{{!-- defalt-hero-style-start --}}'
  const styleEndMarker = '{{!-- defalt-hero-style-end --}}'
  const styleStartIdx = originalContent.indexOf(styleStartMarker)
  const styleEndIdx = originalContent.indexOf(styleEndMarker)
  if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
    const before = originalContent.slice(0, styleStartIdx)
    const after = originalContent.slice(styleEndIdx + styleEndMarker.length)
    originalContent = before + styleBlock + after
  }

  // Replace section classes
  const sectionClassInsertion = contentWidth === 'regular' ? ' gd-hero-section-regular' : ''
  originalContent = originalContent.replace('{{!-- defalt-hero-section-classes --}}', sectionClassInsertion)

  // Replace content classes
  const alignmentClass = contentAlignment === 'left' ? 'gd-align-left' : contentAlignment === 'right' ? 'gd-align-right' : 'gd-align-center'
  const widthClass = contentWidth === 'regular' ? 'gd-width-regular' : 'gd-width-full'
  const contentClassInsertion = ` ${alignmentClass} ${widthClass}`
  originalContent = originalContent.replace('{{!-- defalt-hero-content-classes --}}', contentClassInsertion)

  // Replace content
  const titleValue = typeof placeholder.title === 'string' ? placeholder.title : ''
  const titleTrimmed = titleValue.trim()
  const descriptionValue = typeof placeholder.description === 'string' ? placeholder.description : ''
  const descriptionTrimmed = descriptionValue.trim()
  const buttonValue = typeof placeholder.buttonText === 'string' ? placeholder.buttonText : ''
  const buttonTrimmed = buttonValue.trim()
  const buttonHrefValue = typeof placeholder.buttonHref === 'string' ? placeholder.buttonHref : ''
  const buttonHrefTrimmed = buttonHrefValue.trim()

  const displayTitle = titleTrimmed || 'Enter heading text'
  const displayDescription = descriptionTrimmed || 'Enter subheading text'
  const displayButtonText = buttonTrimmed || 'Add button text'
  const displayButtonHref = buttonHrefTrimmed || '#'

  const contentLines: string[] = []
  contentLines.push(`            <h2 class="gd-hero-heading${titleTrimmed ? '' : ' gd-hero-placeholder'}"><span style="white-space: pre-wrap;">${escapeHandlebarsString(displayTitle)}</span></h2>`)
  if (displayDescription) {
    contentLines.push(`            <p class="gd-hero-subheading${descriptionTrimmed ? '' : ' gd-hero-placeholder'}"><span style="white-space: pre-wrap;">${escapeHandlebarsString(displayDescription)}</span></p>`)
  }
  if (showButton && displayButtonText) {
    contentLines.push(`            <a href="${sanitizeHref(displayButtonHref)}" class="gd-hero-button${buttonTrimmed ? '' : ' gd-hero-placeholder'}">${escapeHandlebarsString(displayButtonText)}</a>`)
  }

  const contentHtml = contentLines.join('\n')
  const contentStartMarker = '{{!-- defalt-hero-content-start --}}'
  const contentEndMarker = '{{!-- defalt-hero-content-end --}}'
  const contentStartIdx = originalContent.indexOf(contentStartMarker)
  const contentEndIdx = originalContent.indexOf(contentEndMarker)
  if (contentStartIdx !== -1 && contentEndIdx !== -1 && contentEndIdx > contentStartIdx) {
    const before = originalContent.slice(0, contentStartIdx + contentStartMarker.length)
    const after = originalContent.slice(contentEndIdx)
    originalContent = before + '\n' + contentHtml + '\n            ' + after
  }

  await fs.writeFile(partialPath, originalContent, 'utf-8')
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

  const styleBlock = [
    '{{!-- defalt-main-style-start --}}',
    '<style>',
    '.defalt-main-section {',
    `    --defalt-main-padding-top: ${resolvedPadding.top}px;`,
    `    --defalt-main-padding-bottom: ${resolvedPadding.bottom}px;`,
    '    padding-top: var(--defalt-main-padding-top);',
    '    padding-bottom: var(--defalt-main-padding-bottom);',
    '}',
    '</style>',
    '{{!-- defalt-main-style-end --}}'
  ].join('\n')

  const styleStartMarker = '{{!-- defalt-main-style-start --}}'
  const styleEndMarker = '{{!-- defalt-main-style-end --}}'
  const styleStartIdx = originalContent.indexOf(styleStartMarker)
  const styleEndIdx = originalContent.indexOf(styleEndMarker)
  if (styleStartIdx === -1 || styleEndIdx === -1 || styleEndIdx <= styleStartIdx) {
    return
  }

  const before = originalContent.slice(0, styleStartIdx)
  const after = originalContent.slice(styleEndIdx + styleEndMarker.length)
  const updatedContent = before + styleBlock + after

  if (updatedContent !== originalContent) {
    await fs.writeFile(partialPath, updatedContent, 'utf-8')
  }
}

/**
 * Applies Ghost Cards section customization based on user configuration.
 * Handles multiple instances by creating unique partials (defalt-ghost-cards.hbs, defalt-ghost-cards-2.hbs, etc.)
 *
 * @param themeDir - Path to the theme being customized.
 * @param config - Editor configuration containing section settings.
 */
export async function applyGhostCardsCustomization(themeDir: string, config: ThemeConfig) {
  const basePartialPath = path.join(themeDir, 'partials', 'sections', 'defalt-ghost-cards.hbs')

  let baseContent: string
  try {
    baseContent = await fs.readFile(basePartialPath, 'utf-8')
  } catch {
    return
  }

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
      ? path.join(themeDir, 'partials', 'sections', `defalt-ghost-cards${suffix}.hbs`)
      : basePartialPath

    let content = baseContent

    const cardsConfig = ((section.settings?.customConfig ?? {}) as Partial<GhostCardsSectionConfig>)
    const padding = section.settings.padding || { top: 32, bottom: 32, left: 0, right: 0 }
    const showHeader = cardsConfig.showHeader !== false
    const headerAlignment = cardsConfig.headerAlignment === 'left' || cardsConfig.headerAlignment === 'right'
      ? cardsConfig.headerAlignment
      : 'center'
    const titleSize = cardsConfig.titleSize === 'small' || cardsConfig.titleSize === 'large'
      ? cardsConfig.titleSize
      : 'normal'

    const paddingTop = Math.max(0, Math.round(padding.top ?? 32))
    const paddingBottom = Math.max(0, Math.round(padding.bottom ?? 32))
    const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
    const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

    // Get the tag for this specific instance
    const fallbackTag = suffix ? `#ghost-card${suffix}` : '#ghost-card'
    const internalTag = formatInternalTag(cardsConfig.ghostPageTag) || fallbackTag
    const slugTag = internalTag.length > 1 ? `hash-${internalTag.slice(1)}` : 'hash-ghost-card'

    const styleBlock = [
      '{{!-- defalt-ghost-cards-style-start --}}',
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
      '</style>',
      '{{!-- defalt-ghost-cards-style-end --}}'
    ].join('\n')

    const styleStartMarker = '{{!-- defalt-ghost-cards-style-start --}}'
    const styleEndMarker = '{{!-- defalt-ghost-cards-style-end --}}'
    const styleStartIdx = content.indexOf(styleStartMarker)
    const styleEndIdx = content.indexOf(styleEndMarker)
    if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
      const before = content.slice(0, styleStartIdx)
      const after = content.slice(styleEndIdx + styleEndMarker.length)
      content = before + styleBlock + after
    }

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
      'filter="tag:hash-cards-hide+tag:hash-ghost-card"'
    ]
    filterPlaceholders.forEach((placeholder) => {
      if (content.includes(placeholder)) {
        const replacement = placeholder.includes('hash-cards-hide')
          ? `filter="tag:hash-cards-hide+tag:${slugTag}"`
          : `filter="tag:${slugTag}"`
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
  const partialPath = path.join(themeDir, 'partials', 'sections', 'defalt-ghost-grid.hbs')

  let originalContent: string
  try {
    originalContent = await fs.readFile(partialPath, 'utf-8')
  } catch {
    return
  }

  const ghostGridSection = findSectionByDefinitionId(config, 'ghostGrid')
  if (!ghostGridSection) return

  const gridConfig = ((ghostGridSection.settings?.customConfig ?? {}) as Partial<GhostGridSectionConfig>)
  const padding = ghostGridSection.settings.padding || { top: 32, bottom: 32, left: 0, right: 0 }
  const showHeader = gridConfig.showHeader !== false
  const headerAlignment = gridConfig.headerAlignment === 'left' || gridConfig.headerAlignment === 'right'
    ? gridConfig.headerAlignment
    : 'center'
  const titleSize = gridConfig.titleSize === 'small' || gridConfig.titleSize === 'large'
    ? gridConfig.titleSize
    : 'normal'
  const stackOnMobile = gridConfig.stackOnMobile !== false
  const columnGap = (() => {
    const numericGap = typeof gridConfig.columnGap === 'number' && Number.isFinite(gridConfig.columnGap)
      ? gridConfig.columnGap
      : 20
    return Math.max(0, Math.min(100, Math.round(numericGap)))
  })()

  const paddingTop = Math.max(0, Math.round(padding.top ?? 32))
  const paddingBottom = Math.max(0, Math.round(padding.bottom ?? 32))
  const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
  const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

  const styleBlock = [
    '{{!-- defalt-ghost-grid-style-start --}}',
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
    '</style>',
    '{{!-- defalt-ghost-grid-style-end --}}'
  ].join('\n')

  const styleStartMarker = '{{!-- defalt-ghost-grid-style-start --}}'
  const styleEndMarker = '{{!-- defalt-ghost-grid-style-end --}}'
  const styleStartIdx = originalContent.indexOf(styleStartMarker)
  const styleEndIdx = originalContent.indexOf(styleEndMarker)
  if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
    const before = originalContent.slice(0, styleStartIdx)
    const after = originalContent.slice(styleEndIdx + styleEndMarker.length)
    originalContent = before + styleBlock + after
  }

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
  const basePartialPath = path.join(themeDir, 'partials', 'sections', 'defalt-image-with-text.hbs')

  let baseContent: string
  try {
    baseContent = await fs.readFile(basePartialPath, 'utf-8')
  } catch {
    return
  }

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
      ? path.join(themeDir, 'partials', 'sections', `defalt-image-with-text${suffix}.hbs`)
      : basePartialPath

    let content = baseContent

    const sectionConfig = ((section.settings?.customConfig ?? {}) as Partial<ImageWithTextSectionConfig>)
    const padding = resolveSectionPadding(section, { top: 32, bottom: 32, left: 0, right: 0 })
    const paddingTop = Math.max(0, Math.round(padding.top ?? 32))
    const paddingBottom = Math.max(0, Math.round(padding.bottom ?? 32))
    const paddingLeft = Math.max(0, Math.round(padding.left ?? 0))
    const paddingRight = Math.max(0, Math.round(padding.right ?? 0))

    const showHeader = sectionConfig.showHeader !== false
    const headerAlignment = sectionConfig.headerAlignment === 'left' || sectionConfig.headerAlignment === 'right'
      ? sectionConfig.headerAlignment
      : 'center'
    const imagePosition = sectionConfig.imagePosition === 'right' ? 'right' : 'left'
    const imageBorderRadius = typeof sectionConfig.imageBorderRadius === 'number' ? sectionConfig.imageBorderRadius : 0
    const contentAlignmentClass = headerAlignment === 'left'
      ? ' gd-align-left'
      : headerAlignment === 'right'
        ? ' gd-align-right'
        : ' gd-align-center'

    // Get the tag for this specific instance
    const fallbackTag = suffix ? `#image-with-text${suffix}` : '#image-with-text'
    const internalTag = formatInternalTag(sectionConfig.ghostPageTag) || fallbackTag
    const slugTag = internalTag.length > 1 ? `hash-${internalTag.slice(1)}` : 'hash-image-with-text'

    const styleBlock = [
      '{{!-- defalt-image-with-text-style-start --}}',
      '<style>',
      '.gd-image-text-section {',
      `    --gd-image-text-padding-top: ${paddingTop}px;`,
      `    --gd-image-text-padding-bottom: ${paddingBottom}px;`,
      `    --gd-image-text-padding-left: ${paddingLeft}px;`,
      `    --gd-image-text-padding-right: ${paddingRight}px;`,
      '    --gd-image-text-background: #ffffff;',
      '    --gd-image-text-text-color: #151515;',
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
      '    grid-template-columns: 1fr 1fr;',
      '    gap: 64px;',
      '    align-items: center;',
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
      '}',
      '',
      '.gd-image-text-image {',
      '    width: 100%;',
      '    aspect-ratio: 4/3;',
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
      '</style>',
      '{{!-- defalt-image-with-text-style-end --}}'
    ].join('\n')

    const styleStartMarker = '{{!-- defalt-image-with-text-style-start --}}'
    const styleEndMarker = '{{!-- defalt-image-with-text-style-end --}}'
    const styleStartIdx = content.indexOf(styleStartMarker)
    const styleEndIdx = content.indexOf(styleEndMarker)
    if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
      const before = content.slice(0, styleStartIdx)
      const after = content.slice(styleEndIdx + styleEndMarker.length)
      content = before + styleBlock + after
    }

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
    if (added.has(key) || !includeMap[key]) {
      added.add(key)
      continue
    }
    const entry = blocks.get(key)
    if (entry) {
      orderedBlocks.push(entry.content)
      added.add(key)
    }
  }

  for (const key of markerKeys) {
    if (added.has(key) || !includeMap[key]) {
      continue
    }
    const entry = blocks.get(key)
    if (entry) {
      orderedBlocks.push(entry.content)
      added.add(key)
    }
  }

  const newRegion = orderedBlocks.length > 0
    ? orderedBlocks.join(separator)
    : ''

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

  const footerBarStyleBlock = [
    '{{!-- defalt-footer-bar-style-start --}}',
    '<style>',
    '.gh-footer-bar {',
    `    --defalt-footer-bar-margin-bottom: ${footerBarMarginBottom}px;`,
    '    margin-bottom: var(--defalt-footer-bar-margin-bottom);',
    '}',
    '</style>',
    '{{!-- defalt-footer-bar-style-end --}}'
  ].join('\n')

  const footerBarStyleStart = '{{!-- defalt-footer-bar-style-start --}}'
  const footerBarStyleEnd = '{{!-- defalt-footer-bar-style-end --}}'
  const styleStartIdx = updatedContent.indexOf(footerBarStyleStart)
  const styleEndIdx = updatedContent.indexOf(footerBarStyleEnd)
  if (styleStartIdx !== -1 && styleEndIdx !== -1 && styleEndIdx > styleStartIdx) {
    const before = updatedContent.slice(0, styleStartIdx)
    const after = updatedContent.slice(styleEndIdx + footerBarStyleEnd.length)
    updatedContent = before + footerBarStyleBlock + after
  }

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

  const footerContainerStyleBlock = [
    '{{!-- defalt-footer-style-start --}}',
    '<style>',
    '.gh-footer {',
    `    --defalt-footer-margin-top: ${footerMarginTop}px;`,
    '    margin-top: var(--defalt-footer-margin-top);',
    '}',
    '</style>',
    '{{!-- defalt-footer-style-end --}}'
  ].join('\n')

  const footerStyleStart = '{{!-- defalt-footer-style-start --}}'
  const footerStyleEnd = '{{!-- defalt-footer-style-end --}}'
  const footerStyleStartIdx = updatedContent.indexOf(footerStyleStart)
  const footerStyleEndIdx = updatedContent.indexOf(footerStyleEnd)
  if (footerStyleStartIdx !== -1 && footerStyleEndIdx !== -1 && footerStyleEndIdx > footerStyleStartIdx) {
    const before = updatedContent.slice(0, footerStyleStartIdx)
    const after = updatedContent.slice(footerStyleEndIdx + footerStyleEnd.length)
    updatedContent = before + footerContainerStyleBlock + after
  }

  if (updatedContent !== originalContent) {
    await fs.writeFile(footerPath, updatedContent, 'utf-8')
  }

  // If footer signup is excluded, remove related custom settings to avoid Ghost "unused custom setting" errors.
  if (config.sections.footerSignup?.settings?.visible === false) {
    try {
      const packageJsonPath = path.join(themeDir, 'package.json')
      const pkgRaw = await fs.readFile(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(pkgRaw) as Record<string, unknown>
      const configNode = (pkg['config'] ?? {}) as Record<string, unknown>
      const customNode = (configNode['custom'] ?? {}) as Record<string, unknown>

      let mutated = false
      if ('signup_heading' in customNode) {
        delete customNode.signup_heading
        mutated = true
      }
      if ('signup_subheading' in customNode) {
        delete customNode.signup_subheading
        mutated = true
      }

      if (mutated) {
        configNode['custom'] = customNode
        pkg['config'] = configNode
        await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf-8')
      }
    } catch (pkgError) {
      console.error('Failed to remove signup custom fields from package.json', pkgError)
    }
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

  // Remove page wrapper if hidden
  if (isHidden('page') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-page-start --\}\}[\s\S]*?\{\{!-- defalt-page-end --\}\}/g,
      ''
    )
  }

  // Remove page content if hidden
  if (isHidden('page-content') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-page-content-start --\}\}[\s\S]*?\{\{!-- defalt-page-content-end --\}\}/g,
      ''
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

  // Remove post wrapper if hidden
  if (isHidden('post') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-start --\}\}[\s\S]*?\{\{!-- defalt-post-start-end --\}\}/g,
      ''
    )
  }

  // Remove post article if hidden
  if (isHidden('post-article') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-article-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-end --\}\}/g,
      ''
    )
  }

  // Remove post article header if hidden
  if (isHidden('post-article-header') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-article-header-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-header-end --\}\}/g,
      ''
    )
  }

  // Remove post article tag if hidden
  if (isHidden('post-article-tag') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-article-tag-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-tag-end --\}\}/g,
      ''
    )
  }

  // Remove post article title if hidden
  if (isHidden('post-article-title') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-article-title-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-title-end --\}\}/g,
      ''
    )
  }

  // Remove post article content if hidden
  if (isHidden('post-article-content') || mainHidden) {
    originalContent = originalContent.replace(
      /\{\{!-- defalt-post-article-content-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-content-end --\}\}/g,
      ''
    )
  }

  await fs.writeFile(postPath, originalContent, 'utf-8')
}
