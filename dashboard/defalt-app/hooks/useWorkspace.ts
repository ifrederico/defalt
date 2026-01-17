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
  DEFAULT_ACCENT_COLOR,
  clearDraftDocument,
  clearWorkspaceStorage,
  consumeStorageNormalizationEvent,
  persistSavedThemeDocument,
  loadEditorState,
  persistEditorState,
  type WorkspaceSnapshot,
  type ThemeDocument,
  type PageConfig,
  type EditorState,
  type HeaderSettingsSnapshot,
  type MainSettingsSnapshot,
  type NavigationLayoutSetting
} from '@defalt/utils/config/themeConfig'
import { NAVIGATION_LAYOUT_VALUES } from '@defalt/sections/engine'
import { Ghost as GhostIcon } from 'lucide-react'
import { getTemplateDefaults, type SidebarItem } from '@defalt/utils/config/sectionRegistry'
import { useSaveQueue, isAbortError, throwIfAborted } from '@defalt/utils/hooks'
import { TIMING } from '@defalt/utils/constants'
import { apiPath } from '@defalt/utils/api/apiPath'
import { logError, logWarning, logInfo } from '@defalt/utils/logging/errorLogger'
import type { WorkspacePage, CloudSyncStatus } from '../types/workspace'
import { useHistoryContext } from '../contexts/useHistoryContext'
import { GlobalSettingCommand } from '@defalt/utils/history/commands'
import { useSectionManager, useAnnouncementBars } from './editor'
import type { ToastHandler, SectionHydrationData, AnnouncementBarsHydrationData } from './editor'
import type { TagState } from '@defalt/utils/config/sectionRegistry'
import {
  buildPageConfigFromState,
  buildHeaderConfigFromState,
  buildFooterConfigFromState,
  hydrateWorkspaceState,
  resolveWorkspaceSnapshot,
  parseBgColorFromPackageJson
} from '../workspace'

export type { WorkspacePage }

