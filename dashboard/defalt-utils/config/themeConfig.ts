import { safeParseThemeDocument } from './themeValidation.js'
import { logError } from '../logging/errorLogger.js'
import { WORKSPACE_STORAGE_PREFIX } from '../constants.js'
import { apiPath } from '../api/apiPath.js'
import { getCachedCsrfToken, requestCsrfToken } from '../security/csrf.js'

export type PageType = 'home' | 'about' | 'post' | 'page'

export type SectionType = 'header' | 'footer-bar' | 'footer-signup' | 'main' | 'custom'

export interface SectionPadding {
  top: number
  bottom: number
  left?: number
  right?: number
}

export interface SectionMargin {
  top?: number
  bottom?: number
}

export type StickyHeaderModeSetting = 'Always' | 'Scroll up' | 'Never'
export type HeaderTypographyCaseSetting = 'default' | 'uppercase'
export type PageLayoutSetting = 'narrow' | 'normal'

export type AnnouncementBarWidthSetting = 'default' | 'narrow'
export type AnnouncementBarTypographySize = 'small' | 'normal' | 'large' | 'x-large'
export type AnnouncementBarTypographyWeight = 'light' | 'default' | 'bold'
export type AnnouncementBarTypographySpacing = 'tight' | 'regular' | 'wide'
export type AnnouncementBarTypographyCase = 'default' | 'uppercase'

export interface AnnouncementBarConfig {
  width: AnnouncementBarWidthSetting
  backgroundColor: string
  textColor: string
  dividerThickness: number
  dividerColor: string
  paddingTop: number
  paddingBottom: number
}

/** Individual announcement block */
export interface AnnouncementBlock {
  text: string
  link: string
  /** Typography settings */
  typographySize: AnnouncementBarTypographySize
  typographyWeight: AnnouncementBarTypographyWeight
  typographySpacing: AnnouncementBarTypographySpacing
  typographyCase: AnnouncementBarTypographyCase
}

export interface AnnouncementContentConfig {
  previewText: string
  underlineLinks: boolean
  typographySize: AnnouncementBarTypographySize
  typographyWeight: AnnouncementBarTypographyWeight
  typographySpacing: AnnouncementBarTypographySpacing
  typographyCase: AnnouncementBarTypographyCase
  /** Engine V2: Block array for announcements */
  announcements: AnnouncementBlock[]
}

export const DEFAULT_ANNOUNCEMENT_BAR_CONFIG: AnnouncementBarConfig = {
  width: 'default',
  backgroundColor: '#AC1E3E',
  textColor: '#ffffff',
  dividerThickness: 0,
  dividerColor: '#e5e7eb',
  paddingTop: 8,
  paddingBottom: 8
}

export const DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG: AnnouncementContentConfig = {
  previewText: 'Tag #announcement-bar to a published Ghost page.',
  underlineLinks: false,
  typographySize: 'normal',
  typographyWeight: 'default',
  typographySpacing: 'regular',
  typographyCase: 'default',
  announcements: [
    { text: 'Tag #announcement-bar to a published Ghost page.', link: '', typographySize: 'normal', typographyWeight: 'default', typographySpacing: 'regular', typographyCase: 'default' }
  ]
}

export interface SectionSettings {
  visible: boolean
  padding?: SectionPadding
  paddingBlock?: number
  margin?: SectionMargin
  definitionId?: string
  customConfig?: Record<string, unknown>
  stickyHeaderMode?: StickyHeaderModeSetting
  searchEnabled?: boolean
  typographyCase?: HeaderTypographyCaseSetting
  announcementBarVisible?: boolean
  announcementBarConfig?: AnnouncementBarConfig
  announcementContentConfig?: AnnouncementContentConfig
  accentColor?: string
  backgroundColor?: string
  pageLayout?: PageLayoutSetting
  borderThickness?: number
  cornerRadius?: number
  customCSS?: string
  [key: string]: unknown
}

export interface SectionConfig {
  type: SectionType
  settings: SectionSettings
}

export interface PageConfig {
  order: string[]
  sections: Record<string, SectionConfig>
}

