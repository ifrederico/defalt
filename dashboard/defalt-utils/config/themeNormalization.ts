// =============================================================================
// Theme Document Normalization
// =============================================================================

import { normalizeBoolean, normalizeNumericValue } from '../helpers/numericHelpers.js'
import { deepClone } from '../helpers/deepClone.js'
import { formatInternalTag } from '../helpers/tagFilterUtils.js'
import {
  getFooterOrder,
  getTemplateOrder,
  normalizeSectionId,
  resolveAnnouncementBlockTag
} from './sectionRegistry.js'
import { normalizeAnnouncementBarConfig, normalizeAnnouncementContentConfig } from './announcementBarUtils.js'
import {
  CSS_DEFAULT_PADDING,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  MAX_ANNOUNCEMENT_BARS,
  MAX_ANNOUNCEMENTS_PER_BAR,
  THEME_DOCUMENT_VERSION,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_DOCUMENT_NAME,
  PAGE_KEY_MAP,
  type DocumentPageKey
} from './themeDefaults.js'
import type {
  SectionPadding,
  SectionSettings,
  SectionConfig,
  PageConfig,
  FooterConfig,
  ThemeDocument,
  AnnouncementBarInstance,
  AnnouncementBarConfig,
  AnnouncementContentConfig,
  NavigationLayoutSetting,
  StickyHeaderModeSetting,
  HeaderTypographyCaseSetting
} from './themeConfig.types.js'

// =============================================================================
// Padding Normalization
// =============================================================================

const normalizePadding = (value: unknown, defaultPadding: SectionPadding | undefined): SectionPadding | undefined => {
  if (!defaultPadding) {
    if (!value || typeof value !== 'object') {
      return undefined
    }
    const raw = value as Record<string, unknown>
    return {
      top: normalizeNumericValue(raw.top, 0),
      bottom: normalizeNumericValue(raw.bottom, 0),
      left: typeof raw.left === 'number' ? raw.left : undefined,
      right: typeof raw.right === 'number' ? raw.right : undefined
    }
  }

  if (!value || typeof value !== 'object') {
    return { ...defaultPadding }
  }
  const raw = value as Record<string, unknown>
  return {
    top: normalizeNumericValue(raw.top, defaultPadding.top),
    bottom: normalizeNumericValue(raw.bottom, defaultPadding.bottom),
    left: typeof raw.left === 'number' ? raw.left : defaultPadding.left,
    right: typeof raw.right === 'number' ? raw.right : defaultPadding.right
  }
}

// =============================================================================
// Default Section Factories
// =============================================================================

export const createDefaultHeaderSection = (): SectionConfig => ({
  type: 'header',
  settings: {
    visible: true,
    navigationLayout: DEFAULT_HEADER_SETTINGS.navigationLayout,
    stickyHeaderMode: DEFAULT_HEADER_SETTINGS.stickyHeaderMode,
    searchEnabled: DEFAULT_HEADER_SETTINGS.searchEnabled,
    typographyCase: DEFAULT_HEADER_SETTINGS.typographyCase,
    announcementBars: []
  }
})

export const createDefaultFooterConfig = (): FooterConfig => ({
  order: getFooterOrder(),
  sections: {
    footerBar: {
      type: 'footer-bar',
      settings: {
        visible: true,
        paddingBlock: CSS_DEFAULT_PADDING.footerBar as number
      }
    },
    footerSignup: {
      type: 'footer-signup',
      settings: {
        visible: true,
        padding: CSS_DEFAULT_PADDING.footerSignup as SectionPadding
      }
    }
  }
})

export const createDefaultPageConfig = (pageKey: DocumentPageKey): PageConfig => {
  const sections: Record<string, SectionConfig> = {
    main: {
      type: 'main',
      settings: {
        visible: true,
        paddingBlock: CSS_DEFAULT_PADDING.main as number
      }
    }
  }

  if (pageKey === 'homepage') {
    sections.subheader = {
      type: 'header',
      settings: {
        visible: true,
        paddingBlock: CSS_DEFAULT_PADDING.subheader as number
      }
    }
  }

  return {
    order: getTemplateOrder(pageKey),
    sections
  }
}

