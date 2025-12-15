import { useMemo, useCallback } from 'react'
import { PanelHeader, type TagConfig } from '@defalt/ui'
import { SectionDetailRenderer, type SectionDetail } from './SectionDetailRenderer'
import type { SectionsPanelProps } from '../SectionsPanelBase'

export type SectionDetailPanelProps = {
  activeDetail: SectionDetail
  onBack: () => void
  props: SectionsPanelProps
}

export function SectionDetailPanel({ activeDetail, onBack, props }: SectionDetailPanelProps) {
  // Look up tags for the active section from its config
  const { activeTag, activeTags, canEditSingleTag } = useMemo(() => {
    // Check for announcement bar block selection (block-level tag)
    const announcementBar = props.announcementBars.find((bar) => bar.id === activeDetail.id)
    if (announcementBar) {
      // If a block is selected, get the block's tag
      if (activeDetail.blockIndex !== undefined) {
        const block = announcementBar.content.announcements[activeDetail.blockIndex]
        if (block) {
          return { activeTag: block.tag || '#announcement', activeTags: undefined, canEditSingleTag: true }
        }
      }
      // Parent announcement bar doesn't have a tag icon (tags are on blocks)
      return { activeTag: undefined, activeTags: undefined, canEditSingleTag: false }
    }

    const customSection = props.customSections[activeDetail.id]
    if (!customSection?.config) {
      return { activeTag: undefined, activeTags: undefined, canEditSingleTag: false }
    }

    const config = customSection.config as Record<string, unknown>

    // Check for multiple tags (tagLeft, tagRight)
    if (typeof config.tagLeft === 'string' && typeof config.tagRight === 'string') {
      return {
        activeTag: undefined,
        activeTags: { tagLeft: config.tagLeft, tagRight: config.tagRight },
        canEditSingleTag: false
      }
    }

    // Check for single tag
    const tagValue = typeof config.tag === 'string' ? config.tag : ''
    return { activeTag: tagValue, activeTags: undefined, canEditSingleTag: true }
  }, [activeDetail.id, activeDetail.blockIndex, props.announcementBars, props.customSections])

  // Handler to update a single tag in section config
  const handleTagChange = useCallback((newTag: string) => {
    // Announcement bar block tag change
    const announcementBar = props.announcementBars.find((bar) => bar.id === activeDetail.id)
    if (announcementBar && activeDetail.blockIndex !== undefined) {
      // Update the block's tag
      const blockIndex = activeDetail.blockIndex
      props.onAnnouncementContentConfigChange(activeDetail.id, (content) => ({
        ...content,
        announcements: content.announcements.map((block, idx) =>
          idx === blockIndex ? { ...block, tag: newTag } : block
        )
      }))
      return
    }
    // Custom sections use 'tag' field
    const customSection = props.customSections[activeDetail.id]
    if (customSection) {
      props.onUpdateCustomSection(activeDetail.id, (config) => ({
        ...config,
        tag: newTag
      }))
    }
  }, [activeDetail.id, activeDetail.blockIndex, props])

  // Build tags array for multiple tags
  const tagsConfig = useMemo<TagConfig[] | undefined>(() => {
    if (!activeTags) return undefined
    const sectionId = activeDetail.id
    return [
      {
        id: 'tagLeft',
        label: 'Left column',
        value: activeTags.tagLeft,
        onChange: (newTag: string) => {
          props.onUpdateCustomSection(sectionId, (config) => ({
            ...config,
            tagLeft: newTag
          }))
        }
      },
      {
        id: 'tagRight',
        label: 'Right column',
        value: activeTags.tagRight,
        onChange: (newTag: string) => {
          props.onUpdateCustomSection(sectionId, (config) => ({
            ...config,
            tagRight: newTag
          }))
        }
      }
    ]
  }, [activeTags, activeDetail.id, props])

  return (
    <>
      <PanelHeader
        title={activeDetail.label}
        onBack={onBack}
        tag={activeTag}
        onTagChange={canEditSingleTag ? handleTagChange : undefined}
        tags={tagsConfig}
      />
      <div className="flex-1 overflow-y-auto bg-surface">
        <SectionDetailRenderer activeDetail={activeDetail} props={props} />
      </div>
    </>
  )
}
