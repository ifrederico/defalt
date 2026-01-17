// =============================================================================
// Theme Configuration Defaults and Constants
// =============================================================================

import { WORKSPACE_STORAGE_PREFIX } from '../constants.js'
import type {
  SectionPadding,
  SectionMargin,
  AnnouncementBarConfig,
  AnnouncementContentConfig,
  HeaderSettingsSnapshot,
  MainSettingsSnapshot,
  PageType
} from './themeConfig.types.js'

// =============================================================================
// Limits
// =============================================================================

export const MAX_ANNOUNCEMENT_BARS = 5
export const MAX_ANNOUNCEMENTS_PER_BAR = 5

// =============================================================================
// CSS Defaults
// =============================================================================

export const CSS_DEFAULT_PADDING: Record<string, number | SectionPadding> = {
  subheader: 160,
  main: 0,
  footerBar: 28,
  footerSignup: { top: 0, bottom: 160 }
}

export const DEFAULT_CUSTOM_SECTION_PADDING: SectionPadding = { top: 48, bottom: 48, left: 0, right: 0 }

export const SUBHEADER_MARGIN_DEFAULT = 40

export const CSS_DEFAULT_MARGIN: Record<string, SectionMargin> = {
  footer: { top: 172 },
  footerBar: { bottom: 100 }
}

export const PADDING_BLOCK_SECTIONS = new Set(['subheader', 'main', 'footerBar'])

// =============================================================================
// Default Colors
// =============================================================================

/** Default accent color used throughout the application */
export const DEFAULT_ACCENT_COLOR = '#AC1E3E'

// =============================================================================
// Announcement Bar Defaults
// =============================================================================

export const ANNOUNCEMENT_BAR_PADDING_DEFAULTS = {
  top: 8,
  bottom: 8
} as const

export const DEFAULT_ANNOUNCEMENT_BAR_CONFIG: AnnouncementBarConfig = {
  width: 'default',
  backgroundColor: DEFAULT_ACCENT_COLOR,
  textColor: '#ffffff',
  dividerThickness: 0,
  dividerColor: '#e5e7eb',
  paddingTop: ANNOUNCEMENT_BAR_PADDING_DEFAULTS.top,
  paddingBottom: ANNOUNCEMENT_BAR_PADDING_DEFAULTS.bottom
}

export const DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG: AnnouncementContentConfig = {
  announcements: [
    { tag: '#announcement', text: '', typographySize: 'normal', typographyWeight: 'default', typographySpacing: 'regular', typographyCase: 'default' }
  ]
}

// =============================================================================
// Header/Main Settings Defaults
// =============================================================================

export const DEFAULT_HEADER_SETTINGS: HeaderSettingsSnapshot = {
  accentColor: DEFAULT_ACCENT_COLOR,
  navigationLayout: 'Logo in the middle',
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

// =============================================================================
// Document/Storage Constants
// =============================================================================

export const THEME_DOCUMENT_FILENAME = 'defalt-theme.json'
export const THEME_DOCUMENT_VERSION = 1
export const CURRENT_SCHEMA_VERSION = 1
export const DEFAULT_DOCUMENT_NAME = 'defalt-theme'

export const DRAFT_STORAGE_KEY = `${WORKSPACE_STORAGE_PREFIX}:draft`
export const SAVED_STORAGE_KEY = `${WORKSPACE_STORAGE_PREFIX}:saved`
export const SCHEMA_BACKUP_STORAGE_KEY = 'defalt:schema-backup'

// =============================================================================
// Page Key Mappings
// =============================================================================

export const PAGE_KEY_MAP: Record<PageType, string> = {
  home: 'homepage',
  about: 'about',
  post: 'post',
  page: 'page'
}

export type DocumentPageKey = typeof PAGE_KEY_MAP[PageType]

// =============================================================================
// Section ID Mappings
// =============================================================================

export const SECTION_ID_MAP: Record<string, string> = {
  header: 'header',
  subheader: 'subheader',
  featured: 'featured',
  main: 'main',
  footer: 'footer',
  footerBar: 'footerBar',
  footerSignup: 'footerSignup'
}

export const CONFIG_TO_ID_MAP: Record<string, string> = {
  header: 'header',
  subheader: 'subheader',
  featured: 'featured',
  main: 'main',
  footer: 'footer',
  footerBar: 'footerBar',
  footerSignup: 'footerSignup'
}
