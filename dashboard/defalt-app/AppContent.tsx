import { useState, useEffect, useRef, useCallback } from 'react'
import { HandlebarsRenderer } from '@defalt/rendering/custom-source/HandlebarsRenderer'
import { TopBar } from './layout/TopBar'
import { PreviewLoadingBar } from './layout/PreviewLoadingBar'
import { SidebarRail } from './layout/SidebarRail'
import { EditorSidebar } from './layout/EditorSidebar'
import { RightDetailPanel } from './layout/RightDetailPanel'
import { SectionDetailPanel } from './layout/sidebar/pages/components/SectionDetailPanel'
import { PreviewErrorBoundary } from './components/ErrorBoundary'
import { useWorkspaceContext } from './contexts/useWorkspaceContext'
import { useThemeContext } from './contexts/useThemeContext'
import { useToast } from './components/ToastContext'
import { useMediaQuery } from '@defalt/utils/hooks'
import type { StickyHeaderMode } from '@defalt/rendering/custom-source/handlebars/headerCustomization'
import { LoadingState } from '@defalt/ui/primitives/LoadingState'
import { SidebarToggle } from '@defalt/ui'
import { useActiveDetail, useActiveTab, useHoveredSectionId, useLeftSidebarCollapsed, useScrollToSectionId, useUIActions } from './stores'
import { normalizeSectionId, resolveCustomSectionLabel, resolveSectionLabel as resolveSectionLabelFromRegistry } from '@defalt/utils/config/sectionRegistry'

