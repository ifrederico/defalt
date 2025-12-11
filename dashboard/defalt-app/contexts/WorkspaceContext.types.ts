import type { PreviewPage, PreviewDataSource, GhostPostItem, PreviewZoom } from '../hooks/usePreview'
import type { WorkspacePage, CloudSyncStatus } from '../types/workspace'

export type WorkspaceContextValue = {
  currentPage: WorkspacePage
  setCurrentPage: (page: WorkspacePage) => void
  saveStatus: 'idle' | 'saving' | 'saved'
  lastSaveTime: number | null
  hasUnsavedChanges: boolean
  isDirty: boolean
  isDraftMode: boolean
  cloudSyncStatus: CloudSyncStatus
  handleSave: () => Promise<void>
  handleExport: () => void
  handleBackup: () => void
  handleRestore: () => void
  isDownloading: boolean
  previewDevice: 'desktop' | 'mobile'
  setPreviewDevice: (device: 'desktop' | 'mobile') => void
  previewZoom: PreviewZoom
  setPreviewZoom: (zoom: PreviewZoom) => void
  previewTheme: PreviewPage
  onThemeSwitch: (page: PreviewPage) => void
  iframeReady: boolean
  setIframeReady: (ready: boolean) => void
  isPreviewLoading: boolean
  refreshPreview: () => void
  openResetDialog: () => void

  // Ghost data source
  dataSource: PreviewDataSource
  setDataSource: (source: PreviewDataSource) => void
  hasGhostCreds: boolean
  ghostDataLoading: boolean
  ghostDataError: string | null
  refreshGhostData: () => void
  resetToPlaceholder: () => void
  lastGhostFetch: Date | null

  // Post/page selection for preview
  selectedPostIndex: number
  setSelectedPostIndex: (index: number) => void
  selectedPageIndex: number
  setSelectedPageIndex: (index: number) => void
  availablePosts: GhostPostItem[]
  availablePages: GhostPostItem[]
  rehydrateWorkspace: () => void
  onRendererLoading: (isLoading: boolean) => void
  onPreviewNavigate: (path: string) => boolean
  previewRefreshKey: number
  isTogglingVisibility: boolean

  // Moved from ThemeContext
  stickyHeaderValue: string
  stickyHeaderOptions: string[]
  onStickyHeaderChange: (value: string) => void
  isSearchEnabled: boolean
  onSearchToggle: (value: boolean) => void
  typographyCase: 'default' | 'uppercase'
  onTypographyCaseChange: (value: 'default' | 'uppercase') => void
  announcementBarConfig: import('@defalt/utils/config/themeConfig').AnnouncementBarConfig
  onAnnouncementBarConfigChange: (updater: (config: import('@defalt/utils/config/themeConfig').AnnouncementBarConfig) => import('@defalt/utils/config/themeConfig').AnnouncementBarConfig) => void
  onAnnouncementBarConfigPreview: (updater: (config: import('@defalt/utils/config/themeConfig').AnnouncementBarConfig) => import('@defalt/utils/config/themeConfig').AnnouncementBarConfig) => void
  onAnnouncementBarConfigCommit: () => void
  announcementContentConfig: import('@defalt/utils/config/themeConfig').AnnouncementContentConfig
  onAnnouncementContentConfigChange: (updater: (config: import('@defalt/utils/config/themeConfig').AnnouncementContentConfig) => import('@defalt/utils/config/themeConfig').AnnouncementContentConfig) => void

  accentColor: string
  sanitizedAccentColor: string
  onAccentColorChange: (value: string) => void
  backgroundColor: string
  sanitizedBackgroundColor: string
  onBackgroundColorChange: (value: string) => void
  customCSS: string
  onCustomCSSChange: (value: string) => void

  templateDefinitions: import('@defalt/sections/engine').SectionDefinition[]
  onAddTemplateSection: (definitionId: string) => void
  onRemoveTemplateSection: (sectionId: string) => void
  customSections: Record<string, import('@defalt/sections/engine').SectionInstance>
  aiSections: Array<{ id: string, name: string, html: string }>
  addAiSection: (section: { id?: string, name: string, html: string }) => void
  removeAiSection: (id: string) => void
  renameAiSection: (id: string, newName: string) => void
  reorderAiSections: (startIndex: number, endIndex: number) => void
  sectionPadding: Record<string, { top: number, bottom: number, left?: number, right?: number }>
  onSectionPaddingChange: (id: string, direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onSectionPaddingCommit: (id: string, direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  sectionMargins: Record<string, { top?: number, bottom?: number }>
  onSectionMarginChange: (id: string, direction: 'top' | 'bottom', value: number) => void
  onSectionMarginCommit: (id: string, direction: 'top' | 'bottom', value: number) => void
  onUpdateCustomSection: (id: string, updater: (config: import('@defalt/sections/engine').SectionConfigSchema) => import('@defalt/sections/engine').SectionConfigSchema) => void
  sectionVisibility: Record<string, boolean>
  templateItems: import('@defalt/utils/config/configStateDefaults').SidebarItem[]
  footerItems: import('@defalt/utils/config/configStateDefaults').SidebarItem[]
  reorderTemplateItems: (startIndex: number, endIndex: number) => void
  reorderFooterItems: (startIndex: number, endIndex: number) => void
  toggleSectionVisibility: (id: string) => void

  headerSettings: import('./ThemeContext.types').HeaderSettingsContext
  footerSettings: import('./ThemeContext.types').FooterSettingsContext
  announcementSettings: import('./ThemeContext.types').AnnouncementSettingsContext

  // Additional properties for HandlebarsRenderer
  pageLayout: 'narrow' | 'normal'
  postFeedStyleValue: string
  postFeedStyleOptions: string[]
  onPostFeedStyleChange: (value: string) => void
  showImagesInFeed: boolean
  onShowImagesInFeedToggle: (value: boolean) => void
  showAuthor: boolean
  onShowAuthorToggle: (value: boolean) => void
  showPublishDate: boolean
  onShowPublishDateToggle: (value: boolean) => void
  showPublicationInfoSidebar: boolean
  onShowPublicationInfoSidebarToggle: (value: boolean) => void
  previewData: import('@defalt/rendering/custom-source/handlebars/dataResolvers').PreviewData
  templateOrder: string[]
  footerOrder: string[]
  customTemplateSections: import('@defalt/sections/engine').SectionInstance[]
  customSettingsOverrides: Record<string, unknown>
}
