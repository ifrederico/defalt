import { useMemo, useCallback } from 'react'
import { PanelHeader, type TagConfig } from '@defalt/ui'
import { SectionDetailRenderer, type SectionDetail } from './SectionDetailRenderer'
import type { SectionsPanelProps } from '../SectionsPanelBase'
import { useAnnouncementBars, useCustomSections } from '@defalt/app/stores'
import { isPlainRecord } from '@defalt/utils/helpers/typeGuards'

export type SectionDetailPanelProps = {
  activeDetail: SectionDetail
  onBack: () => void
  props: SectionsPanelProps
}

export function SectionDetailPanel({ activeDetail, onBack, props }: SectionDetailPanelProps) {
  // Access data directly from stores
  const announcementBars = useAnnouncementBars()
  const customSections = useCustomSections()

  // Look up tags for the active section from its config
  const { activeTag, activeTags, canEditSingleTag } = useMemo(() => {
    // Check for announcement bar block selection (block-level tag)
    const announcementBar = announcementBars.find((bar) => bar.id === activeDetail.id)
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

    const customSection = customSections[activeDetail.id]
    if (!customSection?.config) {
      return { activeTag: undefined, activeTags: undefined, canEditSingleTag: false }
    }

    const config = customSection.config as Record<string, unknown>
    const tags = isPlainRecord(config.tags) ? config.tags as Record<string, unknown> : {}

    if (customSection.definitionId === 'ghostGrid') {
      return {
        activeTag: undefined,
        activeTags: {
          left: typeof tags.left === 'string' ? tags.left : '',
          right: typeof tags.right === 'string' ? tags.right : ''
        },
        canEditSingleTag: false
      }
    }

    // Check for single tag
    const tagValue = typeof tags.primary === 'string' ? tags.primary : ''
    return { activeTag: tagValue, activeTags: undefined, canEditSingleTag: true }
  }, [activeDetail.id, activeDetail.blockIndex, announcementBars, customSections])

  // Handler to update a single tag in section config
  const handleTagChange = useCallback((newTag: string) => {
    // Announcement bar block tag change
    const announcementBar = announcementBars.find((bar) => bar.id === activeDetail.id)
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
    // Custom sections use tags.primary
    const customSection = customSections[activeDetail.id]
    if (customSection) {
      props.onUpdateCustomSection(activeDetail.id, (config) => {
        const next = { ...(config as Record<string, unknown>) }
        const tags = isPlainRecord(next.tags) ? { ...(next.tags as Record<string, unknown>) } : {}
        tags.primary = newTag
        next.tags = tags
        return next
      })
    }
  }, [activeDetail.id, activeDetail.blockIndex, announcementBars, customSections, props])

  // Build tags array for multiple tags
  const tagsConfig = useMemo<TagConfig[] | undefined>(() => {
    if (!activeTags) return undefined
    const sectionId = activeDetail.id
    return [
      {
        id: 'left',
        label: 'Left column',
        value: activeTags.left,
        onChange: (newTag: string) => {
          props.onUpdateCustomSection(sectionId, (config) => {
            const next = { ...(config as Record<string, unknown>) }
            const tags = isPlainRecord(next.tags) ? { ...(next.tags as Record<string, unknown>) } : {}
            tags.left = newTag
            next.tags = tags
            return next
          })
        }
      },
      {
        id: 'right',
        label: 'Right column',
        value: activeTags.right,
        onChange: (newTag: string) => {
          props.onUpdateCustomSection(sectionId, (config) => {
            const next = { ...(config as Record<string, unknown>) }
            const tags = isPlainRecord(next.tags) ? { ...(next.tags as Record<string, unknown>) } : {}
            tags.right = newTag
            next.tags = tags
            return next
          })
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