export interface FooterConfig {
  order: string[]
  sections: Record<string, SectionConfig>
  margin?: SectionMargin
}

export interface ThemeDocument {
  name: string
  version: number
  accentColor?: string
  packageJson?: string
  header: {
    sections: Record<string, SectionConfig>
  }
  footer: FooterConfig
  pages: Record<string, PageConfig>
}

export interface HeaderSettingsSnapshot {
  accentColor: string
  stickyHeaderMode: StickyHeaderModeSetting
  searchEnabled: boolean
  typographyCase: HeaderTypographyCaseSetting
}

export interface MainSettingsSnapshot {
  pageLayout: PageLayoutSetting
  borderThickness: number
  cornerRadius: number
  customCSS: string
}

export interface WorkspaceSnapshot {
  headerSettings: HeaderSettingsSnapshot
  mainSettings: MainSettingsSnapshot
  packageJson?: string
}

export interface EditorState {
  header: SectionConfig
  footer: FooterConfig
  page: PageConfig
  packageJson?: string
}

export const CSS_DEFAULT_PADDING: Record<string, number | SectionPadding> = {
  subheader: 160,
  main: 0,
  footerBar: 28,
  footerSignup: { top: 0, bottom: 160 }
}

export const CSS_DEFAULT_MARGIN: Record<string, SectionMargin> = {
  footer: { top: 172 },
  footerBar: { bottom: 100 }
}

export const PADDING_BLOCK_SECTIONS = new Set(['subheader', 'main', 'footerBar'])

export const DEFAULT_HEADER_SETTINGS: HeaderSettingsSnapshot = {
  accentColor: '#AC1E3E',
  stickyHeaderMode: 'Never',
  searchEnabled: true,
  typographyCase: 'default'
}

export const DEFAULT_MAIN_SETTINGS: MainSettingsSnapshot = {
  pageLayout: 'normal',
  borderThickness: 1,
  cornerRadius: 4,
  customCSS: ''
}

export const THEME_DOCUMENT_FILENAME = 'defalt-theme.json'
const THEME_DOCUMENT_VERSION = 1
const DEFAULT_DOCUMENT_NAME = 'defalt-theme'
const DRAFT_STORAGE_KEY = `${WORKSPACE_STORAGE_PREFIX}:draft`
const SAVED_STORAGE_KEY = `${WORKSPACE_STORAGE_PREFIX}:saved`

const PAGE_KEY_MAP: Record<PageType, string> = {
  home: 'homepage',
  about: 'about',
  post: 'post',
  page: 'page'
}

type DocumentPageKey = typeof PAGE_KEY_MAP[PageType]

type WorkspaceStorageGlobal = typeof globalThis & { sessionStorage?: Storage, localStorage?: Storage }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// Get sessionStorage for draft (temporary, auto-saved)
const getDraftStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }
  const storage = (globalThis as WorkspaceStorageGlobal).sessionStorage
  if (!storage) {
    return null
  }
  return storage
}

// Get localStorage for saved (permanent, explicit save)
const getSavedStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }
  const storage = (globalThis as WorkspaceStorageGlobal).localStorage
  if (!storage) {
    return null
  }
  return storage
}

const createDefaultHeaderSection = (): SectionConfig => ({
  type: 'header',
  settings: {
    visible: true,
    // Don't set default padding - let template CSS handle it
    stickyHeaderMode: DEFAULT_HEADER_SETTINGS.stickyHeaderMode,
    searchEnabled: DEFAULT_HEADER_SETTINGS.searchEnabled,
    typographyCase: DEFAULT_HEADER_SETTINGS.typographyCase,
    announcementBarVisible: true,
    announcementBarConfig: { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG },
    announcementContentConfig: { ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG }
  }
})

const createDefaultFooterConfig = (): FooterConfig => ({
  order: ['footerBar', 'footerSignup'],
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

const createDefaultPageConfig = (pageKey: DocumentPageKey): PageConfig => {
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
    order: pageKey === 'homepage' ? ['subheader', 'featured', 'main'] : ['main'],
    sections
  }
}

const DEFAULT_THEME_DOCUMENT: ThemeDocument = {
  name: DEFAULT_DOCUMENT_NAME,
  version: THEME_DOCUMENT_VERSION,
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
}

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value
  }
  return fallback
}

const normalizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return fallback
}

const normalizePadding = (value: unknown, fallback: SectionPadding | undefined): SectionPadding | undefined => {
  if (!fallback) {
    if (!value || typeof value !== 'object') {
      return undefined
    }
    const raw = value as Record<string, unknown>
    return {
      top: normalizeNumber(raw.top, 0),
      bottom: normalizeNumber(raw.bottom, 0),
      left: typeof raw.left === 'number' ? raw.left : undefined,
      right: typeof raw.right === 'number' ? raw.right : undefined
    }
  }

  if (!value || typeof value !== 'object') {
    return { ...fallback }
  }
  const raw = value as Record<string, unknown>
  return {
    top: normalizeNumber(raw.top, fallback.top),
    bottom: normalizeNumber(raw.bottom, fallback.bottom),
    left: typeof raw.left === 'number' ? raw.left : fallback.left,
    right: typeof raw.right === 'number' ? raw.right : fallback.right
  }
}

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

const sanitizeHexColorValue = (value: unknown, fallback: string): string => {
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

export const normalizeAnnouncementBarConfig = (value: unknown, fallback: AnnouncementBarConfig): AnnouncementBarConfig => {
  if (!value || typeof value !== 'object') {
    return { ...fallback }
  }
  const raw = value as Record<string, unknown>
  const width = raw.width === 'narrow' ? 'narrow' : 'default'

  const dividerThickness = clampNumber(typeof raw.dividerThickness === 'number' ? raw.dividerThickness : 0, 0, 5)
  const paddingTop = clampNumber(typeof raw.paddingTop === 'number' ? raw.paddingTop : fallback.paddingTop, 0, 100)
  const paddingBottom = clampNumber(typeof raw.paddingBottom === 'number' ? raw.paddingBottom : fallback.paddingBottom, 0, 100)

  return {
    width,
    backgroundColor: sanitizeHexColorValue(raw.backgroundColor, fallback.backgroundColor),
    textColor: sanitizeHexColorValue(raw.textColor, fallback.textColor),
    dividerThickness,
    dividerColor: sanitizeHexColorValue(raw.dividerColor, fallback.dividerColor),
    paddingTop,
    paddingBottom
  }
}

export const normalizeAnnouncementContentConfig = (
  value: unknown,
  fallback: AnnouncementContentConfig,
  legacySource?: unknown
): AnnouncementContentConfig => {
  if (!value || typeof value !== 'object') {
    return { ...fallback }
  }
  const raw = value as Record<string, unknown>
  const legacy = legacySource && typeof legacySource === 'object'
    ? legacySource as Record<string, unknown>
    : undefined

  const parseSize = (input: unknown): AnnouncementBarTypographySize | null => {
    if (input === 'small' || input === 'normal' || input === 'large' || input === 'x-large') {
      return input
    }
    return null
  }
  const parseWeight = (input: unknown): AnnouncementBarTypographyWeight | null => {
    if (input === 'light' || input === 'default' || input === 'bold') {
      return input
    }
    return null
  }
  const parseSpacing = (input: unknown): AnnouncementBarTypographySpacing | null => {
    if (input === 'tight' || input === 'regular' || input === 'wide') {
      return input
    }
    return null
  }
  const parseCase = (input: unknown): AnnouncementBarTypographyCase | null => {
    if (input === 'uppercase' || input === 'default') {
      return input
    }
    return null
  }

  // Parse announcements array
  const parseAnnouncements = (input: unknown): AnnouncementBlock[] => {
    if (!Array.isArray(input)) return fallback.announcements
    return input.map((item): AnnouncementBlock => {
      if (!item || typeof item !== 'object') {
        return { text: '', link: '', typographySize: 'normal', typographyWeight: 'default', typographySpacing: 'regular', typographyCase: 'default' }
      }
      const obj = item as Record<string, unknown>
      return {
        text: typeof obj.text === 'string' ? obj.text : '',
        link: typeof obj.link === 'string' ? obj.link : '',
        // Typography settings with defaults
        typographySize: parseSize(obj.typographySize) ?? 'normal',
        typographyWeight: parseWeight(obj.typographyWeight) ?? 'default',
        typographySpacing: parseSpacing(obj.typographySpacing) ?? 'regular',
        typographyCase: parseCase(obj.typographyCase) ?? 'default'
      }
    })
  }

  const previewText =
    typeof raw.previewText === 'string'
      ? raw.previewText
      : typeof raw.text === 'string'
        ? raw.text
        : fallback.previewText

  return {
    previewText,
    underlineLinks: typeof raw.underlineLinks === 'boolean'
      ? raw.underlineLinks
      : typeof legacy?.underlineLinks === 'boolean'
        ? Boolean(legacy.underlineLinks)
        : fallback.underlineLinks,
    typographySize: parseSize(raw.typographySize) ?? parseSize(legacy?.typographySize) ?? fallback.typographySize,
    typographyWeight: parseWeight(raw.typographyWeight) ?? parseWeight(legacy?.typographyWeight) ?? fallback.typographyWeight,
    typographySpacing: parseSpacing(raw.typographySpacing) ?? parseSpacing(legacy?.typographySpacing) ?? fallback.typographySpacing,
    typographyCase: parseCase(raw.typographyCase) ?? parseCase(legacy?.typographyCase) ?? fallback.typographyCase,
    announcements: parseAnnouncements(raw.announcements)
  }
}

/**
 * Normalizes the persisted header section ensuring all optional fields
 * exist and legacy properties are migrated to the current schema.
 *
 * @param section - The raw header section read from storage.
 * @returns A sanitized header section ready for use in the editor.
 */
const normalizeHeaderSection = (section: SectionConfig | undefined): SectionConfig => {
  const defaults = createDefaultHeaderSection()
  const settings = (section?.settings ?? {}) as Record<string, unknown>
  return {
    type: 'header',
    settings: {
      visible: normalizeBoolean(settings.visible, defaults.settings.visible),
      padding: normalizePadding(settings.padding, defaults.settings.padding),
      paddingBlock: typeof settings.paddingBlock === 'number' ? settings.paddingBlock : undefined,
      stickyHeaderMode: (settings.stickyHeaderMode as StickyHeaderModeSetting) ?? defaults.settings.stickyHeaderMode,
      searchEnabled: normalizeBoolean(settings.searchEnabled, defaults.settings.searchEnabled ?? true),
      typographyCase: (settings.typographyCase as HeaderTypographyCaseSetting) ?? defaults.settings.typographyCase,
      announcementBarVisible: normalizeBoolean(settings.announcementBarVisible, defaults.settings.announcementBarVisible ?? true),
      announcementBarConfig: normalizeAnnouncementBarConfig(
        (settings.announcementBarConfig as AnnouncementBarConfig | undefined) ?? defaults.settings.announcementBarConfig!,
        defaults.settings.announcementBarConfig!
      ),
      announcementContentConfig: normalizeAnnouncementContentConfig(
        (settings.announcementContentConfig as AnnouncementContentConfig | undefined) ?? defaults.settings.announcementContentConfig!,
        defaults.settings.announcementContentConfig!,
        settings.announcementBarConfig
      ),
      accentColor: typeof settings.accentColor === 'string' ? settings.accentColor : defaults.settings.accentColor,
      backgroundColor: typeof settings.backgroundColor === 'string' ? settings.backgroundColor : defaults.settings.backgroundColor
    }
  }
}

/**
 * Normalizes the footer configuration by merging stored data with
 * default sections and padding values.
 *
 * @param footer - Footer configuration loaded from storage.
 * @returns Footer config with guaranteed order and section data.
 */
const normalizeFooterConfig = (footer: FooterConfig | undefined): FooterConfig => {
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
    const fallbackPadding = defaultSection?.settings?.padding
    sections[key] = {
      type: defaultSection?.type ?? source.type ?? 'custom',
      settings: {
        visible: normalizeBoolean(settings.visible, defaultSection?.settings?.visible ?? true),
        padding: normalizePadding(settings.padding, fallbackPadding),
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

/**
 * Normalizes a page configuration for a specific template, ensuring
 * default sections exist and removing duplicate entries.
 *
 * @param pageKey - Page identifier ("homepage", "about", etc.).
 * @param page - Stored page configuration.
 * @returns Sanitized page configuration for runtime use.
 */
const normalizePageConfig = (pageKey: DocumentPageKey, page: PageConfig | undefined): PageConfig => {
  const defaults = createDefaultPageConfig(pageKey)
  const orderSource = Array.isArray(page?.order) ? page?.order as string[] : []
  const order: string[] = []
  const seen = new Set<string>()
  orderSource.forEach((key) => {
    if (typeof key !== 'string') {
      return
    }
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    order.push(key)
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
    const stored = page?.sections?.[key]

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
    const fallbackPadding = defaultSection?.settings?.padding

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
        padding: normalizePadding(settings.padding, fallbackPadding),
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

/**
 * Produces a fully valid theme document from arbitrary persisted data.
 *
 * @param candidate - Raw object parsed from storage/backup.
 * @returns Theme document compatible with the editor schema.
 */
export const normalizeThemeDocument = (candidate: unknown): ThemeDocument => {
  if (!candidate || typeof candidate !== 'object') {
    return clone(DEFAULT_THEME_DOCUMENT)
  }

  const raw = candidate as Partial<ThemeDocument>
  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : DEFAULT_DOCUMENT_NAME
  const version = typeof raw.version === 'number' ? raw.version : THEME_DOCUMENT_VERSION
  const accentColor = typeof raw.accentColor === 'string' ? raw.accentColor : DEFAULT_HEADER_SETTINGS.accentColor
  const packageJson = typeof raw.packageJson === 'string' ? raw.packageJson : undefined

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
    accentColor,
    packageJson,
    header: {
      sections: {
        header: headerSection
      }
    },
    footer,
    pages
  }
}

// Read from draft storage (sessionStorage)
const readDraftDocument = (): ThemeDocument | null => {
  const storage = getDraftStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const validated = safeParseThemeDocument(parsed, 'draft-storage', { suppressLog: true })
    if (validated) {
      return normalizeThemeDocument(validated)
    }
    const normalized = normalizeThemeDocument(parsed)
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch (error) {
    logError(error, { scope: 'themeConfig.loadDraftDocument' })
    storage.removeItem(DRAFT_STORAGE_KEY)
    return null
  }
}

// Read from saved storage (localStorage)
const readSavedDocument = (): ThemeDocument => {
  const storage = getSavedStorage()
  if (!storage) {
    return clone(DEFAULT_THEME_DOCUMENT)
  }

  const raw = storage.getItem(SAVED_STORAGE_KEY)
  if (!raw) {
    return clone(DEFAULT_THEME_DOCUMENT)
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const validated = safeParseThemeDocument(parsed, 'saved-storage', { suppressLog: true })
    if (validated) {
      return normalizeThemeDocument(validated)
    }
    const normalized = normalizeThemeDocument(parsed)
    storage.setItem(SAVED_STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch (error) {
    logError(error, { scope: 'themeConfig.loadSavedDocument' })
    storage.removeItem(SAVED_STORAGE_KEY)
    return clone(DEFAULT_THEME_DOCUMENT)
  }
}

// Legacy function - reads from draft first, falls back to saved
const readPersistedDocument = (): ThemeDocument => {
  const draft = readDraftDocument()
  if (draft) {
    return draft
  }
  return readSavedDocument()
}

// Write to draft storage (sessionStorage) - for auto-save
const writeDraftDocument = (document: ThemeDocument): boolean => {
  const storage = getDraftStorage()
  if (!storage) {
    return false
  }

  try {
    const serialized = JSON.stringify(document)
    storage.setItem(DRAFT_STORAGE_KEY, serialized)
    return true
  } catch (error) {
    logError(error, { scope: 'themeConfig.persistDraftDocument' })
    return false
  }
}

// Write to saved storage (localStorage) - for explicit save
const writeSavedDocument = (document: ThemeDocument): boolean => {
  const storage = getSavedStorage()
  if (!storage) {
    return false
  }

  try {
    const serialized = JSON.stringify(document)
    const estimatedSize = new Blob([serialized]).size

    // Check available quota (if supported) - wrapped to avoid TypeScript issues
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null
      if (nav && 'storage' in nav) {
        const navStorage = (nav as Navigator & { storage?: StorageManager }).storage
        if (navStorage && typeof navStorage.estimate === 'function') {
          navStorage.estimate()
            .then((estimate: StorageEstimate) => {
              const quota = estimate?.quota
              const usage = estimate?.usage
              if (quota && usage) {
                const available = quota - usage
                if (available < estimatedSize * 1.5) {
                  console.warn(`Storage quota low: ${available} bytes available, need ~${estimatedSize} bytes`)
                }
              }
            })
            .catch(() => {
              // Quota API not supported or failed, continue anyway
            })
        }
      }
    } catch {
      // Storage API not available, continue
    }

    storage.setItem(SAVED_STORAGE_KEY, serialized)
    return true
  } catch (error) {
    logError(error, { scope: 'themeConfig.persistSavedDocument' })

    // Check if it's a quota error
    const isQuotaError = error instanceof Error && (
      error.name === 'QuotaExceededError' ||
      error.message.includes('quota') ||
      error.message.includes('storage')
    )

    if (isQuotaError) {
      // Notify user immediately - wrapped to avoid TypeScript issues
      try {
        const globalScope = globalThis as typeof globalThis & { window?: Window }
        const win = typeof globalScope !== 'undefined' ? globalScope.window ?? null : null
        if (win && typeof win.alert === 'function') {
          const message = 'Storage quota exceeded! Your changes cannot be saved.\n\n' +
            'Please download a backup of your work immediately to prevent data loss.\n\n' +
            'You may need to:\n' +
            '- Clear browser data and re-import your backup\n' +
            '- Use a different browser\n' +
            '- Reduce custom CSS or content size'

          // Use setTimeout to ensure alert doesn't block the current execution
          win.setTimeout(() => {
            win.alert(message)
          }, 0)
        }
      } catch {
        // Alert not available, continue
      }
    }

    return false
  }
}

// Legacy function - writes to draft storage
const writePersistedDocument = (document: ThemeDocument): boolean => {
  return writeDraftDocument(document)
}

// Check if a draft document exists
export const hasDraftDocument = (): boolean => {
  const storage = getDraftStorage()
  if (!storage) {
    return false
  }
  const raw = storage.getItem(DRAFT_STORAGE_KEY)
  return raw !== null && raw.length > 0
}

// Clear draft document
export const clearDraftDocument = (): void => {
  const storage = getDraftStorage()
  if (!storage) {
    return
  }
  storage.removeItem(DRAFT_STORAGE_KEY)
}

// Load draft document (returns null if no draft exists)
export const loadDraftThemeDocument = (): ThemeDocument | null => {
  const draft = readDraftDocument()
  return draft ? clone(draft) : null
}

// Load saved document (always returns a valid document, defaults if none exists)
export const loadSavedThemeDocument = (): ThemeDocument => {
  return clone(readSavedDocument())
}

// Persist to draft storage (sessionStorage) - for auto-save
export const persistDraftThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writeDraftDocument(normalized)
}

// Persist to saved storage (localStorage) - for explicit save
export const persistSavedThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writeSavedDocument(normalized)
}

// Legacy export - loads draft first, falls back to saved
export const loadPersistedThemeDocument = (): ThemeDocument => clone(readPersistedDocument())

export const persistThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writePersistedDocument(normalized)
}

const resolveDocumentPageKey = (page: string): DocumentPageKey => {
  if (page === 'about' || page === 'post' || page === 'page') {
    return page
  }
  return 'homepage'
}

export const loadEditorState = (page: string): EditorState => {
  const document = readPersistedDocument()
  const pageKey = resolveDocumentPageKey(page)
  const header = document.header.sections.header ?? createDefaultHeaderSection()
  const footer = document.footer ?? createDefaultFooterConfig()
  const pageConfig = document.pages[pageKey] ?? createDefaultPageConfig(pageKey)
  return {
    header: clone(header),
    footer: clone(footer),
    page: clone(pageConfig),
    packageJson: document.packageJson
  }
}

export const persistEditorState = (page: string, state: EditorState, accentColor?: string): boolean => {
  const document = readPersistedDocument()
  const pageKey = resolveDocumentPageKey(page)

  // Update accentColor at document level if provided
  if (typeof accentColor === 'string') {
    document.accentColor = accentColor
  }

  document.header = {
    sections: {
      header: normalizeHeaderSection(state.header)
    }
  }
  document.footer = normalizeFooterConfig(state.footer)
  document.pages[pageKey] = normalizePageConfig(pageKey, state.page)

  if (typeof state.packageJson === 'string') {
    document.packageJson = state.packageJson
  }

  return persistThemeDocument(document)
}

export const loadThemeConfig = (pageType: PageType): PageConfig => {
  const state = loadEditorState(pageType)
  return clone(state.page)
}

export const saveThemeDocument = async (document: ThemeDocument): Promise<void> => {
  try {
    let csrfToken = getCachedCsrfToken()
    if (!csrfToken) {
      csrfToken = await requestCsrfToken()
    }

    const response = await fetch(apiPath('/api/theme-config'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
      },
      body: JSON.stringify(normalizeThemeDocument(document), null, 2)
    })

    if (!response.ok) {
      throw new Error('Failed to save theme document')
    }
  } catch (error) {
    logError(error, { scope: 'themeConfig.persistThemeDocument' })
    throw error
  }
}

export const extractHeaderSettings = (header: SectionConfig, document?: ThemeDocument): HeaderSettingsSnapshot => {
  const settings = (header.settings ?? {}) as Partial<SectionSettings>
  const accentColor = document?.accentColor ?? DEFAULT_HEADER_SETTINGS.accentColor
  return {
    accentColor,
    stickyHeaderMode: (settings.stickyHeaderMode as StickyHeaderModeSetting) ?? DEFAULT_HEADER_SETTINGS.stickyHeaderMode,
    searchEnabled: settings.searchEnabled ?? DEFAULT_HEADER_SETTINGS.searchEnabled,
    typographyCase: (settings.typographyCase as HeaderTypographyCaseSetting) ?? DEFAULT_HEADER_SETTINGS.typographyCase
  }
}

export const extractMainSettings = (page: PageConfig): MainSettingsSnapshot => {
  const mainSection = page.sections.main
  const settings = (mainSection?.settings ?? {}) as Partial<SectionSettings>
  return {
    pageLayout: (settings.pageLayout as PageLayoutSetting) ?? DEFAULT_MAIN_SETTINGS.pageLayout,
    borderThickness: typeof settings.borderThickness === 'number' ? settings.borderThickness : DEFAULT_MAIN_SETTINGS.borderThickness,
    cornerRadius: typeof settings.cornerRadius === 'number' ? settings.cornerRadius : DEFAULT_MAIN_SETTINGS.cornerRadius,
    customCSS: typeof settings.customCSS === 'string' ? settings.customCSS : DEFAULT_MAIN_SETTINGS.customCSS
  }
}

export const clearWorkspaceStorage = (): void => {
  const clearByPrefix = (storage: Storage | null) => {
    if (!storage) {
      return
    }
    const keysToRemove: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && key.startsWith(`${WORKSPACE_STORAGE_PREFIX}:`)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key))
  }

  clearByPrefix(getDraftStorage())
  clearByPrefix(getSavedStorage())
}

export const SECTION_ID_MAP: Record<string, string> = {
  header: 'header',
  subheader: 'subheader',
  featured: 'featured',
  cta: 'cta',
  main: 'main',
  footer: 'footer',
  footerBar: 'footerBar',
  footerSignup: 'footerSignup'
}

export const CONFIG_TO_ID_MAP: Record<string, string> = {
  header: 'header',
  subheader: 'subheader',
  featured: 'featured',
  cta: 'cta',
  main: 'main',
  footer: 'footer',
  footerBar: 'footerBar',
  footerSignup: 'footerSignup'
}

