import { useMemo, type ReactNode } from 'react'
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

  return useMemo<ReactNode>(() => {
    if (!activeDetail) {
      return null
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
      )
    }
    return <GenericCustomSectionNotice label={activeDetail.label} />
  }, [activeDetail, activeCustomSection, props])
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
