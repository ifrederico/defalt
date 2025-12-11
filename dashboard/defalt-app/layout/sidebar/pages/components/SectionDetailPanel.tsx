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
  const { activeTag, activeTags } = useMemo(() => {
    const customSection = props.customSections[activeDetail.id]
    if (!customSection?.config) return { activeTag: undefined, activeTags: undefined }

    const config = customSection.config as Record<string, unknown>

    // Check for multiple tags (tagLeft, tagRight)
    if (typeof config.tagLeft === 'string' && typeof config.tagRight === 'string') {
      return { activeTag: undefined, activeTags: { tagLeft: config.tagLeft, tagRight: config.tagRight } }
    }

    // Check for single tag
    if (typeof config.tag === 'string') {
      return { activeTag: config.tag, activeTags: undefined }
    }

    return { activeTag: undefined, activeTags: undefined }
  }, [activeDetail.id, props.customSections])

  // Handler to update a single tag in section config
  const handleTagChange = useCallback((newTag: string) => {
    const customSection = props.customSections[activeDetail.id]
    if (customSection) {
      props.onUpdateCustomSection(activeDetail.id, (config) => ({
        ...config,
        tag: newTag
      }))
    }
  }, [activeDetail.id, props])

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
        onTagChange={activeTag !== undefined ? handleTagChange : undefined}
        tags={tagsConfig}
      />
      <div className="flex-1 overflow-y-auto bg-surface">
        <SectionDetailRenderer activeDetail={activeDetail} props={props} />
      </div>
    </>
  )
}