export function AppContent() {
    const activeDetail = useActiveDetail()
    const activeTab = useActiveTab()
    const hoveredSectionId = useHoveredSectionId()
    const scrollToSectionId = useScrollToSectionId()
    const leftSidebarCollapsed = useLeftSidebarCollapsed()
    const { selectSection, setScrollToSectionId, clearSelection, setActiveDetail, toggleLeftSidebar } = useUIActions()
    const isWideScreen = useMediaQuery('(min-width: 1348px)')
    const ghostOverlayTimeoutRef = useRef<number | null>(null)

    const {
        currentPage,
        isPreviewLoading,
        isTogglingVisibility,
        dataSource,
        ghostDataLoading,
        previewTheme,
        previewDevice,
        previewZoom,
        iframeReady,
        setIframeReady,
        previewRefreshKey,
        onRendererLoading,
        onPreviewNavigate,

        // HandlebarsRenderer props
        pageLayout,
        previewData,
        templateOrder,
        footerOrder,
        customTemplateSections,
        customSettingsOverrides,
        announcementSettings,

        // Theme Context values needed for HandlebarsRenderer
        accentColor,
        backgroundColor,
        stickyHeaderValue,
        stickyHeaderOptions,
        onStickyHeaderChange,
        isSearchEnabled,
        onSearchToggle,
        typographyCase,
        onTypographyCaseChange,
        sectionPadding,
        onSectionPaddingChange,
        onSectionPaddingCommit,
        sectionMargins,
        onSectionMarginChange,
        onSectionMarginCommit,
        sectionVisibility,
        customCSS,
        customSections,
        aiSections,
        addAiSection,
        removeAiSection,
        onUpdateCustomSection,
        templateItems,
        footerItems,
        templateDefinitions,
        onAddTemplateSection,
        onRemoveTemplateSection,
        onDuplicateTemplateSection,
        reorderTemplateItems,
        reorderFooterItems,
        toggleSectionVisibility,
        announcementBars,
        onAddAnnouncementBar,
        onRemoveAnnouncementBar,
        onToggleAnnouncementBarHidden,
        onAnnouncementBarConfigChange,
        onAnnouncementContentConfigChange,
        navigationLayoutValue,
        navigationLayoutOptions,
        navigationLayoutError,
        onNavigationLayoutChange,
    } = useWorkspaceContext()

    const {
        headerStyleValue,
        postFeedStyleValue,
        postFeedStyleOptions,
        onPostFeedStyleChange,
        showImagesInFeed,
        onShowImagesInFeedToggle,
        showAuthor,
        onShowAuthorToggle,
        showPublishDate,
        onShowPublishDateToggle,
        showPublicationInfoSidebar,
        onShowPublicationInfoSidebarToggle,
    } = useThemeContext()
    const { showToast } = useToast()

	    const resolveSectionLabel = useCallback((sectionId: string): string => {
	        const normalizedId = normalizeSectionId(sectionId)

	        if (normalizedId === 'footer') {
	            return 'Footer'
	        }

	        const aiLabel = aiSections.find((section) => section.id === normalizedId)?.name
	        if (aiLabel) {
	            return aiLabel
	        }

	        const customSection = customSections[normalizedId]
	        if (customSection) {
	            return resolveCustomSectionLabel(normalizedId, customSection.definitionId)
	        }

	        return resolveSectionLabelFromRegistry(normalizedId, { headerStyleValue })
	    }, [aiSections, customSections, headerStyleValue])

    const handleDuplicateSection = useCallback((sectionId: string) => {
        const aiSection = aiSections.find((section) => section.id === sectionId)
        if (aiSection) {
            addAiSection({ id: aiSection.id, name: aiSection.name, html: aiSection.html })
            return
        }
        onDuplicateTemplateSection(sectionId)
    }, [addAiSection, aiSections, onDuplicateTemplateSection])

    const handleRemoveSection = useCallback((sectionId: string) => {
        const aiSection = aiSections.find((section) => section.id === sectionId)
        if (aiSection) {
            removeAiSection(sectionId)
            return
        }
        onRemoveTemplateSection(sectionId)
    }, [aiSections, onRemoveTemplateSection, removeAiSection])

    const handlePreviewSectionSelect = useCallback((sectionId: string) => {
        const normalizedId = normalizeSectionId(sectionId)
        if (activeDetail?.id === normalizedId) {
            return
        }
        const label = resolveSectionLabel(normalizedId)
        selectSection(normalizedId, label)
    }, [activeDetail, resolveSectionLabel, normalizeSectionId, selectSection])

    useEffect(() => {
        if (!activeDetail) {
            return
        }
        if (activeDetail.blockIndex !== undefined) {
            return
        }
        const normalizedId = normalizeSectionId(activeDetail.id)
        const resolvedLabel = resolveSectionLabel(normalizedId)
        if (resolvedLabel && resolvedLabel !== activeDetail.label) {
            setActiveDetail({ ...activeDetail, id: normalizedId, label: resolvedLabel })
            return
        }
        if (normalizedId !== activeDetail.id) {
            setActiveDetail({ ...activeDetail, id: normalizedId })
        }
    }, [activeDetail, normalizeSectionId, resolveSectionLabel, setActiveDetail])

    // Effect to handle checkout success
    useEffect(() => {
        const query = new URLSearchParams(window.location.search)
        if (query.get('checkout_success')) {
            showToast('Subscription updated', 'Your subscription has been successfully updated.', 'success')
            window.history.replaceState({}, '', window.location.pathname)
        }
    }, [showToast])

    const handlePreviewNavigateWrapper = (href: string) => onPreviewNavigate(href)

    // Calculate preview frame style based on device
    const previewFrameStyle = previewDevice === 'mobile'
        ? { maxWidth: '375px', margin: '0 auto', border: '1px solid #e5e7eb' }
        : { maxWidth: '100%', width: '100%' }

    // Zoom scale for preview
    const zoomScale = previewZoom / 100

    const overlayTarget = ghostDataLoading || (dataSource === 'ghost' && (isPreviewLoading || !iframeReady))
    const [ghostOverlayVisible, setGhostOverlayVisible] = useState(overlayTarget)

    useEffect(() => {
        if (overlayTarget) {
            if (ghostOverlayTimeoutRef.current) {
                clearTimeout(ghostOverlayTimeoutRef.current)
                ghostOverlayTimeoutRef.current = null
            }
            setGhostOverlayVisible(true)
        } else {
            ghostOverlayTimeoutRef.current = window.setTimeout(() => {
                setGhostOverlayVisible(false)
                ghostOverlayTimeoutRef.current = null
            }, 350)
        }

        return () => {
            if (ghostOverlayTimeoutRef.current) {
                clearTimeout(ghostOverlayTimeoutRef.current)
                ghostOverlayTimeoutRef.current = null
            }
        }
    }, [overlayTarget])

    // Props for SectionDetailPanel (used in both narrow and wide screen layouts)
    const sectionsPanelProps = {
        previewData,
        dataSource,
        accentColor,
        sectionVisibility,
        toggleSectionVisibility,
        templateItems,
        footerItems,
        templateDefinitions,
        onAddTemplateSection,
        onRemoveTemplateSection,
        reorderTemplateItems,
        reorderFooterItems,
        sectionPadding,
        onSectionPaddingChange,
        onSectionPaddingCommit,
        sectionMargins,
        onSectionMarginChange,
        onSectionMarginCommit,
        customSections,
        onUpdateCustomSection,
        navigationLayoutValue,
        navigationLayoutOptions,
        navigationLayoutError,
        onNavigationLayoutChange,
        stickyHeaderValue,
        stickyHeaderOptions,
        onStickyHeaderChange,
        isSearchEnabled,
        onSearchToggle,
        typographyCase,
        onTypographyCaseChange,
        announcementBars,
        onAddAnnouncementBar,
        onRemoveAnnouncementBar,
        onToggleAnnouncementBarHidden,
        onAnnouncementBarConfigChange,
        onAnnouncementContentConfigChange,
        headerStyleValue,
        postFeedStyleValue,
        postFeedStyleOptions,
        onPostFeedStyleChange,
        showImagesInFeed,
        onShowImagesInFeedToggle,
        showAuthor,
        onShowAuthorToggle,
        showPublishDate,
        onShowPublishDateToggle,
        showPublicationInfoSidebar,
        onShowPublicationInfoSidebarToggle,
    }

    return (
        <div className="h-screen flex flex-col bg-subtle relative">
            <TopBar />

            {(isPreviewLoading || isTogglingVisibility || ghostDataLoading) && <PreviewLoadingBar visible={isPreviewLoading || isTogglingVisibility || ghostDataLoading} />}

            <div className="flex-1 flex overflow-hidden">
                <SidebarRail />

                {/* Narrow screen: show detail panel only for Sections tab */}
                {!isWideScreen && activeTab === 'sections' && activeDetail ? (
                    <div
                        className={`group relative flex-shrink-0 transition-[width] duration-300 ${leftSidebarCollapsed ? 'w-0' : 'w-[300px]'}`}
                    >
                        {leftSidebarCollapsed && (
                            <div className="absolute inset-y-0 left-0 w-8 z-10" aria-hidden="true" />
                        )}
                        <aside
                            className={`relative z-20 h-full w-[300px] bg-surface border-r border-border flex flex-col transition-transform duration-300 ${
                                leftSidebarCollapsed ? '-translate-x-full group-hover:translate-x-0 shadow-md-heavy' : 'translate-x-0'
                            }`}
                        >
                            <SidebarToggle
                                position="left"
                                collapsed={leftSidebarCollapsed}
                                onToggle={toggleLeftSidebar}
                                className={`transition-opacity duration-200 ${leftSidebarCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            />
                            <SectionDetailPanel
                                activeDetail={activeDetail}
                                onBack={clearSelection}
                                props={sectionsPanelProps}
                            />
                        </aside>
                    </div>
                ) : (
                    <EditorSidebar currentPage={currentPage} />
                )}

                <main className="flex-1 bg-subtle overflow-hidden">
                    <div className={`h-full p-4 ${zoomScale === 1 ? 'overflow-auto' : 'overflow-hidden'}`}>
                        <div
                            className="relative bg-surface rounded shadow-sm overflow-auto mx-auto transition-[max-width] duration-300"
                            style={{
                                ...previewFrameStyle,
                                transform: `scale(${zoomScale})`,
                                transformOrigin: 'top center',
                                width: zoomScale !== 1 ? `${100 / zoomScale}%` : undefined,
                                height: `${100 / zoomScale}%`,
                            }}
                        >
                            {ghostOverlayVisible && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
                                    <LoadingState />
                                </div>
                            )}
                            <PreviewErrorBoundary
                                resetKeys={[previewTheme, previewDevice, previewData, previewRefreshKey]}
                                onPreviewError={() => {
                                    setIframeReady(false)
                                }}
                                onPreviewReset={() => {
                                    setIframeReady(false)
                                }}
                            >
                                <HandlebarsRenderer
                                    key={`${previewTheme}-${previewRefreshKey}`}
                                    accentColor={accentColor}
                                    backgroundColor={backgroundColor}
                                    pageLayout={pageLayout}
                                    currentPage={previewTheme}
                                    previewData={previewData}
                                    navigationLayout={navigationLayoutValue}
                                    stickyHeaderMode={
                                        stickyHeaderValue === 'Always' || stickyHeaderValue === 'Scroll up' || stickyHeaderValue === 'Never'
                                            ? stickyHeaderValue
                                            : ('Always' as StickyHeaderMode)
                                    }
                                    showSearch={isSearchEnabled}
                                    typographyCase={typographyCase}
                                    sectionPadding={sectionPadding}
                                    sectionMargins={sectionMargins}
                                    hiddenSections={sectionVisibility}
                                    templateOrder={templateOrder}
                                    footerOrder={footerOrder}
                                    onLoadingChange={onRendererLoading}
                                    onNavigate={handlePreviewNavigateWrapper}
                                    customCss={customCSS}
                                    customTemplateSections={customTemplateSections}
                                    aiSections={aiSections}
                                    customSettingsOverrides={customSettingsOverrides}
                                    announcementBars={announcementSettings.bars}
                                    selectedSectionId={activeDetail?.id}
                                    hoveredSectionId={hoveredSectionId}
                                    scrollToSectionId={scrollToSectionId}
                                    onScrollComplete={() => setScrollToSectionId(null)}
                                    onSectionSelect={handlePreviewSectionSelect}
                                    onDuplicateSection={handleDuplicateSection}
                                    onRemoveSection={handleRemoveSection}
                                    onToggleSectionVisibility={toggleSectionVisibility}
                                />
                            </PreviewErrorBoundary>
                        </div>
                    </div>
                </main>

                {isWideScreen && (
                    <RightDetailPanel>
                        {activeDetail && (
                            <SectionDetailPanel
                                activeDetail={activeDetail}
                                onBack={clearSelection}
                                props={sectionsPanelProps}
                            />
                        )}
                    </RightDetailPanel>
                )}
            </div>
        </div>
    )
}
