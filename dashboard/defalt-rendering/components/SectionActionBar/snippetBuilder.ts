/**
 * Section Snippet Builder
 *
 * Builds Handlebars partial snippets for custom sections.
 * Used by the action bar to show copyable section code.
 */

import {
  heroConfigSchema,
  ghostCardsConfigSchema,
  ghostGridConfigSchema,
  imageWithTextConfigSchema,
  type SectionInstance
} from '@defalt/sections/engine'
import {
  resolveContainerPaddingX,
  resolveImageAspectRatio,
  resolveImageColumns
} from '@defalt/rendering/derived/sectionDerived'
import { sanitizeHexColor } from '@defalt/utils/security/sanitizers'
import {
  escapeRegExp,
  resolveSectionPadding,
  buildSectionStyle,
  formatInternalTag,
  resolveHeroDefaultTag,
  resolveImageWithTextDefaultTag,
  resolveGhostCardsDefaultTag,
  resolveGhostGridDefaultTags,
  toTagFilter
} from '@defalt/utils/helpers'
import { type SectionPadding } from '@defalt/utils/config/themeConfig'
import { withBasePath } from '@defalt/utils/env/basePath'

const TEMPLATE_SNIPPET_CACHE = new Map<string, string>()
const TEMPLATE_SNIPPET_CACHE_VERSION = 'clean-v4'

export const PARTIAL_FILENAME_MAP: Record<string, string> = {
  hero: 'defalt-hero.hbs',
  ghostCards: 'defalt-ghost-cards.hbs',
  ghostGrid: 'defalt-ghost-grid.hbs',
  'image-with-text': 'defalt-image-with-text.hbs'
}

/**
 * Removes {{#if isPreview}} blocks from template
 */
