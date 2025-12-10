import { useMemo, useState, useCallback, type ReactNode } from 'react'
import type { SectionsPanelProps } from '../SectionsPanelBase'
import type { SectionConfigSchema, AnnouncementBarSectionConfig, AnnouncementSectionConfig, HeaderSectionConfig, SourceThemeConfig } from '@defalt/sections/engine'
import { getSectionDefinition } from '@defalt/sections/engine'
import { SECTION_ID_MAP, PADDING_BLOCK_SECTIONS, CSS_DEFAULT_MARGIN } from '@defalt/utils/config/themeConfig'
import { SchemaSectionSettings } from '../../components/SchemaSectionSettings'
import { SchemaThemeSettings } from '../../components/SchemaThemeSettings'
import { SectionPaddingSettings, type SectionSpacingMode } from './SectionPaddingSettings'
import { Copy, Check, Pencil, X, Check as CheckIcon } from 'lucide-react'

export type SectionDetail = {
  id: string
  label: string
}

const SUBHEADER_MARGIN_DEFAULT = 40

export type SectionDetailRendererProps = {
  activeDetail: SectionDetail | null
  props: SectionsPanelProps
}

export function SectionDetailRenderer({ activeDetail, props }: SectionDetailRendererProps): ReactNode {
  const activeCustomSection = activeDetail ? props.customSections[activeDetail.id] : undefined
  const activeAiSection = activeDetail
    ? props.aiSections?.find((s) => s.id === activeDetail.id)
    : undefined

  // Build unified header config from individual props
  const headerConfig = useMemo<HeaderSectionConfig>(() => ({
    navigationLayout: props.navigationLayoutValue as HeaderSectionConfig['navigationLayout'],
    stickyHeader: props.stickyHeaderValue as HeaderSectionConfig['stickyHeader'],
    searchEnabled: props.isSearchEnabled,
    typographyCase: props.typographyCase
  }), [props.navigationLayoutValue, props.stickyHeaderValue, props.isSearchEnabled, props.typographyCase])

  // Build announcement bar config from props (bar appearance only, content handled separately)
  const announcementBarConfig = useMemo<AnnouncementBarSectionConfig>(() => ({
    width: props.announcementBarConfig.width,
    backgroundColor: props.announcementBarConfig.backgroundColor,
    textColor: props.announcementBarConfig.textColor,
    dividerThickness: props.announcementBarConfig.dividerThickness,
    dividerColor: props.announcementBarConfig.dividerColor,
    paddingTop: props.announcementBarConfig.paddingTop,
    paddingBottom: props.announcementBarConfig.paddingBottom
  }), [props.announcementBarConfig])

  // Handler to update header config - dispatches to individual callbacks
  const handleHeaderConfigUpdate = useCallback((updater: (config: SectionConfigSchema) => SectionConfigSchema) => {
    const newConfig = updater(headerConfig as SectionConfigSchema) as HeaderSectionConfig

    // Dispatch changes to individual callbacks
    if (newConfig.navigationLayout !== headerConfig.navigationLayout) {
      props.onNavigationLayoutChange(newConfig.navigationLayout)
    }
    if (newConfig.stickyHeader !== headerConfig.stickyHeader) {
      props.onStickyHeaderChange(newConfig.stickyHeader)
    }
    if (newConfig.searchEnabled !== headerConfig.searchEnabled) {
      props.onSearchToggle(newConfig.searchEnabled)
    }
    if (newConfig.typographyCase !== headerConfig.typographyCase) {
      props.onTypographyCaseChange(newConfig.typographyCase)
    }
  }, [headerConfig, props])

  // Handler to update announcement bar config (bar appearance only)
  const handleAnnouncementBarConfigUpdate = useCallback((updater: (config: SectionConfigSchema) => SectionConfigSchema) => {
    const newConfig = updater(announcementBarConfig as SectionConfigSchema) as AnnouncementBarSectionConfig

    const hasChanged =
      newConfig.width !== announcementBarConfig.width ||
      newConfig.backgroundColor !== announcementBarConfig.backgroundColor ||
      newConfig.textColor !== announcementBarConfig.textColor ||
      newConfig.dividerThickness !== announcementBarConfig.dividerThickness ||
      newConfig.dividerColor !== announcementBarConfig.dividerColor ||
      newConfig.paddingTop !== announcementBarConfig.paddingTop ||
      newConfig.paddingBottom !== announcementBarConfig.paddingBottom

    if (hasChanged) {
      props.onAnnouncementBarConfigChange(() => ({
        width: newConfig.width,
        backgroundColor: newConfig.backgroundColor,
        textColor: newConfig.textColor,
        dividerThickness: newConfig.dividerThickness,
        dividerColor: newConfig.dividerColor,
        paddingTop: newConfig.paddingTop,
        paddingBottom: newConfig.paddingBottom
      }))
    }
  }, [announcementBarConfig, props])

  // Build announcement content config from props
  const announcementConfig = useMemo<AnnouncementSectionConfig>(() => ({
    text: props.announcementContentConfig.previewText,
    size: props.announcementContentConfig.typographySize,
    weight: props.announcementContentConfig.typographyWeight,
    spacing: props.announcementContentConfig.typographySpacing,
    case: props.announcementContentConfig.typographyCase
  }), [props.announcementContentConfig.previewText, props.announcementContentConfig.typographySize, props.announcementContentConfig.typographyWeight, props.announcementContentConfig.typographySpacing, props.announcementContentConfig.typographyCase])

  // Handler to update announcement content config
  const handleAnnouncementConfigUpdate = useCallback((updater: (config: SectionConfigSchema) => SectionConfigSchema) => {
    const newConfig = updater(announcementConfig as SectionConfigSchema) as AnnouncementSectionConfig

    const hasChanged =
      newConfig.text !== announcementConfig.text ||
      newConfig.size !== announcementConfig.size ||
      newConfig.weight !== announcementConfig.weight ||
      newConfig.spacing !== announcementConfig.spacing ||
      newConfig.case !== announcementConfig.case

    if (hasChanged) {
      props.onAnnouncementContentConfigChange((prev) => ({
        ...prev,
        previewText: newConfig.text,
        typographySize: newConfig.size,
        typographyWeight: newConfig.weight,
        typographySpacing: newConfig.spacing,
        typographyCase: newConfig.case
      }))
    }
  }, [announcementConfig, props])

  // Build unified theme config from individual props (for main appearance settings)
  const mainThemeConfig = useMemo<SourceThemeConfig>(() => ({
    postFeedStyle: props.postFeedStyleValue as SourceThemeConfig['postFeedStyle'],
    showImagesInFeed: props.showImagesInFeed,
    showAuthor: props.showAuthor,
    showPublishDate: props.showPublishDate,
    showPublicationInfoSidebar: props.showPublicationInfoSidebar,
    // Post settings (not editable in main appearance, but part of schema)
    showPostMetadata: true,
    enableDropCapsOnPosts: false,
    showRelatedArticles: true,
    // Padding is handled separately
    padding: { top: 0, bottom: 0 }
  }), [props.postFeedStyleValue, props.showImagesInFeed, props.showAuthor, props.showPublishDate, props.showPublicationInfoSidebar])

  // Handler to update theme config - dispatches to individual callbacks
  const handleMainThemeConfigUpdate = useCallback((updater: (config: SourceThemeConfig) => SourceThemeConfig) => {
    const newConfig = updater(mainThemeConfig)

    // Dispatch changes to individual callbacks
    if (newConfig.postFeedStyle !== mainThemeConfig.postFeedStyle) {
      props.onPostFeedStyleChange(newConfig.postFeedStyle)
    }
    if (newConfig.showImagesInFeed !== mainThemeConfig.showImagesInFeed) {
      props.onShowImagesInFeedToggle(newConfig.showImagesInFeed)
    }
    if (newConfig.showAuthor !== mainThemeConfig.showAuthor) {
      props.onShowAuthorToggle(newConfig.showAuthor)
    }
    if (newConfig.showPublishDate !== mainThemeConfig.showPublishDate) {
      props.onShowPublishDateToggle(newConfig.showPublishDate)
    }
    if (newConfig.showPublicationInfoSidebar !== mainThemeConfig.showPublicationInfoSidebar) {
      props.onShowPublicationInfoSidebarToggle(newConfig.showPublicationInfoSidebar)
    }
  }, [mainThemeConfig, props])

  return useMemo<ReactNode>(() => {
    if (!activeDetail) {
      return null
    }
    // AI-generated section
    if (activeAiSection) {
      return (
        <AiSectionSettings
          sectionId={activeDetail.id}
          name={activeAiSection.name}
          html={activeAiSection.html}
          onRename={props.onRenameAiSection}
        />
      )
    }
    // Header section - use schema engine
    if (activeDetail.id === 'header') {
      const definition = getSectionDefinition('header')
      if (definition?.settingsSchema && definition.settingsSchema.length > 0) {
        return (
          <SchemaSectionSettings
            definitionId="header"
            config={headerConfig as SectionConfigSchema}
            padding={{ top: 0, bottom: 0 }}
            onUpdateConfig={handleHeaderConfigUpdate}
          />
        )
      }
    }
    // Announcement bar section - container appearance settings
    if (activeDetail.id === 'announcement-bar') {
      const definition = getSectionDefinition('announcement-bar')
      if (definition?.settingsSchema && definition.settingsSchema.length > 0) {
        return (
          <SchemaSectionSettings
            definitionId="announcement-bar"
            config={announcementBarConfig as SectionConfigSchema}
            padding={{ top: announcementBarConfig.paddingTop, bottom: announcementBarConfig.paddingBottom }}
            onUpdateConfig={handleAnnouncementBarConfigUpdate}
          />
        )
      }
    }
    // Announcement section - text content
    if (activeDetail.id === 'announcement') {
      const definition = getSectionDefinition('announcement')
      if (definition?.settingsSchema && definition.settingsSchema.length > 0) {
        return (
          <SchemaSectionSettings
            definitionId="announcement"
            config={announcementConfig as SectionConfigSchema}
            padding={{ top: 0, bottom: 0 }}
            onUpdateConfig={handleAnnouncementConfigUpdate}
          />
        )
      }
    }
    // Main appearance settings - use schema-driven theme settings
    if (activeDetail.id === 'main') {
      const padding = props.sectionPadding[activeDetail.id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const margin = props.sectionMargins[activeDetail.id]
      return (
        <SchemaThemeSettings
          config={mainThemeConfig}
          padding={padding}
          margin={margin}
          onUpdateConfig={handleMainThemeConfigUpdate}
          onPaddingChange={(direction, value) => props.onSectionPaddingChange(activeDetail.id, direction, value)}
          onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(activeDetail.id, direction, value)}
        />
      )
    }
    if (activeDetail.id === 'footer') {
      const padding = props.sectionPadding[activeDetail.id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const margin = props.sectionMargins[activeDetail.id]
      const footerDefaultMargin = CSS_DEFAULT_MARGIN.footer
      return (
        <SettingsPanel>
          <SectionPaddingSettings
            sectionId={activeDetail.id}
            padding={padding}
            margin={margin}
            defaultMargin={footerDefaultMargin}
            mode="margin"
            onChange={(direction, value) => props.onSectionPaddingChange(activeDetail.id, direction, value)}
            onCommit={(direction, value) => props.onSectionPaddingCommit(activeDetail.id, direction, value)}
            onMarginChange={(direction, value) => props.onSectionMarginChange(activeDetail.id, direction, value)}
            onMarginCommit={(direction, value) => props.onSectionMarginCommit(activeDetail.id, direction, value)}
          />
        </SettingsPanel>
      )
    }
    // Custom sections: use schema-driven settings for all sections with a settingsSchema
    if (activeCustomSection) {
      const sectionId = activeDetail.id
      const definition = getSectionDefinition(activeCustomSection.definitionId)
      if (definition?.settingsSchema && definition.settingsSchema.length > 0) {
        const config = activeCustomSection.config as SectionConfigSchema
        const padding = props.sectionPadding[sectionId] ?? { top: 0, bottom: 0, left: 0, right: 0 }
        return (
          <SchemaSectionSettings
            definitionId={activeCustomSection.definitionId}
            config={config}
            padding={padding}
            onPaddingChange={(direction, value) => props.onSectionPaddingChange(sectionId, direction, value)}
            onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(sectionId, direction, value)}
            onUpdateConfig={(updater) =>
              props.onUpdateCustomSection(sectionId, updater)
            }
          />
        )
      }
      return <GenericCustomSectionNotice label={activeDetail.label} />
    }
    const configKey = SECTION_ID_MAP[activeDetail.id] || activeDetail.id
    const isSubheader = configKey === 'subheader'
    const headerStyle = props.headerStyleValue
    const isMarginHeaderStyle = isSubheader && (headerStyle === 'Highlight' || headerStyle === 'Magazine')
    const isPaddingBlockSection = PADDING_BLOCK_SECTIONS.has(configKey)
    const isPaddingBlockHeaderStyle = isSubheader && (headerStyle === 'Landing' || headerStyle === 'Search')
    const defaultMargin = isMarginHeaderStyle
      ? { top: SUBHEADER_MARGIN_DEFAULT, bottom: 0 }
      : CSS_DEFAULT_MARGIN[configKey]
    const supportsMargin = isMarginHeaderStyle || Boolean(defaultMargin) || Boolean(props.sectionMargins[activeDetail.id])
    const shouldRenderSpacingControls = isMarginHeaderStyle || isPaddingBlockSection || props.sectionPadding[activeDetail.id] || supportsMargin
    if (shouldRenderSpacingControls) {
      const padding = props.sectionPadding[activeDetail.id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const margin = props.sectionMargins[activeDetail.id]
      const spacingMode: SectionSpacingMode = isMarginHeaderStyle
        ? 'margin'
        : (isPaddingBlockHeaderStyle || isPaddingBlockSection)
          ? 'padding-block'
          : 'auto'
      return (
        <SettingsPanel>
          <SectionPaddingSettings
            sectionId={activeDetail.id}
            padding={padding}
            margin={margin}
            defaultMargin={defaultMargin}
            mode={spacingMode}
            onChange={(direction, value) => props.onSectionPaddingChange(activeDetail.id, direction, value)}
            onCommit={(direction, value) => props.onSectionPaddingCommit(activeDetail.id, direction, value)}
            onMarginChange={
              supportsMargin
                ? (direction, value) => props.onSectionMarginChange(activeDetail.id, direction, value)
                : undefined
            }
            onMarginCommit={
              supportsMargin
                ? (direction, value) => props.onSectionMarginCommit(activeDetail.id, direction, value)
                : undefined
            }
          />
        </SettingsPanel>
      )
    }
    return <GenericCustomSectionNotice label={activeDetail.label} />
  }, [activeDetail, activeCustomSection, activeAiSection, props, headerConfig, announcementBarConfig, announcementConfig, handleHeaderConfigUpdate, handleAnnouncementBarConfigUpdate, handleAnnouncementConfigUpdate, mainThemeConfig, handleMainThemeConfigUpdate])
}

function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4 space-y-6">
        {children}
      </div>
    </div>
  )
}