export const createDefaultThemeDocument = (): ThemeDocument => ({
  name: DEFAULT_DOCUMENT_NAME,
  version: THEME_DOCUMENT_VERSION,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  accentColor: DEFAULT_HEADER_SETTINGS.accentColor,
  header: {
    sections: {
      header: createDefaultHeaderSection()
    }
  },
  footer: createDefaultFooterConfig(),
  pages: {
    homepage: createDefaultPageConfig('homepage'),
    about: createDefaultPageConfig('about'),
    post: createDefaultPageConfig('post'),
    page: createDefaultPageConfig('page')
  }
})

// =============================================================================
// Header Section Normalization
// =============================================================================

const normalizeAnnouncementBars = (input: unknown): AnnouncementBarInstance[] => {
  if (!Array.isArray(input)) {
    return []
  }

  const usedIds = new Set<string>()
  const defaultAnnouncement = DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0]

  const createId = (desired: string | null) => {
    const base = desired && desired.trim().length ? desired.trim() : 'announcement-bar'
    if (!usedIds.has(base)) {
      usedIds.add(base)
      return base
    }
    let suffix = 2
    let next = `${base}-${suffix}`
    while (usedIds.has(next)) {
      suffix += 1
      next = `${base}-${suffix}`
    }
    usedIds.add(next)
    return next
  }

  return input
    .map((raw): AnnouncementBarInstance | null => {
      if (!raw || typeof raw !== 'object') {
        return null
      }
      const obj = raw as Record<string, unknown>
      const rawId = typeof obj.id === 'string' ? obj.id : null
      const id = createId(rawId)

      const hidden = typeof obj.hidden === 'boolean'
        ? obj.hidden
        : typeof obj.visible === 'boolean'
          ? !obj.visible
          : false

      const defaultBar = { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG }
      const bar = normalizeAnnouncementBarConfig((obj.bar as AnnouncementBarConfig | undefined) ?? defaultBar, defaultBar)

      const contentRaw = obj.content as AnnouncementContentConfig | undefined
      const contentNormalized = normalizeAnnouncementContentConfig(
        contentRaw ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
        DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG
      )

      const announcements = contentNormalized.announcements.length > 0
        ? contentNormalized.announcements
        : [defaultAnnouncement]
      const limitedAnnouncements = announcements.slice(0, MAX_ANNOUNCEMENTS_PER_BAR)
      const ensuredAnnouncements = limitedAnnouncements.map((block, index) => {
        const normalizedTag = formatInternalTag(block.tag)
        const defaultTag = resolveAnnouncementBlockTag(id, index)
        const shouldAutoFix = normalizedTag === '#announcement' && defaultTag !== '#announcement'
        return {
          ...block,
          tag: normalizedTag ? (shouldAutoFix ? defaultTag : normalizedTag) : defaultTag
        }
      })

      return {
        id,
        hidden,
        bar,
        content: {
          ...contentNormalized,
          announcements: ensuredAnnouncements
        }
      }
    })
    .filter((item): item is AnnouncementBarInstance => item !== null)
    .slice(0, MAX_ANNOUNCEMENT_BARS)
}

