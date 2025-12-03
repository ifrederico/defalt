import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { WorkspaceContext } from './WorkspaceContextBase'
import type { WorkspaceContextValue } from './WorkspaceContext.types'
import { useThemeContext } from './useThemeContext'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/ToastContext'
import { useHistoryContext } from './useHistoryContext'
import { useWorkspace, type WorkspacePage } from '../hooks/useWorkspace'
import { usePreview } from '../hooks/usePreview'
import { useExport } from '../hooks/useExport'
import { sanitizeHexColor } from '@defalt/utils/security/sanitizers'
import { SECTION_ID_MAP, PADDING_BLOCK_SECTIONS } from '@defalt/utils/config/themeConfig'
import { trackEvent } from '@defalt/utils/analytics/umami'
import { UpgradeModal } from '../components/UpgradeModal'
import { AppButton } from '@defalt/ui/primitives/AppButton'
import type { StickyHeaderMode } from '@defalt/rendering/custom-source/HandlebarsRenderer'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const {
    packageJson,
    onPackageJsonChange: setPackageJson,
    navigationLayoutValue,
    navigationLayoutOptions,
    navigationLayoutError: headerSettingsError,
    headerAndFooterColorValue,
    titleFontValue,
    bodyFontValue,
    signupHeadingValue,
    signupSubheadingValue,
    headerStyleValue,
    headerTextValue,
    backgroundImageEnabled,
    showFeaturedPosts,
    onShowFeaturedPostsToggle: handleShowFeaturedPostsToggle,
    postFeedStyleValue,
    postFeedStyleOptions,
    onPostFeedStyleChange: handlePostFeedStyleChange,
    showImagesInFeed,
    onShowImagesInFeedToggle: handleShowImagesInFeedToggle,
    showAuthor,
    onShowAuthorToggle: handleShowAuthorToggle,
    showPublishDate,
    onShowPublishDateToggle: handleShowPublishDateToggle,
    showPublicationInfoSidebar,
    onShowPublicationInfoSidebarToggle: handleShowPublicationInfoSidebarToggle,
    showPostMetadata,
    enableDropCapsOnPosts,
    showRelatedArticles,
  } = useThemeContext()

  const {
    user,
    loading: authLoading,
    refreshCsrfToken
  } = useAuth()
  const isAuthenticated = !authLoading && !!user
  const { showToast } = useToast()
  const { switchPage } = useHistoryContext()

  const [currentPage, setCurrentPage] = useState<WorkspacePage>('home')
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
  const [isResetDialogOpen, setResetDialogOpen] = useState(false)
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: ''
  })

  const showError = useCallback((title: string, message: string) => {
    setErrorDialog({ open: true, title, message })
  }, [])

  const ensureCsrfToken = useCallback(async (): Promise<string> => {
    const token = await refreshCsrfToken()
    return token ?? ''
  }, [refreshCsrfToken])

  const workspace = useWorkspace({
    currentPage,
    packageJson,
    setPackageJson,
    isAuthenticated,
    user,
    showToast,
    ensureCsrfToken
  })

  const {
    accentColor,
    bgColor,
    customCSS,
    stickyHeaderMode,
    isHeaderSearchEnabled,
    headerTypographyCase,
    hasUnsavedChanges,
    saveStatus,
    lastSaveTime,
    isDraftMode,
    workspaceHydrated,
    cloudSyncStatus,
    handleStickyHeaderChange,
    handleSearchToggle,
    handleTypographyCaseChange,
    handleAccentColorChange,
    handleBackgroundColorChange,
    handleCustomCSSChange,
    sectionVisibility,
    footerItems,
    templateItems,
    customSections,
    templateDefinitions,
    reorderFooterItems,
    reorderTemplateItems,
    addTemplateSection,
    removeTemplateSection,
    toggleSectionVisibility,
    sectionPadding,
    previewSectionPaddingChange,
    commitSectionPaddingChange,
    sectionMargins,
    previewSectionMarginChange,
    commitSectionMarginChange,
    updateCustomSectionConfig,
    announcementBarConfig,
    updateAnnouncementBarConfig,
    previewAnnouncementBarConfig,
    commitAnnouncementBarConfig,
    announcementContentConfig,
    updateAnnouncementContentConfig,
    rehydrateWorkspace,
    syncFeaturedSectionVisibility,
    applySubheaderSpacing,
    pageLayout,
    memoizedTemplateOrder,
    memoizedFooterOrder,
    customTemplateSectionList,
    handleSave,
    applyWorkspaceBackup,
    resetWorkspace,
    cancelActiveSave
  } = workspace

  const {
    previewData,
    previewPage,
    setPreviewPage,
    previewDevice,
    setPreviewDevice,
    previewZoom,
    setPreviewZoom,
    previewIsLoading,
    iframeReady,
    setIframeReady,
    refreshPreview,
    handleRendererLoading,
    handlePreviewNavigate,
    previewRefreshKey,
    // Ghost data source
    dataSource,
    setDataSource,
    hasGhostCreds,
    ghostDataLoading,
    ghostDataError,
    refreshGhostData,
    resetToPlaceholder,
    lastGhostFetch,
    // Post/page selection
    selectedPostIndex,
    setSelectedPostIndex,
    selectedPageIndex,
    setSelectedPageIndex,
    availablePosts,
    availablePages
  } = usePreview()

  const {
    isDownloading,
    fileInputRef,
    handleThemeDownloadRequest,
    handleDownloadBackup,
    handleUploadConfigClick,
    handleBackupFileChange,
  } = useExport({
    hasUnsavedChanges,
    applyWorkspaceBackup,
    showToast,
    showError,
    ensureCsrfToken,
    onShowUpgradeModal: () => setUpgradeModalOpen(true)
  })

  const handleRemoveTemplateSection = useCallback((sectionId: string) => {
    removeTemplateSection(sectionId)
  }, [removeTemplateSection])

  const handlePageChange = useCallback((page: WorkspacePage) => {
    cancelActiveSave()
    setCurrentPage(page)
    setPreviewPage(page)
  }, [cancelActiveSave, setPreviewPage])

  const showFeaturedPostsRef = useRef(showFeaturedPosts)
  const visibilityToggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousHeaderStyleRef = useRef(headerStyleValue)
  const hasAppliedSubheaderSpacingRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    showFeaturedPostsRef.current = showFeaturedPosts
  }, [showFeaturedPosts])

  const stickyHeaderOptions = useMemo<StickyHeaderMode[]>(() => ['Always', 'Scroll up', 'Never'], [])

  useEffect(() => {
    syncFeaturedSectionVisibility(showFeaturedPostsRef.current, { silent: true })
  }, [currentPage, templateItems, syncFeaturedSectionVisibility])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDraftMode) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDraftMode])

  const lastSyncedFeaturedRef = useRef<boolean | null>(null)
  useEffect(() => {
    const hasChanged = lastSyncedFeaturedRef.current !== showFeaturedPosts
    if (hasChanged) {
      const isFirstSync = lastSyncedFeaturedRef.current === null
      syncFeaturedSectionVisibility(showFeaturedPosts, { silent: isFirstSync })
      lastSyncedFeaturedRef.current = showFeaturedPosts
    }
  }, [showFeaturedPosts, syncFeaturedSectionVisibility])

  const resetFeaturedOrder = useCallback(() => {
    const featuredIndex = templateItems.findIndex((item) => item.id === 'featured')
    if (featuredIndex === -1) {
      return
    }
    const subheaderIndex = templateItems.findIndex((item) => item.id === 'subheader')
    const targetIndex = subheaderIndex === -1
      ? 0
      : featuredIndex > subheaderIndex
        ? subheaderIndex + 1
        : subheaderIndex
    if (featuredIndex === targetIndex) {
      return
    }
    reorderTemplateItems(featuredIndex, targetIndex)
  }, [templateItems, reorderTemplateItems])

  useEffect(() => {
    const previousStyle = previousHeaderStyleRef.current
    if (previousStyle !== headerStyleValue && headerStyleValue !== 'Magazine') {
      resetFeaturedOrder()
    }
    previousHeaderStyleRef.current = headerStyleValue
  }, [resetFeaturedOrder, headerStyleValue])

  useEffect(() => {
    if (!workspaceHydrated) {
      hasAppliedSubheaderSpacingRef.current = false
      return
    }
    const shouldRecordHistory = hasAppliedSubheaderSpacingRef.current
    applySubheaderSpacing(headerStyleValue, { recordHistory: shouldRecordHistory })
    hasAppliedSubheaderSpacingRef.current = true
  }, [applySubheaderSpacing, headerStyleValue, workspaceHydrated])

  const sanitizedAccentColor = useMemo(
    () => sanitizeHexColor(accentColor, '#AC1E3E'),
    [accentColor]
  )

  const sanitizedBackgroundColor = useMemo(
    () => sanitizeHexColor(bgColor, '#ffffff'),
    [bgColor]
  )


  const customSettingsOverrides = useMemo(() => ({
    header_and_footer_color: headerAndFooterColorValue,
    title_font: titleFontValue,
    body_font: bodyFontValue,
    signup_heading: signupHeadingValue,
    signup_subheading: signupSubheadingValue,
    header_style: headerStyleValue,
    header_text: headerTextValue,
    background_image: backgroundImageEnabled,
    show_featured_posts: showFeaturedPosts,
    post_feed_style: postFeedStyleValue,
    show_images_in_feed: showImagesInFeed,
    show_author: showAuthor,
    show_publish_date: showPublishDate,
    show_publication_info_sidebar: showPublicationInfoSidebar,
    show_post_metadata: showPostMetadata,
    enable_drop_caps_on_posts: enableDropCapsOnPosts,
    show_related_articles: showRelatedArticles,
  }), [
    headerAndFooterColorValue,
    titleFontValue,
    bodyFontValue,
    signupHeadingValue,
    signupSubheadingValue,
    headerStyleValue,
    headerTextValue,
    backgroundImageEnabled,
    showFeaturedPosts,
    postFeedStyleValue,
    showImagesInFeed,
    showAuthor,
    showPublishDate,
    showPublicationInfoSidebar,
    showPostMetadata,
    enableDropCapsOnPosts,
    showRelatedArticles,
  ])

  // Wait, showImagesInFeed etc are in ThemeContext.
  // headerTypographyCase is in Workspace.

  const headerSettingsSummary = useMemo(() => ({
    navigationLayoutValue,
    navigationLayoutOptions,
    navigationLayoutError: headerSettingsError,
    stickyHeaderValue: stickyHeaderMode,
    stickyHeaderOptions,
    isSearchEnabled: isHeaderSearchEnabled,
    typographyCase: headerTypographyCase,
    headerStyleValue: headerStyleValue,
    headerTextValue,
    backgroundImageEnabled,
    showFeaturedPosts,
  }), [
    navigationLayoutValue,
    navigationLayoutOptions,
    headerSettingsError,
    stickyHeaderMode,
    stickyHeaderOptions,
    isHeaderSearchEnabled,
    headerTypographyCase,
    headerStyleValue,
    headerTextValue,
    backgroundImageEnabled,
    showFeaturedPosts,
  ])

  const footerSettingsSummary = useMemo(() => ({
    showImagesInFeed,
    showAuthor,
    showPublishDate,
    showPublicationInfoSidebar,
    showPostMetadata,
    enableDropCapsOnPosts,
    showRelatedArticles,
  }), [
    showImagesInFeed,
    showAuthor,
    showPublishDate,
    showPublicationInfoSidebar,
    showPostMetadata,
    enableDropCapsOnPosts,
    showRelatedArticles,
  ])

  const announcementSettingsSummary = useMemo(() => ({
    bar: announcementBarConfig,
    content: announcementContentConfig,
  }), [announcementBarConfig, announcementContentConfig])

  const handleSectionPaddingChange = useCallback((
    id: string,
    direction: 'top' | 'bottom' | 'left' | 'right',
    value: number
  ) => {
    const configKey = SECTION_ID_MAP[id] || id
    previewSectionPaddingChange(id, (current) => {
      if (PADDING_BLOCK_SECTIONS.has(configKey)) {
        return {
          ...current,
          top: value,
          bottom: value
        }
      }
      return {
        ...current,
        [direction]: value
      }
    })
  }, [previewSectionPaddingChange])

  const handleSectionPaddingCommit = useCallback((
    id: string,
    direction: 'top' | 'bottom' | 'left' | 'right',
    value: number
  ) => {
    const configKey = SECTION_ID_MAP[id] || id
    commitSectionPaddingChange(id, (current) => {
      if (PADDING_BLOCK_SECTIONS.has(configKey)) {
        return {
          ...current,
          top: value,
          bottom: value
        }
      }
      return {
        ...current,
        [direction]: value
      }
    })
  }, [commitSectionPaddingChange])

  const handleSectionMarginChange = useCallback((
    id: string,
    direction: 'top' | 'bottom',
    value: number
  ) => {
    previewSectionMarginChange(id, (current) => ({
      ...current,
      [direction]: value
    }))
  }, [previewSectionMarginChange])

  const handleSectionMarginCommit = useCallback((
    id: string,
    direction: 'top' | 'bottom',
    value: number
  ) => {
    commitSectionMarginChange(id, (current) => ({
      ...current,
      [direction]: value
    }))
  }, [commitSectionMarginChange])

  const handleToggleSectionVisibility = useCallback((id: string) => {
    const wasHidden = Boolean(sectionVisibility[id])

    // Show loading indicator
    setIsTogglingVisibility(true)

    toggleSectionVisibility(id)
    trackEvent('section-changed', { action: 'toggle', sectionId: id })
    if (currentPage === 'home' && id === 'featured') {
      const nextShowFeatured = wasHidden
      if (showFeaturedPosts !== nextShowFeatured) {
        handleShowFeaturedPostsToggle(nextShowFeatured)
      }
    }

    // Hide loading indicator after a brief delay to show the animation
    if (visibilityToggleTimeoutRef.current) {
      clearTimeout(visibilityToggleTimeoutRef.current)
    }
    visibilityToggleTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsTogglingVisibility(false)
      }
      visibilityToggleTimeoutRef.current = null
    }, 300)
  }, [toggleSectionVisibility, sectionVisibility, currentPage, showFeaturedPosts, handleShowFeaturedPostsToggle])

  const handleAddTemplateSection = useCallback((definitionId: string) => {
    addTemplateSection(definitionId)
    trackEvent('section-changed', { action: 'add', sectionId: definitionId })
  }, [addTemplateSection])

  useEffect(() => {
    switchPage(currentPage)
  }, [currentPage, switchPage])

  // Keep workspace currentPage in sync with preview navigation
  useEffect(() => {
    const mapped = previewPage === 'page2' ? 'home' : previewPage
    if (currentPage !== mapped) {
      setCurrentPage(mapped)
    }
  }, [currentPage, previewPage])

  useEffect(() => cancelActiveSave, [cancelActiveSave])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (visibilityToggleTimeoutRef.current) {
        clearTimeout(visibilityToggleTimeoutRef.current)
      }
    }
  }, [])

  const handleResetToDefaultClick = useCallback(() => {
    setResetDialogOpen(true)
  }, [])

  const handleConfirmReset = async () => {
    setResetDialogOpen(false)
    await resetWorkspace()
  }

  const handleCancelReset = () => {
    setResetDialogOpen(false)
  }

  const saveState = useMemo(() => ({
    saveStatus,
    lastSaveTime,
    hasUnsavedChanges,
    isDirty: hasUnsavedChanges,
    isDraftMode,
    cloudSyncStatus,
    handleSave,
  }), [saveStatus, lastSaveTime, hasUnsavedChanges, isDraftMode, cloudSyncStatus, handleSave])

  const previewState = useMemo(() => ({
    previewDevice,
    setPreviewDevice,
    previewZoom,
    setPreviewZoom,
    previewTheme: previewPage,
    onThemeSwitch: setPreviewPage,
    iframeReady,
    setIframeReady,
    isPreviewLoading: previewIsLoading,
    refreshPreview,
    onRendererLoading: handleRendererLoading,
    onPreviewNavigate: handlePreviewNavigate,
    previewRefreshKey,
    previewData,
  }), [previewDevice, setPreviewDevice, previewZoom, setPreviewZoom, previewPage, setPreviewPage, iframeReady, setIframeReady, previewIsLoading, refreshPreview, handleRendererLoading, handlePreviewNavigate, previewRefreshKey, previewData])

  const ghostDataState = useMemo(() => ({
    dataSource,
    setDataSource,
    hasGhostCreds,
    ghostDataLoading,
    ghostDataError,
    refreshGhostData,
    resetToPlaceholder,
    lastGhostFetch,
    selectedPostIndex,
    setSelectedPostIndex,
    selectedPageIndex,
    setSelectedPageIndex,
    availablePosts,
    availablePages,
  }), [dataSource, setDataSource, hasGhostCreds, ghostDataLoading, ghostDataError, refreshGhostData, resetToPlaceholder, lastGhostFetch, selectedPostIndex, setSelectedPostIndex, selectedPageIndex, setSelectedPageIndex, availablePosts, availablePages])

  const colorState = useMemo(() => ({
    accentColor,
    sanitizedAccentColor,
    onAccentColorChange: handleAccentColorChange,
    backgroundColor: bgColor,
    sanitizedBackgroundColor,
    onBackgroundColorChange: handleBackgroundColorChange,
    customCSS,
    onCustomCSSChange: handleCustomCSSChange,
  }), [accentColor, sanitizedAccentColor, handleAccentColorChange, bgColor, sanitizedBackgroundColor, handleBackgroundColorChange, customCSS, handleCustomCSSChange])

  const sectionState = useMemo(() => ({
    templateDefinitions,
    onAddTemplateSection: handleAddTemplateSection,
    onRemoveTemplateSection: handleRemoveTemplateSection,
    customSections,
    sectionPadding,
    onSectionPaddingChange: handleSectionPaddingChange,
    onSectionPaddingCommit: handleSectionPaddingCommit,
    sectionMargins,
    onSectionMarginChange: handleSectionMarginChange,
    onSectionMarginCommit: handleSectionMarginCommit,
    onUpdateCustomSection: updateCustomSectionConfig,
    sectionVisibility,
    templateItems,
    footerItems,
    reorderTemplateItems,
    reorderFooterItems,
    toggleSectionVisibility: handleToggleSectionVisibility,
    templateOrder: memoizedTemplateOrder,
    footerOrder: memoizedFooterOrder,
    customTemplateSections: customTemplateSectionList,
  }), [templateDefinitions, handleAddTemplateSection, handleRemoveTemplateSection, customSections, sectionPadding, handleSectionPaddingChange, handleSectionPaddingCommit, sectionMargins, handleSectionMarginChange, handleSectionMarginCommit, updateCustomSectionConfig, sectionVisibility, templateItems, footerItems, reorderTemplateItems, reorderFooterItems, handleToggleSectionVisibility, memoizedTemplateOrder, memoizedFooterOrder, customTemplateSectionList])

  const headerControlState = useMemo(() => ({
    stickyHeaderValue: stickyHeaderMode,
    stickyHeaderOptions,
    onStickyHeaderChange: handleStickyHeaderChange,
    isSearchEnabled: isHeaderSearchEnabled,
    onSearchToggle: handleSearchToggle,
    typographyCase: headerTypographyCase,
    onTypographyCaseChange: handleTypographyCaseChange,
    announcementBarConfig,
    onAnnouncementBarConfigChange: updateAnnouncementBarConfig,
    onAnnouncementBarConfigPreview: previewAnnouncementBarConfig,
    onAnnouncementBarConfigCommit: commitAnnouncementBarConfig,
    announcementContentConfig,
    onAnnouncementContentConfigChange: updateAnnouncementContentConfig,
  }), [stickyHeaderMode, stickyHeaderOptions, handleStickyHeaderChange, isHeaderSearchEnabled, handleSearchToggle, headerTypographyCase, handleTypographyCaseChange, announcementBarConfig, updateAnnouncementBarConfig, previewAnnouncementBarConfig, commitAnnouncementBarConfig, announcementContentConfig, updateAnnouncementContentConfig])

  const feedSettingsState = useMemo(() => ({
    pageLayout,
    postFeedStyleValue,
    postFeedStyleOptions,
    onPostFeedStyleChange: handlePostFeedStyleChange,
    showImagesInFeed,
    onShowImagesInFeedToggle: handleShowImagesInFeedToggle,
    showAuthor,
    onShowAuthorToggle: handleShowAuthorToggle,
    showPublishDate,
    onShowPublishDateToggle: handleShowPublishDateToggle,
    showPublicationInfoSidebar,
    onShowPublicationInfoSidebarToggle: handleShowPublicationInfoSidebarToggle,
  }), [pageLayout, postFeedStyleValue, postFeedStyleOptions, handlePostFeedStyleChange, showImagesInFeed, handleShowImagesInFeedToggle, showAuthor, handleShowAuthorToggle, showPublishDate, handleShowPublishDateToggle, showPublicationInfoSidebar, handleShowPublicationInfoSidebarToggle])

  const exportHandlers = useMemo(() => ({
    handleExport: handleThemeDownloadRequest,
    handleBackup: handleDownloadBackup,
    handleRestore: handleUploadConfigClick,
    isDownloading,
  }), [handleThemeDownloadRequest, handleDownloadBackup, handleUploadConfigClick, isDownloading])

  const workspaceContextValue = useMemo<WorkspaceContextValue>(() => ({
    currentPage,
    setCurrentPage: handlePageChange,
    ...saveState,
    ...exportHandlers,
    ...previewState,
    openResetDialog: handleResetToDefaultClick,
    ...ghostDataState,
    rehydrateWorkspace,
    isTogglingVisibility,
    ...headerControlState,
    ...colorState,
    ...sectionState,
    headerSettings: headerSettingsSummary,
    footerSettings: footerSettingsSummary,
    announcementSettings: announcementSettingsSummary,
    ...feedSettingsState,
    customSettingsOverrides,
  }), [
    currentPage,
    handlePageChange,
    saveState,
    exportHandlers,
    previewState,
    handleResetToDefaultClick,
    ghostDataState,
    rehydrateWorkspace,
    isTogglingVisibility,
    headerControlState,
    colorState,
    sectionState,
    headerSettingsSummary,
    footerSettingsSummary,
    announcementSettingsSummary,
    feedSettingsState,
    customSettingsOverrides,
  ])

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      {children}

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <AlertDialog.Root open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-inverse/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded-md shadow-lg z-50 w-[400px] max-w-full">
            <AlertDialog.Title className="text-lg font-bold text-error mb-2">
              {errorDialog.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-secondary mb-4">
              {errorDialog.message}
            </AlertDialog.Description>
            <div className="flex justify-end">
              <AlertDialog.Action asChild>
                <AppButton variant="secondary">
                  Close
                </AppButton>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-inverse/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface p-6 rounded-md shadow-lg z-50 w-[400px] max-w-full">
            <AlertDialog.Title className="text-lg font-bold text-foreground mb-2">
              Reset Workspace?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-secondary mb-4">
              This will revert all changes to the default theme configuration. This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <AppButton variant="secondary" onClick={handleCancelReset}>
                  Cancel
                </AppButton>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <AppButton variant="danger" onClick={handleConfirmReset}>
                  Reset
                </AppButton>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleBackupFileChange}
      />
    </WorkspaceContext.Provider>
  )
}
