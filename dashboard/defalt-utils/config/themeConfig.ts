// =============================================================================
// Theme Configuration - Main Entry Point
// =============================================================================
// This module re-exports from specialized sub-modules for backwards compatibility.
// New code should import from the specific modules directly.
// =============================================================================

import { logError } from '../logging/errorLogger.js'
import { apiPath } from '../api/apiPath.js'
import { getCachedCsrfToken, requestCsrfToken } from '../security/csrf.js'
import { deepClone } from '../helpers/deepClone.js'
import { WORKSPACE_STORAGE_PREFIX } from '../constants.js'

// Re-export all types
export type {
  PageType,
  SectionType,
  SectionPadding,
  SectionMargin,
  StickyHeaderModeSetting,
  NavigationLayoutSetting,
  HeaderTypographyCaseSetting,
  PageLayoutSetting,
  AnnouncementBarWidthSetting,
  AnnouncementBarTypographySize,
  AnnouncementBarTypographyWeight,
  AnnouncementBarTypographySpacing,
  AnnouncementBarTypographyCase,
  AnnouncementBarConfig,
  AnnouncementBlock,
  AnnouncementContentConfig,
  AnnouncementBarInstance,
  SectionSettings,
  SectionConfig,
  PageConfig,
  FooterConfig,
  ThemeDocument,
  HeaderSettingsSnapshot,
  MainSettingsSnapshot,
  WorkspaceSnapshot,
  EditorState,
  StorageNormalizationEvent
} from './themeConfig.types.js'

// Re-export defaults and constants
export {
  MAX_ANNOUNCEMENT_BARS,
  MAX_ANNOUNCEMENTS_PER_BAR,
  CSS_DEFAULT_PADDING,
  DEFAULT_CUSTOM_SECTION_PADDING,
  SUBHEADER_MARGIN_DEFAULT,
  CSS_DEFAULT_MARGIN,
  PADDING_BLOCK_SECTIONS,
  DEFAULT_ACCENT_COLOR,
  ANNOUNCEMENT_BAR_PADDING_DEFAULTS,
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MAIN_SETTINGS,
  THEME_DOCUMENT_FILENAME,
  THEME_DOCUMENT_VERSION,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_DOCUMENT_NAME,
  DRAFT_STORAGE_KEY,
  SAVED_STORAGE_KEY,
  SCHEMA_BACKUP_STORAGE_KEY,
  PAGE_KEY_MAP,
  SECTION_ID_MAP,
  CONFIG_TO_ID_MAP,
  type DocumentPageKey
} from './themeDefaults.js'

// Re-export announcement bar utilities
export {
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig
} from './announcementBarUtils.js'

// Re-export normalization functions
export {
  createDefaultHeaderSection,
  createDefaultFooterConfig,
  createDefaultPageConfig,
  createDefaultThemeDocument,
  normalizeHeaderSection,
  normalizeFooterConfig,
  normalizePageConfig,
  normalizeThemeDocument
} from './themeNormalization.js'

// Re-export storage functions
export {
  consumeStorageNormalizationEvent,
  readPersistedDocument,
  hasDraftDocument,
  clearDraftDocument,
  loadDraftThemeDocument,
  loadSavedThemeDocument,
  persistDraftThemeDocument,
  persistSavedThemeDocument,
  loadPersistedThemeDocument,
  persistThemeDocument
} from './themeStorage.js'

// Import types and functions needed for this module
import type {
  PageType,
  SectionConfig,
  PageConfig,
  ThemeDocument,
  EditorState,
  HeaderSettingsSnapshot,
  MainSettingsSnapshot,
  SectionSettings,
  PageLayoutSetting
} from './themeConfig.types.js'

import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MAIN_SETTINGS,
  type DocumentPageKey
} from './themeDefaults.js'

import {
  createDefaultHeaderSection,
  createDefaultFooterConfig,
  createDefaultPageConfig,
  normalizeHeaderSection,
  normalizeFooterConfig,
  normalizePageConfig
} from './themeNormalization.js'

import {
  readPersistedDocument,
  persistThemeDocument
} from './themeStorage.js'

// =============================================================================
// Editor State Functions
// =============================================================================

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
    header: deepClone(header),
    footer: deepClone(footer),
    page: deepClone(pageConfig),
    packageJson: document.packageJson,
    customCSS: document.customCSS
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

  if (typeof state.customCSS === 'string') {
    document.customCSS = state.customCSS
  }

  return persistThemeDocument(document)
}

export const loadThemeConfig = (pageType: PageType): PageConfig => {
  const state = loadEditorState(pageType)
  return deepClone(state.page)
}

// =============================================================================
// API Functions
// =============================================================================

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
      body: JSON.stringify(document, null, 2)
    })

    if (!response.ok) {
      throw new Error('Failed to save theme document')
    }
  } catch (error) {
    logError(error, { scope: 'themeConfig.persistThemeDocument' })
    throw error
  }
}

// =============================================================================
// Settings Extraction
// =============================================================================

export const extractHeaderSettings = (header: SectionConfig, document?: ThemeDocument): HeaderSettingsSnapshot => {
  const settings = (header.settings ?? {}) as Partial<SectionSettings>
  const accentColor = document?.accentColor ?? DEFAULT_HEADER_SETTINGS.accentColor
  return {
    accentColor,
    navigationLayout: (settings.navigationLayout as HeaderSettingsSnapshot['navigationLayout']) ?? DEFAULT_HEADER_SETTINGS.navigationLayout,
    stickyHeaderMode: (settings.stickyHeaderMode as HeaderSettingsSnapshot['stickyHeaderMode']) ?? DEFAULT_HEADER_SETTINGS.stickyHeaderMode,
    searchEnabled: settings.searchEnabled ?? DEFAULT_HEADER_SETTINGS.searchEnabled,
    typographyCase: (settings.typographyCase as HeaderSettingsSnapshot['typographyCase']) ?? DEFAULT_HEADER_SETTINGS.typographyCase
  }
}

export const extractMainSettings = (page: PageConfig, document?: ThemeDocument): MainSettingsSnapshot => {
  const mainSection = page.sections.main
  const settings = (mainSection?.settings ?? {}) as Partial<SectionSettings>
  const resolvedCustomCSS = typeof document?.customCSS === 'string'
    ? document.customCSS
    : (typeof settings.customCSS === 'string' ? settings.customCSS : DEFAULT_MAIN_SETTINGS.customCSS)
  return {
    pageLayout: (settings.pageLayout as PageLayoutSetting) ?? DEFAULT_MAIN_SETTINGS.pageLayout,
    borderThickness: typeof settings.borderThickness === 'number' ? settings.borderThickness : DEFAULT_MAIN_SETTINGS.borderThickness,
    cornerRadius: typeof settings.cornerRadius === 'number' ? settings.cornerRadius : DEFAULT_MAIN_SETTINGS.cornerRadius,
    customCSS: resolvedCustomCSS
  }
}

// =============================================================================
// Workspace Storage Cleanup
// =============================================================================

export const clearWorkspaceStorage = (): void => {
  type WorkspaceStorageGlobal = typeof globalThis & { sessionStorage?: Storage, localStorage?: Storage }

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

  const getDraftStorage = (): Storage | null => {
    if (typeof globalThis === 'undefined') return null
    return (globalThis as WorkspaceStorageGlobal).sessionStorage ?? null
  }

  const getSavedStorage = (): Storage | null => {
    if (typeof globalThis === 'undefined') return null
    return (globalThis as WorkspaceStorageGlobal).localStorage ?? null
  }

  clearByPrefix(getDraftStorage())
  clearByPrefix(getSavedStorage())
}