export const normalizeHeaderSection = (section: SectionConfig | undefined): SectionConfig => {
  const defaults = createDefaultHeaderSection()
  const settings = (section?.settings ?? {}) as Record<string, unknown>
  const resolvedNavigationLayout: NavigationLayoutSetting = (() => {
    const raw = settings.navigationLayout
    if (raw === 'Logo in the middle' || raw === 'Logo on the left' || raw === 'Stacked') {
      return raw
    }
    return defaults.settings.navigationLayout ?? DEFAULT_HEADER_SETTINGS.navigationLayout
  })()

  const announcementBars = normalizeAnnouncementBars(settings.announcementBars)

  return {
    type: 'header',
    settings: {
      visible: normalizeBoolean(settings.visible, defaults.settings.visible),
      padding: normalizePadding(settings.padding, defaults.settings.padding),
      paddingBlock: typeof settings.paddingBlock === 'number' ? settings.paddingBlock : undefined,
      navigationLayout: resolvedNavigationLayout,
      stickyHeaderMode: (settings.stickyHeaderMode as StickyHeaderModeSetting) ?? defaults.settings.stickyHeaderMode,
      searchEnabled: normalizeBoolean(settings.searchEnabled, defaults.settings.searchEnabled ?? true),
      typographyCase: (settings.typographyCase as HeaderTypographyCaseSetting) ?? defaults.settings.typographyCase,
      announcementBars,
      accentColor: typeof settings.accentColor === 'string' ? settings.accentColor : defaults.settings.accentColor,
      backgroundColor: typeof settings.backgroundColor === 'string' ? settings.backgroundColor : defaults.settings.backgroundColor
    }
  }
}

// =============================================================================
// Footer Config Normalization
// =============================================================================

export const normalizeFooterConfig = (footer: FooterConfig | undefined): FooterConfig => {
  const defaults = createDefaultFooterConfig()
  const orderSource = Array.isArray(footer?.order) ? footer?.order as string[] : []
  const footerOrder: string[] = []
  const seen = new Set<string>()
  orderSource.forEach((key) => {
    if (typeof key !== 'string') {
      return
    }
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    footerOrder.push(key)
  })
  defaults.order.forEach((key) => {
    if (!seen.has(key)) {
      seen.add(key)
      footerOrder.push(key)
    }
  })

  const sections: Record<string, SectionConfig> = {}
  footerOrder.forEach((key) => {
    const defaultSection = defaults.sections[key]
    const stored = footer?.sections?.[key]
    if (!defaultSection && !stored) {
      return
    }
    const source = stored ?? defaultSection
    if (!source) {
      return
    }
    const settings: Partial<SectionSettings> = source.settings ?? {}
    const defaultPadding = defaultSection?.settings?.padding
    sections[key] = {
      type: defaultSection?.type ?? source.type ?? 'custom',
      settings: {
        visible: normalizeBoolean(settings.visible, defaultSection?.settings?.visible ?? true),
        padding: normalizePadding(settings.padding, defaultPadding),
        paddingBlock: typeof settings.paddingBlock === 'number'
          ? settings.paddingBlock
          : defaultSection?.settings?.paddingBlock
      }
    }
  })

  return {
    order: footerOrder,
    sections,
    margin: footer?.margin
  }
}

// =============================================================================
// Page Config Normalization
// =============================================================================

const normalizeSectionKey = (key: string): string => normalizeSectionId(key)

