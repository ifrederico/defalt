import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { AuthUser } from '../contexts/AuthContext.shared'
import { saveThemeToCloud, loadThemeFromCloud } from '@defalt/utils/api/cloudSync'
import {
  loadPersistedThemeDocument,
  persistThemeDocument,
  normalizeThemeDocument,
  extractHeaderSettings,
  extractMainSettings,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MAIN_SETTINGS,
  clearDraftDocument,
  clearWorkspaceStorage,
  persistSavedThemeDocument,
  loadEditorState,
  persistEditorState,
  SECTION_ID_MAP,
  CONFIG_TO_ID_MAP,
  CSS_DEFAULT_PADDING,
  CSS_DEFAULT_MARGIN,
  PADDING_BLOCK_SECTIONS,
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  type WorkspaceSnapshot,
  type ThemeDocument,
  type PageConfig,
  type SectionConfig,
  type SectionSettings,
  type SectionPadding,
  type SectionType,
  type EditorState,
  type FooterConfig,
  type HeaderSettingsSnapshot,
  type MainSettingsSnapshot
} from '@defalt/utils/config/themeConfig'
import {
  buildSectionInstance,
  getSectionDefinition,
  type SectionInstance,
  type SectionConfigSchema
} from '@defalt/sections/engine'
import { Ghost as GhostIcon } from 'lucide-react'
import {
  footerDefaultsById,
  footerItemsDefault,
  getTemplateDefaults,
  normalizeHeroSectionId,
  type SidebarItem
} from '@defalt/utils/hooks/configStateDefaults'
import { migrateLegacyHeroConfig } from '@defalt/utils/hooks/configStateHelpers'
import { useSaveQueue, isAbortError, throwIfAborted } from './useSaveQueue'
import { TIMING } from '@defalt/utils/constants'
import { apiPath } from '@defalt/utils/api/apiPath'
import { logError, logWarning, logInfo } from '@defalt/utils/logging/errorLogger'
import type { WorkspacePage, CloudSyncStatus } from '../types/workspace'
import { useHistoryContext } from '../contexts/useHistoryContext'
import { GlobalSettingCommand } from '@defalt/utils/history/commands'
import { useSectionManager, useAnnouncementBar } from './editor'
import type { ToastHandler, SectionHydrationData, AnnouncementBarHydrationData } from './editor'

export type { WorkspacePage }

type UseWorkspaceParams = {
  currentPage: WorkspacePage
  packageJson: string
  setPackageJson: (value: string) => void
  isAuthenticated: boolean
  user: AuthUser | null
  showToast: ToastHandler
  ensureCsrfToken: () => Promise<string>
}

type PersistExtras = {
  headerSettings?: HeaderSettingsSnapshot
  mainSettings?: MainSettingsSnapshot
  packageJson?: string
}