const stripPreviewBlocks = (template: string): string => {
  const withoutPagesElse = template.replace(
    /\{\{#if\s+pages\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g,
    '{{#if pages}}$1{{/if}}'
  )
  const withoutPostsElse = withoutPagesElse.replace(
    /\{\{#if\s+posts\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g,
    '{{#if posts}}$1{{/if}}'
  )
  const withoutElsePreview = withoutPostsElse.replace(
    /\{\{else\}\}\s*\{\{#if\s+isPreview\}\}[\s\S]*?\{\{\/if\}\}/g,
    ''
  )
  return withoutElsePreview.replace(/\{\{#if\s+isPreview\}\}[\s\S]*?\{\{\/if\}\}/g, '')
}

/**
 * Removes placeholder CSS from template
 */
const stripPlaceholderCss = (template: string): string =>
  template.replace(
    /(^|\n)\s*[^\n{]*placeholder[^\n{]*\{[\s\S]*?\}\s*/g,
    '\n'
  )

/**
 * Tidies up template whitespace
 */
const tidyTemplateWhitespace = (template: string): string =>
  template
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s*\n<\/style>/g, '\n</style>')
    .trim()

/**
 * Sanitizes a template for copying to clipboard
 */
export const sanitizeTemplateForCopy = (template: string): string =>
  tidyTemplateWhitespace(stripPlaceholderCss(stripPreviewBlocks(template)))

/**
 * Inlines the style partial content into the template
 */
export const inlineStylePartialForCopy = async (templatePath: string, template: string): Promise<string> => {
  if (!templatePath.endsWith('.hbs')) {
    return template
  }
  const styleTemplatePath = templatePath.replace(/\.hbs$/, '.styles.hbs')
  const stylePartialName = `sections/${templatePath.replace(/\.hbs$/, '.styles')}`
  const regex = new RegExp(`\\{\\{>\\s*["']${escapeRegExp(stylePartialName)}["']\\s*\\}\\}`, 'g')

  try {
    const url = withBasePath(`/sections/${styleTemplatePath}`)
    const response = await fetch(url)
    if (!response.ok) {
      return template
    }
    const styleContent = await response.text()
    return template.replace(regex, styleContent.trim())
  } catch {
    return template
  }
}

/**
 * Gets cached template snippet or undefined
 */
export const getCachedSnippet = (templatePath: string): string | undefined => {
  const cacheKey = `${templatePath}::${TEMPLATE_SNIPPET_CACHE_VERSION}`
  return TEMPLATE_SNIPPET_CACHE.get(cacheKey)
}

/**
 * Caches a template snippet
 */
export const setCachedSnippet = (templatePath: string, snippet: string): void => {
  const cacheKey = `${templatePath}::${TEMPLATE_SNIPPET_CACHE_VERSION}`
  TEMPLATE_SNIPPET_CACHE.set(cacheKey, snippet)
}

/**
 * Builds the include snippet for a section (goes in home.hbs)
 */
export const buildSectionSnippet = (section: SectionInstance, padding?: SectionPadding): string => {
  const sectionStyle = buildSectionStyle(resolveSectionPadding(padding))

  if (section.definitionId === 'hero') {
    const parsed = heroConfigSchema.safeParse(section.config ?? {})
    const heroConfig = parsed.success ? parsed.data : heroConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(heroConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(heroConfig.backgroundColor, 'transparent')
    const internalTag = formatInternalTag(heroConfig.tags?.primary) || resolveHeroDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)
    const imageOnRight = heroConfig.imagePosition === 'right'
    const { imageColumn, textColumn } = resolveImageColumns(heroConfig.imageWidth)
    const imageAspectRatio = resolveImageAspectRatio(heroConfig.imageAspect)
    const imageBorderRadius = Math.max(0, Math.min(96, Math.round(heroConfig.imageBorderRadius)))

    return `{{> "defalt-hero" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(heroConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} textAlignment=${JSON.stringify(heroConfig.textAlignment)} pageTitle=${heroConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  if (section.definitionId === 'ghostCards') {
    const parsed = ghostCardsConfigSchema.safeParse(section.config ?? {})
    const cardsConfig = parsed.success ? parsed.data : ghostCardsConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(cardsConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(cardsConfig.backgroundColor, 'transparent')
    const internalTag = formatInternalTag(cardsConfig.tags?.primary) || resolveGhostCardsDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)

    return `{{> "defalt-ghost-cards" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(cardsConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${cardsConfig.pageTitle} textAlignment=${JSON.stringify(cardsConfig.textAlignment)} titleSize=${JSON.stringify(cardsConfig.titleSize)} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  if (section.definitionId === 'ghostGrid') {
    const parsed = ghostGridConfigSchema.safeParse(section.config ?? {})
    const gridConfig = parsed.success ? parsed.data : ghostGridConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(gridConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(gridConfig.backgroundColor, 'transparent')
    const defaults = resolveGhostGridDefaultTags(section.id)
    const internalTagLeft = formatInternalTag(gridConfig.tags?.left) || defaults.left
    const internalTagRight = formatInternalTag(gridConfig.tags?.right) || defaults.right
    const leftTagFilter = toTagFilter(internalTagLeft)
    const rightTagFilter = toTagFilter(internalTagRight)
    const anyTagFilter = `${leftTagFilter},${rightTagFilter}`

    return `{{> "defalt-ghost-grid" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(gridConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${gridConfig.pageTitle} textAlignment=${JSON.stringify(gridConfig.textAlignment)} titleSize=${JSON.stringify(gridConfig.titleSize)} stackOnMobile=${gridConfig.stackOnMobile} gap=${gridConfig.gap} leftTagFilter=${JSON.stringify(leftTagFilter)} rightTagFilter=${JSON.stringify(rightTagFilter)} anyTagFilter=${JSON.stringify(anyTagFilter)} internalTagLeft=${JSON.stringify(internalTagLeft)} internalTagRight=${JSON.stringify(internalTagRight)} }}`
  }

  if (section.definitionId === 'image-with-text') {
    const parsed = imageWithTextConfigSchema.safeParse(section.config ?? {})
    const imageTextConfig = parsed.success ? parsed.data : imageWithTextConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(imageTextConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(imageTextConfig.backgroundColor, 'transparent')
    const innerBackgroundColor = sanitizeHexColor(imageTextConfig.innerBackgroundColor, 'transparent')
    const innerBackgroundPadding = Math.max(0, Math.min(120, Math.round(imageTextConfig.innerBackgroundPadding)))
    const innerBackgroundRadius = Math.max(0, Math.min(96, Math.round(imageTextConfig.innerBackgroundRadius)))
    const internalTag = formatInternalTag(imageTextConfig.tags?.primary) || resolveImageWithTextDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)
    const imageOnRight = imageTextConfig.imagePosition === 'right'
    const { imageColumn, textColumn } = resolveImageColumns(imageTextConfig.imageWidth)
    const imageAspectRatio = resolveImageAspectRatio(imageTextConfig.imageAspect)
    const imageBorderRadius = Math.max(0, Math.min(96, Math.round(imageTextConfig.imageBorderRadius)))

    return `{{> "defalt-image-with-text" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(imageTextConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} innerBackgroundColor=${JSON.stringify(innerBackgroundColor)} innerBackgroundPadding=${innerBackgroundPadding} innerBackgroundRadius=${innerBackgroundRadius} textAlignment=${JSON.stringify(imageTextConfig.textAlignment)} pageTitle=${imageTextConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  return ''
}
