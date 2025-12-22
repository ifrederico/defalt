import { useMemo } from 'react'
import { HomepageSectionsPanel } from './sidebar/pages/HomepageSectionsPanel'
import { AboutSectionsPanel } from './sidebar/pages/AboutSectionsPanel'
import { PostSectionsPanel } from './sidebar/pages/PostSectionsPanel'
import type { SectionsPanelProps } from './sidebar/pages/SectionsPanelBase'
import { ThemeSettingsPanel } from './sidebar/ThemeSettingsPanel'
import { AIPanel } from './sidebar/AIPanel'
import { SidebarToggle } from '@defalt/ui'
import { useThemeContext } from '../contexts/useThemeContext'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { useActiveTab, useActiveDetail, useLeftSidebarCollapsed, useUIActions } from '../stores'

export type EditorSidebarProps = {
  currentPage: 'home' | 'about' | 'post'
}

export function EditorSidebar({
  currentPage,
}: EditorSidebarProps) {
  const activeTab = useActiveTab()
  const activeDetail = useActiveDetail()
  const leftSidebarCollapsed = useLeftSidebarCollapsed()
  const { toggleLeftSidebar, setActiveDetail } = useUIActions()
  const theme = useThemeContext()
  const workspace = useWorkspaceContext()

  const {
    headerAndFooterColorValue,
    headerAndFooterColorOptions,
    onHeaderAndFooterColorChange,
    titleFontValue,
    titleFontOptions,
    onTitleFontChange,
    bodyFontValue,
    bodyFontOptions,
    onBodyFontChange,
    signupHeadingValue,
    onSignupHeadingChange,
    signupSubheadingValue,
    onSignupSubheadingChange,
    headerStyleValue,
    headerStyleOptions,
    onHeaderStyleChange,
    headerTextValue,
    onHeaderTextChange,
    backgroundImageEnabled,
    onBackgroundImageToggle,
    showFeaturedPosts,
    onShowFeaturedPostsToggle,
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
    showPostMetadata,
    onShowPostMetadataToggle,
    enableDropCapsOnPosts,
    onEnableDropCapsOnPostsToggle,
    showRelatedArticles,
    onShowRelatedArticlesToggle,
  } = theme

  const {
    accentColor,
    onAccentColorChange,
    backgroundColor,
	    onBackgroundColorChange,
	    customCSS,
	    onCustomCSSChange,
      previewData,
      dataSource,
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
    stickyHeaderValue,
	    stickyHeaderOptions,
	    onStickyHeaderChange,
    isSearchEnabled,
    onSearchToggle,
    typographyCase,
    onTypographyCaseChange,
    templateDefinitions,
    onAddTemplateSection,
    onRemoveTemplateSection,
    customSections,
    sectionPadding,
    sectionMargins,
    onSectionPaddingChange,
    onSectionPaddingCommit,
    onSectionMarginChange,
    onSectionMarginCommit,
    onUpdateCustomSection,
    sectionVisibility,
    templateItems,
    footerItems,
    reorderTemplateItems,
    reorderFooterItems,
    toggleSectionVisibility,
    setSectionsVisibilityState,
    aiSections,
    removeAiSection,
    renameAiSection,
    reorderAiSections
  } = workspace
  const isFooterBarHidden = Boolean(sectionVisibility['footerBar'])
  const panelProps = useMemo<SectionsPanelProps>(() => ({
    previewData,
    dataSource,
    accentColor,
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
    sectionVisibility,
    toggleSectionVisibility,
    setSectionsVisibilityState,
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
	    aiSections,
	    onRemoveAiSection: removeAiSection,
	    onRenameAiSection: renameAiSection,
    onReorderAiSections: reorderAiSections,
  }), [
    previewData,
    dataSource,
    accentColor,
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
    sectionVisibility,
    toggleSectionVisibility,
    setSectionsVisibilityState,
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
	    aiSections,
	    removeAiSection,
	    renameAiSection,
    reorderAiSections,
  ])

  let content: React.ReactNode
  if (activeTab === 'sections') {
    const panelMap = {
      home: HomepageSectionsPanel,
      about: AboutSectionsPanel,
      post: PostSectionsPanel,
    } as const

    const SectionsPanelComponent = panelMap[currentPage] ?? HomepageSectionsPanel

    content = (
      <SectionsPanelComponent
        {...panelProps}
        activeDetail={activeDetail}
        onActiveDetailChange={setActiveDetail}
      />
    )
  } else if (activeTab === 'settings') {
    content = (
      <ThemeSettingsPanel
        accentColor={accentColor}
        onAccentColorChange={onAccentColorChange}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={onBackgroundColorChange}
        navigationLayoutValue={navigationLayoutValue}
        navigationLayoutOptions={navigationLayoutOptions}
        navigationLayoutError={navigationLayoutError}
        onNavigationLayoutChange={onNavigationLayoutChange}
        headerAndFooterColorValue={headerAndFooterColorValue}
        headerAndFooterColorOptions={headerAndFooterColorOptions}
        onHeaderAndFooterColorChange={onHeaderAndFooterColorChange}
        titleFontValue={titleFontValue}
        titleFontOptions={titleFontOptions}
        onTitleFontChange={onTitleFontChange}
        bodyFontValue={bodyFontValue}
        bodyFontOptions={bodyFontOptions}
        onBodyFontChange={onBodyFontChange}
        isFooterBarHidden={isFooterBarHidden}
        signupHeadingValue={signupHeadingValue}
        onSignupHeadingChange={onSignupHeadingChange}
        signupSubheadingValue={signupSubheadingValue}
        onSignupSubheadingChange={onSignupSubheadingChange}
        headerStyleValue={headerStyleValue}
        headerStyleOptions={headerStyleOptions}
        onHeaderStyleChange={onHeaderStyleChange}
        headerTextValue={headerTextValue}
        onHeaderTextChange={onHeaderTextChange}
        backgroundImageEnabled={backgroundImageEnabled}
        onBackgroundImageToggle={onBackgroundImageToggle}
        showFeaturedPosts={showFeaturedPosts}
        onShowFeaturedPostsToggle={onShowFeaturedPostsToggle}
        postFeedStyleValue={postFeedStyleValue}
        postFeedStyleOptions={postFeedStyleOptions}
        onPostFeedStyleChange={onPostFeedStyleChange}
        showImagesInFeed={showImagesInFeed}
        onShowImagesInFeedToggle={onShowImagesInFeedToggle}
        showAuthor={showAuthor}
        onShowAuthorToggle={onShowAuthorToggle}
        showPublishDate={showPublishDate}
        onShowPublishDateToggle={onShowPublishDateToggle}
        showPublicationInfoSidebar={showPublicationInfoSidebar}
        onShowPublicationInfoSidebarToggle={onShowPublicationInfoSidebarToggle}
        showPostMetadata={showPostMetadata}
        onShowPostMetadataToggle={onShowPostMetadataToggle}
        enableDropCapsOnPosts={enableDropCapsOnPosts}
        onEnableDropCapsOnPostsToggle={onEnableDropCapsOnPostsToggle}
        showRelatedArticles={showRelatedArticles}
        onShowRelatedArticlesToggle={onShowRelatedArticlesToggle}
        customCSS={customCSS}
        onCustomCSSChange={onCustomCSSChange}
      />
    )
  } else {
    content = <AIPanel />
  }

  const isCollapsed = leftSidebarCollapsed
  const toggleClassName = isCollapsed
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  return (
    <div
      className={`group relative flex-shrink-0 transition-[width] duration-300 ${isCollapsed ? 'w-0' : 'w-[300px]'}`}
    >
      {isCollapsed && (
        <div
          className="absolute inset-y-0 left-0 w-8 z-10"
          aria-hidden="true"
        />
      )}
      <aside
        className={`relative z-20 h-full w-[300px] bg-surface border-r border-border transition-transform duration-300 ${
          isCollapsed ? '-translate-x-full group-hover:translate-x-0 shadow-md-heavy' : 'translate-x-0'
        }`}
      >
        <SidebarToggle
          position="left"
          collapsed={isCollapsed}
          onToggle={toggleLeftSidebar}
          className={`transition-opacity duration-200 ${toggleClassName}`}
        />
        <div className="h-full flex flex-col py-2">
          {content}
        </div>
        <div
          id="koenig-drag-drop-ghost-container"
          className="pointer-events-none fixed inset-0 z-[10000]"
          aria-hidden="true"
        />
      </aside>
    </div>
  )
}
