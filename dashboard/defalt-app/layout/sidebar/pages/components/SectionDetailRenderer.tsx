import { useMemo, useState, useCallback, type ReactNode } from 'react'
import type { SectionsPanelProps } from '../SectionsPanelBase'
import type { SectionConfigSchema, GhostCardsSectionConfig, GhostGridSectionConfig, ImageWithTextSectionConfig } from '@defalt/sections/definitions/definitions'
import { SECTION_ID_MAP, PADDING_BLOCK_SECTIONS, CSS_DEFAULT_MARGIN } from '@defalt/utils/config/themeConfig'
import { HeaderSectionSettings } from './HeaderSectionSettings'
import { SectionPaddingSettings, type SectionSpacingMode } from './SectionPaddingSettings'
import { AnnouncementBarSettings } from '@defalt/sections/header/settings/AnnouncementBarSettings'
import { AnnouncementSettings } from '@defalt/sections/header/settings/AnnouncementSettings'
import ImageWithTextSectionSettings from '@defalt/sections/homepage/settings/ImageWithTextSectionSettings'
import GhostCardsSectionSettings from '@defalt/sections/homepage/settings/GhostCardsSectionSettings'
import GhostGridSectionSettings from '@defalt/sections/homepage/settings/GhostGridSectionSettings'
import { MainAppearanceSettings } from './MainAppearanceSettings'
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

  return useMemo<ReactNode>(() => {
    if (!activeDetail) {
      return null
    }
    // AI-generated section
    if (activeAiSection) {
      const padding = props.sectionPadding[activeDetail.id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      return (
        <AiSectionSettings
          sectionId={activeDetail.id}
          name={activeAiSection.name}
          html={activeAiSection.html}
          padding={padding}
          onPaddingChange={(direction, value) => props.onSectionPaddingChange(activeDetail.id, direction, value)}
          onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(activeDetail.id, direction, value)}
          onRename={props.onRenameAiSection}
        />
      )
    }
    if (activeDetail.id === 'header') {
      return (
        <HeaderSectionSettings
          navigationLayoutValue={props.navigationLayoutValue}
          navigationLayoutOptions={props.navigationLayoutOptions}
          navigationLayoutError={props.navigationLayoutError}
          onNavigationLayoutChange={props.onNavigationLayoutChange}
          stickyHeaderValue={props.stickyHeaderValue}
          stickyHeaderOptions={props.stickyHeaderOptions}
          onStickyHeaderChange={props.onStickyHeaderChange}
          isSearchEnabled={props.isSearchEnabled}
          onSearchToggle={props.onSearchToggle}
          typographyCase={props.typographyCase}
          onTypographyCaseChange={props.onTypographyCaseChange}
        />
      )
    }
    if (activeDetail.id === 'announcement-bar') {
      return (
        <AnnouncementBarSettings
          accentColor={props.accentColor}
          config={props.announcementBarConfig}
          onChange={props.onAnnouncementBarConfigChange}
          onPreview={props.onAnnouncementBarConfigPreview}
          onCommit={props.onAnnouncementBarConfigCommit}
        />
      )
    }
    if (activeDetail.id === 'announcement') {
      return (
        <AnnouncementSettings
          config={props.announcementContentConfig}
          onChange={props.onAnnouncementContentConfigChange}
        />
      )
    }
    if (activeDetail.id === 'main') {
      const padding = props.sectionPadding[activeDetail.id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const margin = props.sectionMargins[activeDetail.id]
      return (
        <MainAppearanceSettings
          padding={padding}
          margin={margin}
          postFeedStyleValue={props.postFeedStyleValue}
          postFeedStyleOptions={props.postFeedStyleOptions}
          onPostFeedStyleChange={props.onPostFeedStyleChange}
          showImagesInFeed={props.showImagesInFeed}
          onShowImagesInFeedToggle={props.onShowImagesInFeedToggle}
          showAuthor={props.showAuthor}
          onShowAuthorToggle={props.onShowAuthorToggle}
          showPublishDate={props.showPublishDate}
          onShowPublishDateToggle={props.onShowPublishDateToggle}
          showPublicationInfoSidebar={props.showPublicationInfoSidebar}
          onShowPublicationInfoSidebarToggle={props.onShowPublicationInfoSidebarToggle}
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
    if (activeCustomSection) {
      const sectionId = activeDetail.id
      if (activeCustomSection.definitionId === 'ghostCards') {
        const config = activeCustomSection.config as GhostCardsSectionConfig
        const padding = props.sectionPadding[sectionId] ?? { top: 0, bottom: 0, left: 0, right: 0 }
        return (
          <GhostCardsSectionSettings
            sectionId={sectionId}
            config={config}
            padding={padding}
            onPaddingChange={(direction, value) => props.onSectionPaddingChange(sectionId, direction, value)}
            onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(sectionId, direction, value)}
            onUpdateConfig={(updater) =>
              props.onUpdateCustomSection(
                sectionId,
                (current) => updater(current as GhostCardsSectionConfig) as SectionConfigSchema
              )
            }
          />
        )
      }
      if (activeCustomSection.definitionId === 'ghostGrid') {
        const config = activeCustomSection.config as GhostGridSectionConfig
        const padding = props.sectionPadding[sectionId] ?? { top: 0, bottom: 0, left: 0, right: 0 }
        return (
          <GhostGridSectionSettings
            sectionId={sectionId}
            config={config}
            padding={padding}
            onPaddingChange={(direction, value) => props.onSectionPaddingChange(sectionId, direction, value)}
            onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(sectionId, direction, value)}
            onUpdateConfig={(updater) =>
              props.onUpdateCustomSection(
                sectionId,
                (current) => updater(current as GhostGridSectionConfig) as SectionConfigSchema
              )
            }
          />
        )
      }
      if (activeCustomSection.definitionId === 'image-with-text') {
        const config = activeCustomSection.config as ImageWithTextSectionConfig
        const padding = props.sectionPadding[sectionId] ?? { top: 0, bottom: 0, left: 0, right: 0 }
        return (
          <ImageWithTextSectionSettings
            sectionId={sectionId}
            config={config}
            padding={padding}
            onPaddingChange={(direction, value) => props.onSectionPaddingChange(sectionId, direction, value)}
            onPaddingCommit={(direction, value) => props.onSectionPaddingCommit(sectionId, direction, value)}
            onUpdateConfig={(updater) =>
              props.onUpdateCustomSection(
                sectionId,
                (current) => updater(current as ImageWithTextSectionConfig) as SectionConfigSchema
              )
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
  }, [activeDetail, activeCustomSection, activeAiSection, props])
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
  padding: { top: number; bottom: number; left?: number; right?: number }
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onRename?: (id: string, newName: string) => void
}

function AiSectionSettings({
  sectionId,
  name,
  html,
  padding,
  onPaddingChange,
  onPaddingCommit,
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

        {/* Padding controls */}
        <SectionPaddingSettings
          sectionId={sectionId}
          padding={padding}
          mode="padding-block"
          onChange={onPaddingChange}
          onCommit={onPaddingCommit}
        />

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
