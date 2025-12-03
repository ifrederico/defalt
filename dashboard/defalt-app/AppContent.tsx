import { useState, useEffect, useRef, useCallback } from 'react'
import { HandlebarsRenderer } from '@defalt/rendering/custom-source/HandlebarsRenderer'
import { TopBar } from './layout/TopBar'
import { PreviewLoadingBar } from './layout/PreviewLoadingBar'
import { SidebarRail } from './layout/SidebarRail'
import { EditorSidebar } from './layout/EditorSidebar'
import { RightDetailPanel } from './layout/RightDetailPanel'
import { SectionDetailRenderer } from './layout/sidebar/pages/components/SectionDetailRenderer'
import { PreviewErrorBoundary } from './components/ErrorBoundary'
import { useWorkspaceContext } from './contexts/useWorkspaceContext'
import { useThemeContext } from './contexts/useThemeContext'
import { useToast } from './components/ToastContext'
import { useMediaQuery } from '@defalt/utils/hooks'
import type { StickyHeaderMode } from '@defalt/rendering/custom-source/handlebars/headerCustomization'
import { LoadingState } from '@defalt/ui/primitives/LoadingState'
import { useActiveDetail, useSidebarExpanded, useUIActions } from './stores'

export function AppContent() {
    const activeDetail = useActiveDetail()
    const sidebarExpanded = useSidebarExpanded()
    const { selectSection } = useUIActions()
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
        onUpdateCustomSection,
        templateItems,
        footerItems,
        templateDefinitions,
        onAddTemplateSection,
        onRemoveTemplateSection,
        reorderTemplateItems,
        reorderFooterItems,
        toggleSectionVisibility,
        announcementBarConfig,
        onAnnouncementBarConfigChange,
        onAnnouncementBarConfigPreview,
        onAnnouncementBarConfigCommit,
        announcementContentConfig,
        onAnnouncementContentConfigChange,
    } = useWorkspaceContext()

    const {
        navigationLayoutValue,
        navigationLayoutOptions,
        navigationLayoutError,
        onNavigationLayoutChange,
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

    const normalizeSectionId = useCallback((sectionId: string): string => {
        const lower = sectionId.toLowerCase()
        if (lower === 'footer_bar' || lower === 'footer-bar') {
            return 'footerBar'
        }
        if (lower === 'footer_signup' || lower === 'footer-signup') {
            return 'footerSignup'
        }
        if (lower === 'announcement') {
            return 'announcement'
        }
        return sectionId
    }, [])

    const resolveSectionLabel = useCallback((sectionId: string): string => {
        const normalizedId = normalizeSectionId(sectionId)

        if (normalizedId === 'header') {
            return 'Header'
        }
        if (normalizedId === 'announcement-bar' || normalizedId === 'announcement') {
            return 'Announcement bar'
        }
        if (normalizedId === 'subheader') {
            const labelMap: Record<string, string> = {
                'Landing': 'Landing',
                'Search': 'Search',
                'Magazine': 'Magazine',
                'Highlight': 'Highlight',
                'Off': 'Off',
            }
            return labelMap[headerStyleValue] ?? 'Subheader'
        }

        const templateLabel = templateItems.find((item) => item.id === normalizedId)?.label
        if (templateLabel) {
            return templateLabel
        }

        const footerLabel = footerItems.find((item) => item.id === normalizedId)?.label
        if (footerLabel) {
            return footerLabel
        }

        const customSection = customSections[normalizedId]
        if (customSection?.definitionId) {
            return customSection.definitionId
        }

        return normalizedId
    }, [footerItems, headerStyleValue, templateItems, customSections, normalizeSectionId])

    const handlePreviewSectionSelect = useCallback((sectionId: string) => {
        const normalizedId = normalizeSectionId(sectionId)
        if (activeDetail?.id === normalizedId) {
            return
        }
        const label = resolveSectionLabel(normalizedId)
        selectSection(normalizedId, label)
    }, [activeDetail, resolveSectionLabel, normalizeSectionId, selectSection])

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

    // Props for SectionDetailRenderer (used in RightDetailPanel at wide screens)
    const sectionsPanelProps = {
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
        announcementBarConfig,
        onAnnouncementBarConfigChange,
        onAnnouncementBarConfigPreview,
        onAnnouncementBarConfigCommit,
        announcementContentConfig,
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

                <EditorSidebar
                    currentPage={currentPage}
                    renderDetailInline={!isWideScreen}
                />

                <main className={`${sidebarExpanded ? 'hidden' : 'flex-1'} bg-subtle overflow-hidden`}>
                    <div className="h-full p-4 overflow-auto">
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
                                    customSettingsOverrides={customSettingsOverrides}
                                    announcementBarConfig={announcementSettings.bar}
                                    announcementContentConfig={announcementSettings.content}
                                    selectedSectionId={activeDetail?.id}
                                    onSectionSelect={handlePreviewSectionSelect}
                                />
                            </PreviewErrorBoundary>
                        </div>
                    </div>
                </main>

                {isWideScreen && (
                    <RightDetailPanel
                        detailContent={<SectionDetailRenderer activeDetail={activeDetail} props={sectionsPanelProps} />}
                    />
                )}
            </div>
        </div>
    )
}