type UseWorkspaceParams = {
  currentPage: WorkspacePage
  packageJson: string
  setPackageJson: (value: string) => void
  resetPackageJson: () => void
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
  resetPackageJson,
  isAuthenticated,
  user,
  showToast,
  ensureCsrfToken
}: UseWorkspaceParams) {
  const { enqueue: enqueueSaveTask, cancel: cancelActiveSave } = useSaveQueue()
  const { executeCommand, resetHistory } = useHistoryContext()

  // Workspace-level state
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [pageLayout, setPageLayout] = useState<'narrow' | 'normal'>('normal')
  const [borderThickness, setBorderThickness] = useState(1)
  const [cornerRadius, setCornerRadius] = useState(4)
  const [customCSS, setCustomCSS] = useState('')
  const [navigationLayout, setNavigationLayout] = useState<NavigationLayoutSetting>('Logo in the middle')
  const [stickyHeaderMode, setStickyHeaderMode] = useState<'Always' | 'Scroll up' | 'Never'>('Never')
  const [isHeaderSearchEnabled, setHeaderSearchEnabled] = useState(true)
  const [headerTypographyCase, setHeaderTypographyCase] = useState<'default' | 'uppercase'>('default')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false)
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle')
  const [schemaResetEvent, setSchemaResetEvent] = useState<ReturnType<typeof consumeStorageNormalizationEvent> | null>(null)
  const lastSuccessfulSaveVersionRef = useRef(0)

  const [isHydrated, setIsHydrated] = useState(false)
  const workspaceSnapshotRef = useRef<WorkspaceSnapshot>({
    headerSettings: DEFAULT_HEADER_SETTINGS,
    mainSettings: DEFAULT_MAIN_SETTINGS
  })
  const currentPageRef = useRef(currentPage)
  const accentColorRef = useRef(accentColor)
  const bgColorRef = useRef(bgColor)
  const navigationLayoutRef = useRef(navigationLayout)
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
    navigationLayoutRef.current = navigationLayout
    stickyHeaderModeRef.current = stickyHeaderMode
    headerSearchEnabledRef.current = isHeaderSearchEnabled
    headerTypographyCaseRef.current = headerTypographyCase
  }, [currentPage, accentColor, bgColor, navigationLayout, stickyHeaderMode, isHeaderSearchEnabled, headerTypographyCase])

  const markAsDirty = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const getHistoryPageId = useCallback(() => {
    const page = currentPageRef.current === 'home' ? 'homepage' : currentPageRef.current
    return page
  }, [])

  const tagStateRef = useRef<TagState>({
    customSections: {},
    announcementBars: []
  })

  // Use extracted hooks
  const sectionManager = useSectionManager({
    executeCommand,
    markAsDirty,
    showToast,
    currentPageRef,
    getHistoryPageId,
    tagStateRef
  })

  const announcementBarsManager = useAnnouncementBars({
    executeCommand,
    markAsDirty,
    showToast,
    tagStateRef
  })

  useEffect(() => {
    tagStateRef.current.customSections = sectionManager.customSections
  }, [sectionManager.customSections])

  useEffect(() => {
    tagStateRef.current.announcementBars = announcementBarsManager.announcementBars
  }, [announcementBarsManager.announcementBars])

  const templateDefaults = useMemo(() => getTemplateDefaults(currentPage), [currentPage])
  const templateDefaultsById = useMemo(() => {
    const map: Record<string, SidebarItem> = {}
    templateDefaults.forEach((item) => {
      map[item.id] = item
    })
    return map
  }, [templateDefaults])

  // Build config functions using pure functions from workspace module
  const buildPageConfig = useCallback((): PageConfig => {
    return buildPageConfigFromState({
      sectionVisibility: sectionManager.sectionVisibility,
      sectionPadding: sectionManager.sectionPadding,
      sectionMargins: sectionManager.sectionMargins,
      customSections: sectionManager.customSections,
      templateItems: sectionManager.templateItems,
      footerItems: sectionManager.footerItems
    })
  }, [sectionManager.customSections, sectionManager.sectionMargins, sectionManager.sectionPadding, sectionManager.sectionVisibility, sectionManager.templateItems, sectionManager.footerItems])

  const buildHeaderConfig = useCallback(() => {
    const headerSnapshot = workspaceSnapshotRef.current.headerSettings ?? DEFAULT_HEADER_SETTINGS
    return buildHeaderConfigFromState(
      {
        sectionVisibility: sectionManager.sectionVisibility,
        sectionPadding: sectionManager.sectionPadding,
        sectionMargins: sectionManager.sectionMargins,
        customSections: sectionManager.customSections,
        templateItems: sectionManager.templateItems,
        footerItems: sectionManager.footerItems
      },
      {
        headerSettings: headerSnapshot,
        announcementBars: announcementBarsManager.announcementBars
      }
    )
  }, [announcementBarsManager.announcementBars, sectionManager.sectionPadding, sectionManager.sectionVisibility, sectionManager.sectionMargins, sectionManager.customSections, sectionManager.templateItems, sectionManager.footerItems])

  const buildFooterConfig = useCallback(() => {
    return buildFooterConfigFromState({
      sectionVisibility: sectionManager.sectionVisibility,
      sectionPadding: sectionManager.sectionPadding,
      sectionMargins: sectionManager.sectionMargins,
      customSections: sectionManager.customSections,
      templateItems: sectionManager.templateItems,
      footerItems: sectionManager.footerItems
    })
  }, [sectionManager.footerItems, sectionManager.sectionMargins, sectionManager.sectionPadding, sectionManager.sectionVisibility, sectionManager.customSections, sectionManager.templateItems])

  const getWorkspaceSnapshot = useCallback(() => workspaceSnapshotRef.current, [])

  const setWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
    workspaceSnapshotRef.current = snapshot
  }, [])

  // Hydrate function - uses pure hydrateWorkspaceState from workspace module
  const hydrateFromEditorState = useCallback((state: EditorState): WorkspaceSnapshot => {
    // Use pure function to extract all hydration data
    const result = hydrateWorkspaceState({
      state,
      currentPage: currentPage === 'home' ? 'home' : currentPage as 'about' | 'post' | 'page',
      templateDefaults,
      templateDefaultsById,
      definitionIconMap: sectionManager.definitionIconMap,
      defaultIcon: GhostIcon
    })

    // Hydrate announcement bars
    const announcementBarsData: AnnouncementBarsHydrationData = {
      announcementBars: result.announcementBars
    }
    announcementBarsManager.hydrateAnnouncementBars(announcementBarsData)

    // Hydrate section manager
    const sectionData: SectionHydrationData = {
      sectionVisibility: result.sectionVisibility,
      sectionPadding: result.sectionPadding,
      sectionMargins: result.sectionMargins,
      templateItems: result.templateItems,
      footerItems: result.footerItems,
      customSections: result.customSections
    }
    sectionManager.hydrateSection(sectionData)

    // Update snapshot ref
    workspaceSnapshotRef.current = result.snapshot

    // Show toast for invalid custom sections
    if (result.invalidCustomSections.length > 0) {
      const preview = result.invalidCustomSections.slice(0, 3).join(', ')
      const suffix = result.invalidCustomSections.length > 3 ? ` +${result.invalidCustomSections.length - 3} more` : ''
      showToast('Invalid saved settings', `Reset to defaults: ${preview}${suffix}`, 'error')
    }

    return result.snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable refs from hooks
  }, [currentPage, sectionManager.definitionIconMap, templateDefaults, templateDefaultsById, sectionManager.hydrateSection, announcementBarsManager.hydrateAnnouncementBars, showToast])

  // Persistence functions
  const loadStoredState = useCallback(() => loadEditorState(currentPage), [currentPage])

  const resolveWorkspaceState = useCallback((extras?: PersistExtras): WorkspaceSnapshot => {
    const base = getWorkspaceSnapshot()
    return resolveWorkspaceSnapshot(base, extras)
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
      packageJson: workspaceState.packageJson,
      customCSS: workspaceState.mainSettings.customCSS
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
    const normalizationEvent = consumeStorageNormalizationEvent()
    let snapshot: WorkspaceSnapshot
    try {
      snapshot = hydrateFromEditorState(state)
    } catch (error) {
      logError(error, { scope: 'useWorkspace.hydrateState' })
      clearDraftDocument()
      showToast('Workspace reset', 'Invalid draft data. Reverted to last saved.', 'error')

      const recovered = loadStoredState()
      try {
        snapshot = hydrateFromEditorState(recovered)
      } catch (recoveryError) {
        logError(recoveryError, { scope: 'useWorkspace.hydrateState.recovery' })
        clearWorkspaceStorage()
        showToast('Workspace reset', 'Storage was corrupted. Reset to defaults.', 'error')
        snapshot = hydrateFromEditorState(loadEditorState(currentPage))
      }
    }
    externalStateRef.current = {
      headerSettings: snapshot.headerSettings ?? DEFAULT_HEADER_SETTINGS,
      mainSettings: snapshot.mainSettings ?? DEFAULT_MAIN_SETTINGS,
      packageJson: snapshot.packageJson
    }
    setIsHydrated(true)

    if (normalizationEvent) {
      const sourceLabel = normalizationEvent.source === 'draft-storage' ? 'Draft' : 'Saved'
      if (normalizationEvent.reason === 'parse') {
        showToast('Workspace reset', `${sourceLabel} data was corrupted. Reset to defaults.`, 'error')
      } else {
        setSchemaResetEvent(normalizationEvent)
      }
    }

    const headerSettings = snapshot.headerSettings ?? DEFAULT_HEADER_SETTINGS
    const mainSettings = snapshot.mainSettings ?? DEFAULT_MAIN_SETTINGS

    setAccentColor(headerSettings.accentColor)
    setBgColor(parseBgColorFromPackageJson(snapshot.packageJson))
    setNavigationLayout(headerSettings.navigationLayout)
    setStickyHeaderMode(headerSettings.stickyHeaderMode as 'Always' | 'Scroll up' | 'Never')
    setHeaderSearchEnabled(headerSettings.searchEnabled)
    setHeaderTypographyCase(headerSettings.typographyCase)

    setPageLayout(mainSettings.pageLayout === 'narrow' ? 'narrow' : 'normal')
    setBorderThickness(mainSettings.borderThickness)
    setCornerRadius(mainSettings.cornerRadius)
    setCustomCSS(mainSettings.customCSS)

    if (typeof snapshot.packageJson === 'string' && snapshot.packageJson.length > 0) {
      setPackageJson(snapshot.packageJson)
    } else {
      resetPackageJson()
    }
    setWorkspaceHydrated(true)
  }, [currentPage, hydrateFromEditorState, loadStoredState, resetPackageJson, setPackageJson, showToast])

  const dismissSchemaResetEvent = useCallback(() => {
    setSchemaResetEvent(null)
  }, [])

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
      .then((result) => {
        if (result.success && result.data) {
          persistThemeDocument(result.data)
          persistSavedThemeDocument(result.data)
          reloadWorkspace()
          setCloudSyncStatus('ready')
        } else if (result.success) {
          setCloudSyncStatus('idle')
        } else {
          setCloudSyncStatus('error')
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
    sectionManager.sectionMargins,
    sectionManager.customSections,
    announcementBarsManager.announcementBars,
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
  const buildPackageJsonWithNavigationLayout = useCallback((value: NavigationLayoutSetting): string | null => {
    try {
      const parsed = JSON.parse(packageJson || '{}') as Record<string, unknown>
      const configRaw = parsed.config
      const config = (typeof configRaw === 'object' && configRaw !== null && !Array.isArray(configRaw))
        ? { ...(configRaw as Record<string, unknown>) }
        : {}
      parsed.config = config

      const customRaw = config.custom
      const custom = (typeof customRaw === 'object' && customRaw !== null && !Array.isArray(customRaw))
        ? { ...(customRaw as Record<string, unknown>) }
        : {}
      config.custom = custom

      const navRaw = custom.navigation_layout
      const navigationLayout = (typeof navRaw === 'object' && navRaw !== null && !Array.isArray(navRaw))
        ? { ...(navRaw as Record<string, unknown>) }
        : {}
      navigationLayout.type = typeof navigationLayout.type === 'string' ? navigationLayout.type : 'select'

      const existingOptions = navigationLayout.options
      navigationLayout.options = Array.isArray(existingOptions)
        ? existingOptions.filter((option): option is string => typeof option === 'string')
        : [...NAVIGATION_LAYOUT_VALUES]
      navigationLayout.default = value

      custom.navigation_layout = navigationLayout

      return JSON.stringify(parsed, null, 2)
    } catch {
      return null
    }
  }, [packageJson])

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

  const handleNavigationLayoutChange = useCallback((value: NavigationLayoutSetting) => {
    if (!NAVIGATION_LAYOUT_VALUES.includes(value)) {
      return
    }
    const previous = navigationLayoutRef.current
    if (previous === value) {
      return
    }

    const nextPackageJson = buildPackageJsonWithNavigationLayout(value)
    if (!nextPackageJson) {
      showToast('Invalid package.json', 'Fix JSON in Code tab to edit navigation layout.', 'error')
      return
    }

    const previousPackageJson = packageJson

    executeCommand(new GlobalSettingCommand({
      label: 'Change navigation layout',
      applyState: () => {
        setNavigationLayout(value)
        setPackageJson(nextPackageJson)
      },
      revertState: () => {
        setNavigationLayout(previous)
        setPackageJson(previousPackageJson)
      },
      markDirty: markAsDirty
    }))
  }, [buildPackageJsonWithNavigationLayout, executeCommand, markAsDirty, packageJson, setPackageJson, showToast])

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
        navigationLayout,
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
    navigationLayout,
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
    const mainSettings = extractMainSettings(pageConfig, normalized)
    const hasDocumentPackageJson = typeof normalized.packageJson === 'string' && normalized.packageJson.trim().length > 0
    const packageJsonValue = hasDocumentPackageJson
      ? normalized.packageJson as string
      : packageJson

    setAccentColor(headerSettings.accentColor)
    setBgColor(parseBgColorFromPackageJson(packageJsonValue))
    setNavigationLayout(headerSettings.navigationLayout)
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
          const result = await saveThemeToCloud(document)
          setCloudSyncStatus(result.success ? 'ready' : 'error')
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
    navigationLayout,
    stickyHeaderMode,
    isHeaderSearchEnabled,
    headerTypographyCase,
    hasUnsavedChanges,
    saveStatus,
    workspaceHydrated,
    isDraftMode,
    lastSaveTime,
    cloudSyncStatus,
    schemaResetEvent,
    dismissSchemaResetEvent,

    // Workspace handlers
    handleNavigationLayoutChange,
    handleStickyHeaderChange,
    handleSearchToggle,
    handleTypographyCaseChange,
    handleAccentColorChange,
    handleBackgroundColorChange,
    handleCustomCSSChange,

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
    duplicateTemplateSection: sectionManager.duplicateTemplateSection,
    setSectionVisibilityState: sectionManager.setSectionVisibilityState,
    setSectionsVisibilityState: sectionManager.setSectionsVisibilityState,
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

    // Announcement bars exports
    announcementBars: announcementBarsManager.announcementBars,
    addAnnouncementBar: announcementBarsManager.addAnnouncementBar,
    removeAnnouncementBar: announcementBarsManager.removeAnnouncementBar,
    toggleAnnouncementBarHidden: announcementBarsManager.toggleAnnouncementBarHidden,
    updateAnnouncementBarConfig: announcementBarsManager.updateAnnouncementBarConfig,
    updateAnnouncementContentConfig: announcementBarsManager.updateAnnouncementContentConfig,

    // Workspace actions
    rehydrateWorkspace,
    setHasUnsavedChangesState: setHasUnsavedChanges,
    handleSave,
    applyWorkspaceBackup,
    resetWorkspace,
    cancelActiveSave
  }
}