function GenericCustomSectionNotice({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-6 font-md text-secondary">
        <p className="mb-1 font-md font-bold text-foreground">{label}</p>
        <p className="font-md">Editing for this section is coming soon.</p>
      </div>
    </div>
  )
}

type AiSectionSettingsProps = {
  sectionId: string
  name: string
  html: string
  onRename?: (id: string, newName: string) => void
}

function AiSectionSettings({
  sectionId,
  name,
  html,
  onRename,
}: AiSectionSettingsProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = html
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [html])

  const handleStartEdit = useCallback(() => {
    setEditName(name)
    setIsEditing(true)
  }, [name])

  const handleCancelEdit = useCallback(() => {
    setEditName(name)
    setIsEditing(false)
  }, [name])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== name && onRename) {
      onRename(sectionId, trimmed)
    }
    setIsEditing(false)
  }, [editName, name, onRename, sectionId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }, [handleSaveEdit, handleCancelEdit])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4 space-y-6">
        {/* Name with rename */}
        {onRename && (
          <div className="space-y-2">
            <label className="block font-md font-bold text-foreground">Name</label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 font-md text-foreground focus:border-accent focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="p-1.5 rounded-md text-success hover:bg-hover"
                  title="Save"
                >
                  <CheckIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-md text-secondary hover:bg-hover"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-md text-foreground">{name}</span>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-1.5 rounded-md text-secondary hover:bg-hover hover:text-foreground"
                  title="Rename"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Code viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-md font-bold text-foreground">Generated Code</label>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 font-sm text-secondary hover:bg-hover hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="relative rounded-md border border-border bg-subtle overflow-hidden">
            <pre className="p-3 overflow-x-auto text-xs font-mono text-foreground max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