export function useWorkspace({
  currentPage,
  packageJson,
  setPackageJson,
  isAuthenticated,
  user,
  showToast,
  ensureCsrfToken
}: UseWorkspaceParams) {
  const { enqueue: enqueueSaveTask, cancel: cancelActiveSave } = useSaveQueue()
  const { executeCommand, resetHistory } = useHistoryContext()

  // Workspace-level state
  const [accentColor, setAccentColor] = useState('#AC1E3E')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [pageLayout, setPageLayout] = useState<'narrow' | 'normal'>('normal')
  const [borderThickness, setBorderThickness] = useState(1)
  const [cornerRadius, setCornerRadius] = useState(4)
  const [customCSS, setCustomCSS] = useState('')
  const [stickyHeaderMode, setStickyHeaderMode] = useState<'Always' | 'Scroll up' | 'Never'>('Never')
  const [isHeaderSearchEnabled, setHeaderSearchEnabled] = useState(true)
  const [headerTypographyCase, setHeaderTypographyCase] = useState<'default' | 'uppercase'>('default')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false)
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle')
  const lastSuccessfulSaveVersionRef = useRef(0)

  const [isHydrated, setIsHydrated] = useState(false)
  const workspaceSnapshotRef = useRef<WorkspaceSnapshot>({
    headerSettings: DEFAULT_HEADER_SETTINGS,
    mainSettings: DEFAULT_MAIN_SETTINGS
  })
  const currentPageRef = useRef(currentPage)
  const accentColorRef = useRef(accentColor)
  const bgColorRef = useRef(bgColor)
  const stickyHeaderModeRef = useRef(stickyHeaderMode)
  const headerSearchEnabledRef = useRef(isHeaderSearchEnabled)
  const headerTypographyCaseRef = useRef(headerTypographyCase)

  // Persistence state
  const saveTimeoutRef = useRef<number | null>(null)
  const previousPageRef = useRef<string>(currentPage)
  const externalStateRef = useRef<PersistExtras>({
    headerSettings: DEFAULT_HEADER_SETTINGS,
    mainSettings: DEFAULT_MAIN_SETTINGS
  })

  useEffect(() => {
    currentPageRef.current = currentPage
    accentColorRef.current = accentColor
    bgColorRef.current = bgColor
    stickyHeaderModeRef.current = stickyHeaderMode
    headerSearchEnabledRef.current = isHeaderSearchEnabled
    headerTypographyCaseRef.current = headerTypographyCase
  }, [currentPage, accentColor, bgColor, stickyHeaderMode, isHeaderSearchEnabled, headerTypographyCase])

  const markAsDirty = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const getHistoryPageId = useCallback(() => {
    const page = currentPageRef.current === 'home' ? 'homepage' : currentPageRef.current
    return page
  }, [])

  // Use extracted hooks
  const sectionManager = useSectionManager({
    executeCommand,
    markAsDirty,
    showToast,
    currentPageRef,
    getHistoryPageId
  })

  const announcementBar = useAnnouncementBar({
    executeCommand,
    markAsDirty
  })

  const templateDefaults = useMemo(() => getTemplateDefaults(currentPage), [currentPage])
  const templateDefaultsById = useMemo(() => {
    const map: Record<string, SidebarItem> = {}
    templateDefaults.forEach((item) => {
      map[item.id] = item
    })
    return map
  }, [templateDefaults])

  // Build config functions
  const buildPageConfig = useCallback((): PageConfig => {
    const templateOrder = sectionManager.templateItems
      .map((item) => SECTION_ID_MAP[item.id] || item.id)
      .filter((key) => key !== 'header' && key !== 'footerBar' && key !== 'footerSignup')

    const sections: Record<string, SectionConfig> = {}

    sectionManager.templateItems.forEach((item) => {
      if (item.id === 'header') {
        return
      }
      const configKey = SECTION_ID_MAP[item.id] || item.id
      const customInstance = sectionManager.customSections[item.id]
      const visible = !(sectionManager.sectionVisibility[item.id] ?? false)
      const definition = customInstance ? getSectionDefinition(customInstance.definitionId) : undefined
      const usesUnifiedPadding = definition?.usesUnifiedPadding ?? PADDING_BLOCK_SECTIONS.has(configKey)
      const padding = sectionManager.sectionPadding[item.id]

      const settings: SectionConfig['settings'] = {
        visible
      }

      if (customInstance) {
        settings.definitionId = customInstance.definitionId
        settings.customConfig = customInstance.config
      }

      if (padding) {
        if (usesUnifiedPadding) {
          settings.paddingBlock = padding.top
        } else {
          settings.padding = { ...padding }
        }
      }

      const margin = sectionManager.sectionMargins[item.id]
      if (margin) {
        const normalizedMargin: { top?: number, bottom?: number } = {}
        if (typeof margin.top === 'number' && Number.isFinite(margin.top)) {
          normalizedMargin.top = Math.max(0, margin.top)
        }
        if (typeof margin.bottom === 'number' && Number.isFinite(margin.bottom)) {
          normalizedMargin.bottom = Math.max(0, margin.bottom)
        }
        if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
          settings.margin = normalizedMargin
        }
      }

      const sectionType: SectionType = customInstance ? 'custom' : (configKey === 'main' ? 'main' : 'header')

      sections[configKey] = {
        type: sectionType,
        settings
      }
    })

    return {
      order: templateOrder,
      sections
    }
  }, [sectionManager.customSections, sectionManager.sectionMargins, sectionManager.sectionPadding, sectionManager.sectionVisibility, sectionManager.templateItems])

  const buildHeaderConfig = useCallback((): SectionConfig => {
    const headerSnapshot = workspaceSnapshotRef.current.headerSettings ?? DEFAULT_HEADER_SETTINGS
    const headerHidden = sectionManager.sectionVisibility.header ?? false
    const announcementBarHidden = sectionManager.sectionVisibility['announcement-bar'] ?? false
    const headerPadding = sectionManager.sectionPadding.header

    const settings: SectionSettings = {
      visible: !headerHidden,
      stickyHeaderMode: headerSnapshot.stickyHeaderMode,
      searchEnabled: headerSnapshot.searchEnabled,
      typographyCase: headerSnapshot.typographyCase,
      announcementBarVisible: !announcementBarHidden,
      announcementBarConfig: announcementBar.announcementBarConfig,
      announcementContentConfig: announcementBar.announcementContentConfig
    }

    if (headerPadding) {
      const { top, bottom, left, right } = headerPadding
      if (top !== 0 || bottom !== 0 || (left && left !== 0) || (right && right !== 0)) {
        settings.padding = { ...headerPadding }
      }
    }

    return {
      type: 'header',
      settings
    }
  }, [announcementBar.announcementBarConfig, announcementBar.announcementContentConfig, sectionManager.sectionPadding, sectionManager.sectionVisibility])

  const buildFooterConfig = useCallback((): FooterConfig => {
    const order = sectionManager.footerItems.map((item) => SECTION_ID_MAP[item.id] || item.id)
    const sections: Record<string, SectionConfig> = {}

    sectionManager.footerItems.forEach((item) => {
      const configKey = SECTION_ID_MAP[item.id] || item.id
      const visible = !(sectionManager.sectionVisibility[item.id] ?? false)
      const padding = sectionManager.sectionPadding[item.id]
      const isPaddingBlockSection = PADDING_BLOCK_SECTIONS.has(configKey)

      const settings: SectionSettings = {
        visible
      }

      if (padding) {
        if (isPaddingBlockSection) {
          settings.paddingBlock = padding.top
        } else {
          settings.padding = { ...padding }
        }
      }

      const margin = sectionManager.sectionMargins[item.id]
      if (margin) {
        const normalizedMargin: { top?: number, bottom?: number } = {}
        if (typeof margin.top === 'number' && Number.isFinite(margin.top)) {
          normalizedMargin.top = Math.max(0, margin.top)
        }
        if (typeof margin.bottom === 'number' && Number.isFinite(margin.bottom)) {
          normalizedMargin.bottom = Math.max(0, margin.bottom)
        }
        if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
          settings.margin = normalizedMargin
        }
      }

      sections[configKey] = {
        type: configKey === 'footerSignup' ? 'footer-signup' : 'footer-bar',
        settings
      }
    })

    // Footer container margin
    const footerContainerMargin = sectionManager.sectionMargins['footer']
    let margin: { top?: number; bottom?: number } | undefined
    if (footerContainerMargin) {
      const normalizedMargin: { top?: number; bottom?: number } = {}
      if (typeof footerContainerMargin.top === 'number' && Number.isFinite(footerContainerMargin.top)) {
        normalizedMargin.top = Math.max(0, footerContainerMargin.top)
      }
      if (typeof footerContainerMargin.bottom === 'number' && Number.isFinite(footerContainerMargin.bottom)) {
        normalizedMargin.bottom = Math.max(0, footerContainerMargin.bottom)
      }
      if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
        margin = normalizedMargin
      }
    }

    return {
      order,
      sections,
      margin
    }
  }, [sectionManager.footerItems, sectionManager.sectionMargins, sectionManager.sectionPadding, sectionManager.sectionVisibility])

  const getWorkspaceSnapshot = useCallback(() => workspaceSnapshotRef.current, [])

  const setWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    workspaceSnapshotRef.current = snapshot
  }, [])

  // Hydrate function
  const hydrateFromEditorState = useCallback((state: EditorState): WorkspaceSnapshot => {
    const headerConfig = state.header
    const footerConfig = state.footer
    const pageConfig = state.page
    const packageJsonValue = state.packageJson

    const allowSubscribe = currentPage === 'home'

    const templateOrder = Array.isArray(pageConfig.order) ? pageConfig.order : []
    const newTemplateItems: SidebarItem[] = []
    const newCustomSections: Record<string, SectionInstance> = {}

    templateOrder.forEach((configKey) => {
      const rawItemId = CONFIG_TO_ID_MAP[configKey] || configKey
      const normalizedItemId = normalizeHeroSectionId(rawItemId)
      if (!allowSubscribe && normalizedItemId === 'subheader') {
        return
      }
      const sectionConfig = pageConfig.sections[configKey]
      const definitionId = sectionConfig?.settings?.definitionId

      if (definitionId) {
        const instance = buildSectionInstance(definitionId, normalizedItemId, sectionConfig?.settings?.customConfig)
        if (instance) {
          newCustomSections[normalizedItemId] = instance
          newTemplateItems.push({
            id: normalizedItemId,
            label: instance.label,
            definitionId,
            icon: sectionManager.definitionIconMap[definitionId] || GhostIcon
          })
          return
        }
      }

      const migratedHeroConfig = migrateLegacyHeroConfig(normalizedItemId, sectionConfig?.settings?.customConfig as SectionConfigSchema | undefined)
      if (migratedHeroConfig) {
        const instance = buildSectionInstance('hero', normalizedItemId, migratedHeroConfig)
        if (instance) {
          newCustomSections[normalizedItemId] = instance
          newTemplateItems.push({
            id: normalizedItemId,
            label: instance.label,
            definitionId: 'hero',
            icon: sectionManager.definitionIconMap.hero
          })
          return
        }
      }

      const defaultItem = templateDefaultsById[normalizedItemId]
      if (defaultItem) {
        newTemplateItems.push({ ...defaultItem })
      } else {
        newTemplateItems.push({
          id: normalizedItemId,
          label: normalizedItemId.replace(/[-_]/g, ' ')
        })
      }
    })

    const seenTemplateIds = new Set(newTemplateItems.map((item) => item.id))
    templateDefaults.forEach((item) => {
      if (!seenTemplateIds.has(item.id)) {
        newTemplateItems.push({ ...item })
      }
    })

    const footerOrder = Array.isArray(footerConfig.order) ? footerConfig.order : []
    const newFooterItems = footerOrder.map((configKey) => {
      const itemId = CONFIG_TO_ID_MAP[configKey] || configKey
      const defaultItem = footerDefaultsById[itemId]
      return defaultItem
        ? { ...defaultItem }
        : {
          id: itemId,
          label: itemId.replace(/[-_]/g, ' ')
        }
    })

    const newVisibility: Record<string, boolean> = {}
    const newPadding: Record<string, { top: number, bottom: number, left?: number, right?: number }> = {}
    const newMargins: Record<string, { top?: number, bottom?: number }> = {}

    Object.entries(pageConfig.sections).forEach(([key, section]) => {
      const rawItemId = CONFIG_TO_ID_MAP[key] || key
      const stateId = normalizeHeroSectionId(rawItemId)
      if (!allowSubscribe && stateId === 'subheader') {
        return
      }
      const definitionId = section.settings.definitionId
      const definition = definitionId ? getSectionDefinition(definitionId) : undefined

      const defaultPadding = (() => {
        const cssDefault = CSS_DEFAULT_PADDING[key]
        if (typeof cssDefault === 'number') {
          return { top: cssDefault, bottom: cssDefault, left: 0, right: 0 }
        }
        if (cssDefault) {
          return {
            top: typeof cssDefault.top === 'number' ? cssDefault.top : 0,
            bottom: typeof cssDefault.bottom === 'number' ? cssDefault.bottom : 0,
            left: typeof cssDefault.left === 'number' ? cssDefault.left : 0,
            right: typeof cssDefault.right === 'number' ? cssDefault.right : 0,
          }
        }
        if (definition) {
          const defPadding = definition.defaultPadding
          return {
            top: defPadding.top,
            bottom: defPadding.bottom,
            left: typeof defPadding.left === 'number' ? defPadding.left : 0,
            right: typeof defPadding.right === 'number' ? defPadding.right : 0
          }
        }
        return { top: 0, bottom: 0, left: 0, right: 0 }
      })()

      const usesUnifiedPadding = definition?.usesUnifiedPadding ?? PADDING_BLOCK_SECTIONS.has(key)

      newVisibility[stateId] = section.settings.visible === false

      const resolvePaddingValue = (value: unknown, fallback: number) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value
        }
        return fallback
      }

      if (typeof section.settings.paddingBlock === 'number') {
        const unified = resolvePaddingValue(section.settings.paddingBlock, defaultPadding.top)
        newPadding[stateId] = {
          top: unified,
          bottom: unified,
          left: defaultPadding.left,
          right: defaultPadding.right
        }
      } else if (section.settings.padding) {
        const paddingSettings = section.settings.padding as SectionPadding
        newPadding[stateId] = {
          top: resolvePaddingValue(paddingSettings?.top, defaultPadding.top),
          bottom: resolvePaddingValue(paddingSettings?.bottom, defaultPadding.bottom),
          left: resolvePaddingValue(paddingSettings?.left, defaultPadding.left ?? 0),
          right: resolvePaddingValue(paddingSettings?.right, defaultPadding.right ?? 0)
        }
      } else {
        newPadding[stateId] = defaultPadding
      }

      if (usesUnifiedPadding) {
        const existing = newPadding[stateId]
        const value = existing?.top ?? defaultPadding.top
        newPadding[stateId] = {
          top: value,
          bottom: value,
          left: existing?.left ?? defaultPadding.left ?? 0,
          right: existing?.right ?? defaultPadding.right ?? 0
        }
      }

      const marginDefaults = CSS_DEFAULT_MARGIN[key]
      const resolveMarginValue = (value: unknown, fallback?: number) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return Math.max(0, value)
        }
        if (typeof fallback === 'number' && Number.isFinite(fallback)) {
          return Math.max(0, fallback)
        }
        return undefined
      }
      const marginSettings = (section.settings as SectionSettings & { margin?: { top?: number, bottom?: number } }).margin
      const resolvedTop = resolveMarginValue(marginSettings?.top, marginDefaults?.top)
      const resolvedBottom = resolveMarginValue(marginSettings?.bottom, marginDefaults?.bottom)
      if (resolvedTop !== undefined || resolvedBottom !== undefined) {
        newMargins[stateId] = {
          ...(resolvedTop !== undefined ? { top: resolvedTop } : {}),
          ...(resolvedBottom !== undefined ? { bottom: resolvedBottom } : {})
        }
      }
    })

    const footerSections = footerConfig.sections || {}
    footerOrder.forEach((key) => {
      const section = footerSections[key]
      const stateId = CONFIG_TO_ID_MAP[key] || key
      const cssDefault = CSS_DEFAULT_PADDING[stateId]
      const cssMarginDefault = CSS_DEFAULT_MARGIN[stateId]

      // Set visibility from saved section or default to visible
      if (section) {
        newVisibility[stateId] = section.settings.visible === false
      }

      // Set padding from saved section or CSS defaults
      if (section && typeof section.settings.paddingBlock === 'number') {
        const value = section.settings.paddingBlock
        newPadding[stateId] = {
          top: value,
          bottom: value,
          left: typeof cssDefault === 'object' ? cssDefault.left ?? 0 : 0,
          right: typeof cssDefault === 'object' ? cssDefault.right ?? 0 : 0
        }
      } else if (section && section.settings.padding) {
        const paddingSettings = section.settings.padding as SectionPadding
        newPadding[stateId] = {
          top: paddingSettings.top ?? (typeof cssDefault === 'object' ? cssDefault.top ?? 0 : 0),
          bottom: paddingSettings.bottom ?? (typeof cssDefault === 'object' ? cssDefault.bottom ?? 0 : 0),
          left: paddingSettings.left ?? (typeof cssDefault === 'object' ? cssDefault.left ?? 0 : 0),
          right: paddingSettings.right ?? (typeof cssDefault === 'object' ? cssDefault.right ?? 0 : 0)
        }
      } else if (typeof cssDefault === 'number') {
        newPadding[stateId] = { top: cssDefault, bottom: cssDefault, left: 0, right: 0 }
      } else if (cssDefault) {
        newPadding[stateId] = {
          top: cssDefault.top ?? 0,
          bottom: cssDefault.bottom ?? 0,
          left: cssDefault.left ?? 0,
          right: cssDefault.right ?? 0
        }
      }

      // Set margins from saved section or CSS defaults
      const sectionMargin = section
        ? (section.settings as SectionSettings & { margin?: { top?: number, bottom?: number } }).margin
        : undefined
      const resolvedTop = (() => {
        if (sectionMargin && typeof sectionMargin.top === 'number') {
          return Math.max(0, sectionMargin.top)
        }
        if (cssMarginDefault && typeof cssMarginDefault.top === 'number') {
          return Math.max(0, cssMarginDefault.top)
        }
        return undefined
      })()
      const resolvedBottom = (() => {
        if (sectionMargin && typeof sectionMargin.bottom === 'number') {
          return Math.max(0, sectionMargin.bottom)
        }
        if (cssMarginDefault && typeof cssMarginDefault.bottom === 'number') {
          return Math.max(0, cssMarginDefault.bottom)
        }
        return undefined
      })()
      if (resolvedTop !== undefined || resolvedBottom !== undefined) {
        newMargins[stateId] = {
          ...(resolvedTop !== undefined ? { top: resolvedTop } : {}),
          ...(resolvedBottom !== undefined ? { bottom: resolvedBottom } : {})
        }
      }
    })

    // Footer container margin
    const footerContainerMarginDefault = CSS_DEFAULT_MARGIN.footer
    const footerContainerMargin = footerConfig.margin
    const footerResolvedTop = (() => {
      if (footerContainerMargin && typeof footerContainerMargin.top === 'number') {
        return Math.max(0, footerContainerMargin.top)
      }
      if (footerContainerMarginDefault && typeof footerContainerMarginDefault.top === 'number') {
        return Math.max(0, footerContainerMarginDefault.top)
      }
      return undefined
    })()
    const footerResolvedBottom = (() => {
      if (footerContainerMargin && typeof footerContainerMargin.bottom === 'number') {
        return Math.max(0, footerContainerMargin.bottom)
      }
      if (footerContainerMarginDefault && typeof footerContainerMarginDefault.bottom === 'number') {
        return Math.max(0, footerContainerMarginDefault.bottom)
      }
      return undefined
    })()
    if (footerResolvedTop !== undefined || footerResolvedBottom !== undefined) {
      newMargins['footer'] = {
        ...(footerResolvedTop !== undefined ? { top: footerResolvedTop } : {}),
        ...(footerResolvedBottom !== undefined ? { bottom: footerResolvedBottom } : {})
      }
    }

    const headerHidden = headerConfig.settings.visible === false
    newVisibility.header = headerHidden
    const announcementBarVisible = (headerConfig.settings as SectionSettings & { announcementBarVisible?: boolean }).announcementBarVisible
    if (typeof announcementBarVisible === 'boolean') {
      newVisibility['announcement-bar'] = !announcementBarVisible
    }

    // Hydrate announcement bar
    const headerAnnouncementConfig = (headerConfig.settings as SectionSettings & { announcementBarConfig?: typeof DEFAULT_ANNOUNCEMENT_BAR_CONFIG }).announcementBarConfig
    const headerAnnouncementContent = (headerConfig.settings as SectionSettings & { announcementContentConfig?: typeof DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG }).announcementContentConfig
    const announcementBarData: AnnouncementBarHydrationData = {
      announcementBarConfig: headerAnnouncementConfig ?? { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG },
      announcementContentConfig: headerAnnouncementContent ?? { ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG }
    }
    announcementBar.hydrateAnnouncementBar(announcementBarData)

    const headerPadding = headerConfig.settings.padding
    if (headerPadding) {
      const top = headerPadding.top ?? 0
      const bottom = headerPadding.bottom ?? 0
      const left = headerPadding.left ?? 0
      const right = headerPadding.right ?? 0
      if (top !== 0 || bottom !== 0 || left !== 0 || right !== 0) {
        newPadding.header = { top, bottom, left, right }
      }
    } else if (typeof headerConfig.settings.paddingBlock === 'number') {
      const value = headerConfig.settings.paddingBlock
      if (value !== 0) {
        newPadding.header = {
          top: value,
          bottom: value,
          left: 0,
          right: 0
        }
      }
    }

    if (!('announcement-bar' in newVisibility)) {
      newVisibility['announcement-bar'] = false
    }

    // Hydrate section manager
    const sectionData: SectionHydrationData = {
      sectionVisibility: newVisibility,
      sectionPadding: newPadding,
      sectionMargins: newMargins,
      templateItems: newTemplateItems.length > 0 ? newTemplateItems : templateDefaults.map((item) => ({ ...item })),
      footerItems: newFooterItems.length > 0 ? newFooterItems : footerItemsDefault.map((item) => ({ ...item })),
      customSections: newCustomSections
    }
    sectionManager.hydrateSection(sectionData)

    const document = loadPersistedThemeDocument()
    const headerSettings = extractHeaderSettings(headerConfig, document)
    const mainSettings = extractMainSettings(pageConfig)

    const snapshot: WorkspaceSnapshot = {
      headerSettings,
      mainSettings,
      ...(typeof packageJsonValue === 'string' ? { packageJson: packageJsonValue } : {})
    }
    workspaceSnapshotRef.current = snapshot
    return snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable refs from hooks
  }, [currentPage, sectionManager.definitionIconMap, templateDefaults, templateDefaultsById, sectionManager.hydrateSection, announcementBar.hydrateAnnouncementBar])

  // Persistence functions
  const loadStoredState = useCallback(() => loadEditorState(currentPage), [currentPage])

  const resolveWorkspaceState = useCallback((extras?: PersistExtras): WorkspaceSnapshot => {
    const base = getWorkspaceSnapshot()
    return {
      headerSettings: extras?.headerSettings ?? base.headerSettings ?? DEFAULT_HEADER_SETTINGS,
      mainSettings: extras?.mainSettings ?? base.mainSettings ?? DEFAULT_MAIN_SETTINGS,
      ...(extras?.packageJson !== undefined
        ? { packageJson: extras.packageJson }
        : base.packageJson ? { packageJson: base.packageJson } : {})
    }
  }, [getWorkspaceSnapshot])

  const commitConfig = useCallback((extras?: PersistExtras, targetPage?: string): PageConfig => {
    const pageConfig = buildPageConfig()
    const headerConfig = buildHeaderConfig()
    const footerConfig = buildFooterConfig()
    const workspaceState = resolveWorkspaceState(extras)

    const pageToSave = targetPage ?? currentPage

    persistEditorState(pageToSave, {
      header: headerConfig,
      footer: footerConfig,
      page: pageConfig,
      packageJson: workspaceState.packageJson
    }, workspaceState.headerSettings.accentColor)

    setWorkspaceSnapshot(workspaceState)
    externalStateRef.current = {
      headerSettings: workspaceState.headerSettings,
      mainSettings: workspaceState.mainSettings,
      packageJson: workspaceState.packageJson
    }

    return pageConfig
  }, [buildPageConfig, buildHeaderConfig, buildFooterConfig, resolveWorkspaceState, currentPage, setWorkspaceSnapshot])

  const hydrateState = useCallback((state: EditorState) => {
    const snapshot = hydrateFromEditorState(state)
    externalStateRef.current = {
      headerSettings: snapshot.headerSettings ?? DEFAULT_HEADER_SETTINGS,
      mainSettings: snapshot.mainSettings ?? DEFAULT_MAIN_SETTINGS,
      packageJson: snapshot.packageJson
    }
    setIsHydrated(true)

    const headerSettings = snapshot.headerSettings ?? DEFAULT_HEADER_SETTINGS
    const mainSettings = snapshot.mainSettings ?? DEFAULT_MAIN_SETTINGS

    let parsedBgColor = '#ffffff'
    if (typeof snapshot.packageJson === 'string' && snapshot.packageJson.length > 0) {
      try {
        const pkgJson = JSON.parse(snapshot.packageJson)
        parsedBgColor = pkgJson?.config?.custom?.site_background_color?.default ?? '#ffffff'
      } catch {
        // ignore parse failure
      }
    }

    setAccentColor(headerSettings.accentColor)
    setBgColor(parsedBgColor)
    setStickyHeaderMode(headerSettings.stickyHeaderMode as 'Always' | 'Scroll up' | 'Never')
    setHeaderSearchEnabled(headerSettings.searchEnabled)
    setHeaderTypographyCase(headerSettings.typographyCase)

    setPageLayout(mainSettings.pageLayout === 'narrow' ? 'narrow' : 'normal')
    setBorderThickness(mainSettings.borderThickness)
    setCornerRadius(mainSettings.cornerRadius)
    setCustomCSS(mainSettings.customCSS)

    if (typeof snapshot.packageJson === 'string' && snapshot.packageJson.length > 0) {
      setPackageJson(snapshot.packageJson)
    }
    setWorkspaceHydrated(true)
  }, [hydrateFromEditorState, setPackageJson])

  const scheduleSave = useCallback(() => {
    if (!isHydrated) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null
      try {
        commitConfig()
      } catch (error) {
        logError(error, { scope: 'useWorkspace.scheduleSave.commit' })
      }
    }, TIMING.AUTOSAVE_DEBOUNCE_MS)
  }, [commitConfig, isHydrated])

  const saveAll = useCallback(async (extras?: PersistExtras) => {
    try {
      return commitConfig(extras)
    } catch (error) {
      logError(error, { scope: 'useWorkspace.saveAll' })
      throw error
    }
  }, [commitConfig])

  const syncExternalState = useCallback((extras: PersistExtras) => {
    externalStateRef.current = {
      headerSettings: extras.headerSettings ?? externalStateRef.current.headerSettings ?? DEFAULT_HEADER_SETTINGS,
      mainSettings: extras.mainSettings ?? externalStateRef.current.mainSettings ?? DEFAULT_MAIN_SETTINGS,
      packageJson: extras.packageJson ?? externalStateRef.current.packageJson
    }
    if (isHydrated) {
      scheduleSave()
    }
  }, [isHydrated, scheduleSave])

  const reloadWorkspace = useCallback(() => {
    const state = loadStoredState()
    hydrateState(state)
  }, [hydrateState, loadStoredState])

  // Page transition effect
  useLayoutEffect(() => {
    const switchedPage = previousPageRef.current !== currentPage
    const wasHydrated = isHydrated

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    if (switchedPage && wasHydrated) {
      setIsHydrated(false)
      try {
        commitConfig(undefined, previousPageRef.current)
      } catch (error) {
        logError(error, { scope: 'useWorkspace.pageTransition' })
      }
    }

    const shouldHydrate = switchedPage || !isHydrated
    previousPageRef.current = currentPage
    if (!shouldHydrate) {
      return
    }
    const state = loadStoredState()
    hydrateState(state)
  }, [commitConfig, currentPage, hydrateState, isHydrated, loadStoredState])

  // Cloud sync: load from cloud on initial auth
  const hasLoadedFromCloudRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !user || hasLoadedFromCloudRef.current || !isHydrated) {
      return
    }
    hasLoadedFromCloudRef.current = true
    setCloudSyncStatus('syncing')
    loadThemeFromCloud()
      .then((cloudDoc) => {
        if (cloudDoc) {
          persistThemeDocument(cloudDoc)
          persistSavedThemeDocument(cloudDoc)
          reloadWorkspace()
          setCloudSyncStatus('ready')
        } else {
          setCloudSyncStatus('idle')
        }
      })
      .catch(() => {
        setCloudSyncStatus('error')
      })
  }, [isAuthenticated, user, isHydrated, reloadWorkspace])

  // Auto-save effect
  useEffect(() => {
    if (!isHydrated) {
      return
    }
    scheduleSave()
  }, [
    isHydrated,
    sectionManager.sectionVisibility,
    sectionManager.footerItems,
    sectionManager.templateItems,
    sectionManager.sectionPadding,
    sectionManager.customSections,
    announcementBar.announcementBarConfig,
    announcementBar.announcementContentConfig,
    scheduleSave
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') {
        return
      }
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
        if (isHydrated) {
          try {
            commitConfig()
            logInfo('Committed pending changes on unmount', { scope: 'useWorkspace.unmount' })
          } catch (error) {
            logError(error, { scope: 'useWorkspace.unmount' })
          }
        }
      }
    }
  }, [commitConfig, isHydrated])

  // Workspace-specific handlers
  const handleStickyHeaderChange = useCallback((value: string) => {
    if (value === 'Always' || value === 'Scroll up' || value === 'Never') {
      const previous = stickyHeaderModeRef.current
      if (previous === value) {
        return
      }
      executeCommand(new GlobalSettingCommand({
        label: 'Change sticky header mode',
        applyState: () => setStickyHeaderMode(value),
        revertState: () => setStickyHeaderMode(previous),
        markDirty: markAsDirty
      }))
    }
  }, [executeCommand, markAsDirty])

  const handleSearchToggle = useCallback((enabled: boolean) => {
    const previous = headerSearchEnabledRef.current
    if (previous === enabled) {
      return
    }
    executeCommand(new GlobalSettingCommand({
      label: enabled ? 'Enable header search' : 'Disable header search',
      applyState: () => setHeaderSearchEnabled(enabled),
      revertState: () => setHeaderSearchEnabled(previous),
      markDirty: markAsDirty
    }))
  }, [executeCommand, markAsDirty])

  const handleTypographyCaseChange = useCallback((value: 'default' | 'uppercase') => {
    const previous = headerTypographyCaseRef.current
    if (previous === value) {
      return
    }
    executeCommand(new GlobalSettingCommand({
      label: 'Change header typography',
      applyState: () => setHeaderTypographyCase(value),
      revertState: () => setHeaderTypographyCase(previous),
      markDirty: markAsDirty
    }))
  }, [executeCommand, markAsDirty])

  const handleAccentColorChange = useCallback((value: string) => {
    const previous = accentColorRef.current
    if (previous === value) {
      return
    }
    executeCommand(new GlobalSettingCommand({
      label: 'Change accent color',
      applyState: () => setAccentColor(value),
      revertState: () => setAccentColor(previous),
      markDirty: markAsDirty
    }))
  }, [executeCommand, markAsDirty])

  const handleBackgroundColorChange = useCallback((value: string) => {
    const previous = bgColorRef.current
    if (previous === value) {
      return
    }
    executeCommand(new GlobalSettingCommand({
      label: 'Change background color',
      applyState: () => setBgColor(value),
      revertState: () => setBgColor(previous),
      markDirty: markAsDirty
    }))
  }, [executeCommand, markAsDirty])

  const handleCustomCSSChange = useCallback((value: string) => {
    setCustomCSS(value)
    markAsDirty()
  }, [markAsDirty])

  const handlePackageJsonChange = useCallback((value: string) => {
    setPackageJson(value)
    markAsDirty()
  }, [setPackageJson, markAsDirty])

  const rehydrateWorkspace = useCallback(() => {
    setWorkspaceHydrated(false)
    reloadWorkspace()
  }, [reloadWorkspace])

  useEffect(() => {
    setWorkspaceHydrated(false)
  }, [currentPage])

  useEffect(() => {
    if (hasUnsavedChanges) {
      setIsDraftMode(true)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!workspaceHydrated) {
      return
    }
    syncExternalState({
      headerSettings: {
        accentColor,
        stickyHeaderMode,
        searchEnabled: isHeaderSearchEnabled,
        typographyCase: headerTypographyCase
      },
      mainSettings: {
        pageLayout,
        borderThickness,
        cornerRadius,
        customCSS
      },
      packageJson
    })
  }, [
    workspaceHydrated,
    syncExternalState,
    accentColor,
    stickyHeaderMode,
    isHeaderSearchEnabled,
    headerTypographyCase,
    pageLayout,
    borderThickness,
    cornerRadius,
    customCSS,
    packageJson
  ])

  useEffect(() => {
    let cancelled = false
    const setCloudSyncStatusSafely = (status: CloudSyncStatus) => {
      if (!cancelled) {
        setCloudSyncStatus(status)
      }
    }
    async function initWorkspace() {
      if (!isAuthenticated || !user) {
        setCloudSyncStatusSafely('idle')
        return
      }

      setCloudSyncStatusSafely('ready')
    }

    void initWorkspace()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, showToast])

  const applyWorkspaceBackup = useCallback((backup: ThemeDocument) => {
    const normalized = normalizeThemeDocument(backup)
    persistThemeDocument(normalized)

    const pageKey = currentPage === 'home' ? 'homepage' : currentPage
    const pageConfig = normalized.pages[pageKey] ?? normalized.pages.homepage
    const headerConfig = normalized.header.sections.header
    const headerSettings = extractHeaderSettings(headerConfig, normalized)
    const mainSettings = extractMainSettings(pageConfig)
    const hasDocumentPackageJson = typeof normalized.packageJson === 'string' && normalized.packageJson.trim().length > 0
    const packageJsonValue = hasDocumentPackageJson
      ? normalized.packageJson as string
      : packageJson

    let parsedBgColor = '#ffffff'
    try {
      const pkgJson = JSON.parse(packageJsonValue)
      parsedBgColor = pkgJson?.config?.custom?.site_background_color?.default ?? '#ffffff'
    } catch {
      // ignore
    }

    setAccentColor(headerSettings.accentColor)
    setBgColor(parsedBgColor)
    setStickyHeaderMode(headerSettings.stickyHeaderMode as 'Always' | 'Scroll up' | 'Never')
    setHeaderSearchEnabled(headerSettings.searchEnabled)
    setHeaderTypographyCase(headerSettings.typographyCase)

    setPageLayout(mainSettings.pageLayout)
    setBorderThickness(mainSettings.borderThickness)
    setCornerRadius(mainSettings.cornerRadius)
    setCustomCSS(mainSettings.customCSS)

    if (hasDocumentPackageJson) {
      setPackageJson(packageJsonValue)
    }

    syncExternalState({
      headerSettings,
      mainSettings,
      ...(packageJsonValue ? { packageJson: packageJsonValue } : {})
    })
    setHasUnsavedChanges(false)
    rehydrateWorkspace()
    resetHistory()
  }, [currentPage, packageJson, resetHistory, setPackageJson, syncExternalState, rehydrateWorkspace])

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const { value: saveResult, version } = await enqueueSaveTask(async ({ signal }) => {
        throwIfAborted(signal)
        await saveAll()
        throwIfAborted(signal)

        const document = loadPersistedThemeDocument()
        persistSavedThemeDocument(document)
        clearDraftDocument()
        throwIfAborted(signal)

        if (isAuthenticated && user) {
          setCloudSyncStatus('syncing')
          try {
            await saveThemeToCloud(document)
            setCloudSyncStatus('ready')
          } catch {
            setCloudSyncStatus('error')
          }
        } else {
          setCloudSyncStatus('idle')
        }
        return { successToastType: 'local' as const }
      })

      if (version < lastSuccessfulSaveVersionRef.current) {
        return
      }
      lastSuccessfulSaveVersionRef.current = version

      setHasUnsavedChanges(false)
      setIsDraftMode(false)
      setSaveStatus('saved')
      setLastSaveTime(Date.now())

      if (saveResult?.successToastType === 'local') {
        showToast('Theme updated.', undefined, 'success')
      }

      setTimeout(() => {
        if (lastSuccessfulSaveVersionRef.current === version) {
          setSaveStatus('idle')
        }
      }, TIMING.SAVE_STATUS_DISPLAY_MS)
    } catch (error) {
      if (isAbortError(error)) {
        setSaveStatus('idle')
        setCloudSyncStatus((status) => (status === 'syncing' ? 'idle' : status))
        return
      }
      setCloudSyncStatus('error')
      logError(error, { scope: 'useWorkspace.handleSave' })
      setSaveStatus('idle')
      showToast('Save failed', 'We could not save your changes. Please try again.', 'error')
    }
  }, [enqueueSaveTask, saveAll, isAuthenticated, user, showToast])

  const resetWorkspace = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    let resetErrored = false
    const notifyResetError = (message: string) => {
      if (!resetErrored) {
        showToast('Reset failed', message, 'error')
      }
      resetErrored = true
    }

    try {
      setCloudSyncStatus('syncing')
      clearWorkspaceStorage()

      const csrf = await ensureCsrfToken()
      try {
        const response = await fetch(apiPath('/api/theme-config'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrf
          }
        })
        if (!response.ok) {
          logWarning(
            'Theme config deletion responded with an error',
            {
              scope: 'useWorkspace.resetWorkspace.deleteLocal',
              status: response.status,
              statusText: response.statusText
            }
          )
          notifyResetError('Could not clear local workspace data.')
        }
      } catch (err) {
        logWarning('Failed to delete theme document', { scope: 'useWorkspace.resetWorkspace.deleteLocal', error: err instanceof Error ? err.message : err })
        notifyResetError('Could not clear local workspace data.')
      }

      setCloudSyncStatus('ready')
    } catch (error) {
      setCloudSyncStatus('error')
      logError(error, { scope: 'useWorkspace.resetWorkspace' })
      notifyResetError('Something went wrong while resetting the workspace.')
    } finally {
      setCloudSyncStatus((status) => (status === 'syncing' ? 'idle' : status))
      rehydrateWorkspace()
      if (!resetErrored) {
        resetHistory()
        showToast('Theme reset.', undefined, 'success')
      }
    }
  }, [ensureCsrfToken, resetHistory, rehydrateWorkspace, showToast])

  return {
    // Workspace state
    accentColor,
    bgColor,
    pageLayout,
    borderThickness,
    cornerRadius,
    customCSS,
    stickyHeaderMode,
    isHeaderSearchEnabled,
    headerTypographyCase,
    hasUnsavedChanges,
    saveStatus,
    workspaceHydrated,
    isDraftMode,
    lastSaveTime,
    cloudSyncStatus,

    // Workspace handlers
    handleStickyHeaderChange,
    handleSearchToggle,
    handleTypographyCaseChange,
    handleAccentColorChange,
    handleBackgroundColorChange,
    handleCustomCSSChange,
    handlePackageJsonChange,

    // Section manager exports
    sectionVisibility: sectionManager.sectionVisibility,
    footerItems: sectionManager.footerItems,
    templateItems: sectionManager.templateItems,
    customSections: sectionManager.customSections,
    templateDefinitions: sectionManager.templateDefinitions,
    memoizedTemplateOrder: sectionManager.memoizedTemplateOrder,
    memoizedFooterOrder: sectionManager.memoizedFooterOrder,
    reorderFooterItems: sectionManager.reorderFooterItems,
    reorderTemplateItems: sectionManager.reorderTemplateItems,
    addTemplateSection: sectionManager.addTemplateSection,
    removeTemplateSection: sectionManager.removeTemplateSection,
    setSectionVisibilityState: sectionManager.setSectionVisibilityState,
    toggleSectionVisibility: sectionManager.toggleSectionVisibility,
    sectionPadding: sectionManager.sectionPadding,
    updateSectionPadding: sectionManager.updateSectionPadding,
    previewSectionPaddingChange: sectionManager.previewSectionPaddingChange,
    commitSectionPaddingChange: sectionManager.commitSectionPaddingChange,
    sectionMargins: sectionManager.sectionMargins,
    updateSectionMargin: sectionManager.updateSectionMargin,
    previewSectionMarginChange: sectionManager.previewSectionMarginChange,
    commitSectionMarginChange: sectionManager.commitSectionMarginChange,
    updateCustomSectionConfig: sectionManager.updateCustomSectionConfig,
    customTemplateSectionList: sectionManager.customTemplateSectionList,
    syncFeaturedSectionVisibility: sectionManager.syncFeaturedSectionVisibility,
    applySubheaderSpacing: sectionManager.applySubheaderSpacing,

    // Announcement bar exports
    announcementBarConfig: announcementBar.announcementBarConfig,
    updateAnnouncementBarConfig: announcementBar.updateAnnouncementBarConfig,
    previewAnnouncementBarConfig: announcementBar.previewAnnouncementBarConfig,
    commitAnnouncementBarConfig: announcementBar.commitAnnouncementBarConfig,
    announcementContentConfig: announcementBar.announcementContentConfig,
    updateAnnouncementContentConfig: announcementBar.updateAnnouncementContentConfig,

    // Workspace actions
    rehydrateWorkspace,
    setHasUnsavedChangesState: setHasUnsavedChanges,
    handleSave,
    applyWorkspaceBackup,
    resetWorkspace,
    cancelActiveSave
  }
}
