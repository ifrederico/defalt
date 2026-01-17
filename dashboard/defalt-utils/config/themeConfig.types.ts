// =============================================================================
// Theme Configuration Types
// =============================================================================

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
export type NavigationLayoutSetting = 'Logo in the middle' | 'Logo on the left' | 'Stacked'
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

/** Individual announcement block - content from Ghost page (via tag) or manual text */
export interface AnnouncementBlock {
  /** Ghost tag for content - when set, fetches from Ghost page */
  tag: string
  /** Manual text entry - used when no Ghost content */
  text: string
  /** Typography settings */
  typographySize: AnnouncementBarTypographySize
  typographyWeight: AnnouncementBarTypographyWeight
  typographySpacing: AnnouncementBarTypographySpacing
  typographyCase: AnnouncementBarTypographyCase
}

export interface AnnouncementContentConfig {
  /** Engine V2: Block array for announcements */
  announcements: AnnouncementBlock[]
}

export interface AnnouncementBarInstance {
  id: string
  hidden: boolean
  bar: AnnouncementBarConfig
  content: AnnouncementContentConfig
}

export interface SectionSettings {
  visible: boolean
  padding?: SectionPadding
  paddingBlock?: number
  margin?: SectionMargin
  definitionId?: string
  customConfig?: Record<string, unknown>
  navigationLayout?: NavigationLayoutSetting
  stickyHeaderMode?: StickyHeaderModeSetting
  searchEnabled?: boolean
  typographyCase?: HeaderTypographyCaseSetting
  announcementBars?: AnnouncementBarInstance[]
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
  schemaVersion: number
  accentColor?: string
  packageJson?: string
  customCSS?: string
  header: {
    sections: Record<string, SectionConfig>
  }
  footer: FooterConfig
  pages: Record<string, PageConfig>
}

export interface HeaderSettingsSnapshot {
  accentColor: string
  navigationLayout: NavigationLayoutSetting
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
  customCSS?: string
}

export type StorageNormalizationEvent = {
  source: 'draft-storage' | 'saved-storage'
  reason: 'schema' | 'parse'
}