export const normalizePageConfig = (pageKey: DocumentPageKey, page: PageConfig | undefined): PageConfig => {
  const defaults = createDefaultPageConfig(pageKey)
  const orderSource = Array.isArray(page?.order) ? page?.order as string[] : []
  const rawSections = page?.sections && typeof page.sections === 'object'
    ? page.sections as Record<string, SectionConfig>
    : {}
  const normalizedSections: Record<string, SectionConfig> = {}

  Object.entries(rawSections).forEach(([rawKey, section]) => {
    if (typeof rawKey !== 'string') {
      return
    }
    const normalizedKey = normalizeSectionKey(rawKey)
    if (normalizedKey === rawKey && !normalizedSections[normalizedKey]) {
      normalizedSections[normalizedKey] = section
    }
  })

  Object.entries(rawSections).forEach(([rawKey, section]) => {
    if (typeof rawKey !== 'string') {
      return
    }
    const normalizedKey = normalizeSectionKey(rawKey)
    if (!normalizedSections[normalizedKey]) {
      normalizedSections[normalizedKey] = section
    }
  })
  const order: string[] = []
  const seen = new Set<string>()
  orderSource.forEach((key) => {
    if (typeof key !== 'string') {
      return
    }
    const normalizedKey = normalizeSectionKey(key)
    if (seen.has(normalizedKey)) {
      return
    }
    seen.add(normalizedKey)
    order.push(normalizedKey)
  })
  defaults.order.forEach((key) => {
    if (!seen.has(key)) {
      seen.add(key)
      order.push(key)
    }
  })

  const sections: Record<string, SectionConfig> = {}
  const defaultSections = defaults.sections

  order.forEach((key) => {
    if (key === 'subheader' && pageKey !== 'homepage') {
      return
    }
    const defaultSection = defaultSections[key]
    const stored = normalizedSections[key]

    // For subheader section on homepage, always ensure it exists from defaults
    if (key === 'subheader' && pageKey === 'homepage' && !stored && defaultSection) {
      sections[key] = {
        type: defaultSection.type,
        settings: {
          ...defaultSection.settings,
          visible: true
        }
      }
      return
    }

    if (!defaultSection && !stored) {
      return
    }
    const source = stored ?? defaultSection
    if (!source) {
      return
    }
    const settings: Partial<SectionSettings> = source.settings ?? {}
    const defaultPadding = defaultSection?.settings?.padding

    // Filter out deprecated main section properties
    const filteredSettings: Partial<SectionSettings> = { ...settings }
    if (key === 'main') {
      delete filteredSettings.pageLayout
      delete filteredSettings.borderThickness
      delete filteredSettings.cornerRadius
      delete filteredSettings.customCSS
    }
    sections[key] = {
      type: defaultSection?.type ?? source.type ?? 'custom',
      settings: {
        ...filteredSettings,
        visible: normalizeBoolean(settings.visible, defaultSection?.settings?.visible ?? true),
        padding: normalizePadding(settings.padding, defaultPadding),
        paddingBlock: typeof settings.paddingBlock === 'number'
          ? settings.paddingBlock
          : defaultSection?.settings?.paddingBlock
      }
    }
  })

  return {
    order,
    sections
  }
}

// =============================================================================
// Theme Document Normalization
// =============================================================================

export const normalizeThemeDocument = (candidate: unknown): ThemeDocument => {
  if (!candidate || typeof candidate !== 'object') {
    return deepClone(createDefaultThemeDocument())
  }

  const raw = candidate as Partial<ThemeDocument>
  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : DEFAULT_DOCUMENT_NAME
  const version = typeof raw.version === 'number' ? raw.version : THEME_DOCUMENT_VERSION
  const schemaVersion = CURRENT_SCHEMA_VERSION
  const accentColor = typeof raw.accentColor === 'string' ? raw.accentColor : DEFAULT_HEADER_SETTINGS.accentColor
  const packageJson = typeof raw.packageJson === 'string' ? raw.packageJson : undefined
  const customCSS = typeof raw.customCSS === 'string' ? raw.customCSS : undefined

  const headerSection = normalizeHeaderSection(raw.header?.sections?.header)
  const footer = normalizeFooterConfig(raw.footer)

  const pages: Record<string, PageConfig> = {}
  const rawPages = raw.pages && typeof raw.pages === 'object' ? raw.pages : {}

  const pageKeys = Object.values(PAGE_KEY_MAP) as DocumentPageKey[]
  pageKeys.forEach((pageKey) => {
    const stored = (rawPages as Record<string, PageConfig>)[pageKey]
    pages[pageKey] = normalizePageConfig(pageKey, stored)
  })

  return {
    name,
    version,
    schemaVersion,
    accentColor,
    packageJson,
    customCSS,
    header: {
      sections: {
        header: headerSection
      }
    },
    footer,
    pages
  }
}
