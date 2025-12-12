import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo
} from 'react'
import * as Separator from '@radix-ui/react-separator'
import {
  GhostIcon,
  PanelTopDashed,
  GripVertical,
  PanelBottomDashed,
  Maximize,
  Sparkles
  // CirclePlus - hidden for now, re-enable when Add Announcement is needed
} from 'lucide-react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { PointerSensor } from '@dnd-kit/react'
import { isElement } from '@dnd-kit/dom/utilities'
import type { SidebarItem } from '@defalt/utils/config/configStateDefaults'
import { type AnnouncementBarConfig, type AnnouncementContentConfig } from '@defalt/utils/config/themeConfig'
import { resolveSectionIcon } from '@defalt/utils/config/sectionIcons'
import {
  isPremium,
  type SectionDefinition,
  type SectionInstance,
  type SectionConfigSchema
} from '@defalt/sections/engine'
import { PanelHeader } from '@defalt/ui'
import {
  SectionRow,
  AddSectionCard,
  type SectionDetail
} from './components'
import { useHistoryInteractionBlocker } from '@defalt/app/contexts/useHistoryInteractionBlocker'
import { useUIActions } from '@defalt/app/stores'

// IDs of upcoming sections (used to filter from addable definitions)
const UPCOMING_SECTION_IDS = new Set([
  'grid', 'testimonials', 'faq', 'about', 'slideshow', 'metrics', 'map', 'blog-post', 'logo-list'
])

export type SectionsPanelProps = {
  accentColor: string
  postFeedStyleValue: string
  postFeedStyleOptions: string[]
  onPostFeedStyleChange: (value: string) => void
  showImagesInFeed: boolean
  onShowImagesInFeedToggle: (value: boolean) => void
  showAuthor: boolean
  onShowAuthorToggle: (value: boolean) => void
  showPublishDate: boolean
  onShowPublishDateToggle: (value: boolean) => void
  showPublicationInfoSidebar: boolean
  onShowPublicationInfoSidebarToggle: (value: boolean) => void
  sectionVisibility: Record<string, boolean>
  toggleSectionVisibility: (id: string) => void
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
  templateDefinitions: SectionDefinition[]
  onAddTemplateSection: (definitionId: string) => void
  onRemoveTemplateSection: (sectionId: string) => void
  reorderTemplateItems: (startIndex: number, endIndex: number) => void
  reorderFooterItems: (startIndex: number, endIndex: number) => void
  sectionPadding: Record<string, { top: number, bottom: number, left?: number, right?: number }>
  onSectionPaddingChange: (id: string, direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onSectionPaddingCommit: (id: string, direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  sectionMargins: Record<string, { top?: number, bottom?: number }>
  onSectionMarginChange: (id: string, direction: 'top' | 'bottom', value: number) => void
  onSectionMarginCommit: (id: string, direction: 'top' | 'bottom', value: number) => void
  customSections: Record<string, SectionInstance>
  onUpdateCustomSection: (id: string, updater: (config: SectionConfigSchema) => SectionConfigSchema) => void
  navigationLayoutValue: string
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  onNavigationLayoutChange: (value: string) => void
  stickyHeaderValue: string
  stickyHeaderOptions: string[]
  onStickyHeaderChange: (value: string) => void
  isSearchEnabled: boolean
  onSearchToggle: (value: boolean) => void
  typographyCase: 'default' | 'uppercase'
  onTypographyCaseChange: (value: 'default' | 'uppercase') => void
  announcementBarConfig: AnnouncementBarConfig
  onAnnouncementBarConfigChange: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  onAnnouncementBarConfigPreview?: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  onAnnouncementBarConfigCommit?: () => void
  announcementContentConfig: AnnouncementContentConfig
  onAnnouncementContentConfigChange: (updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => void
  headerStyleValue: string
  // AI-generated sections
  aiSections?: Array<{ id: string; name: string; html: string }>
  onRemoveAiSection?: (id: string) => void
  onRenameAiSection?: (id: string, newName: string) => void
  onReorderAiSections?: (startIndex: number, endIndex: number) => void
  // Controlled mode props (optional, for dual-sidebar layout)
  activeDetail?: SectionDetail | null
  onActiveDetailChange?: (detail: SectionDetail | null) => void
}

export type SectionsPanelBaseProps = SectionsPanelProps & {
  panelTitle: string
  allowTemplateAdd?: boolean
}

// Re-export SectionDetail type for consumers
export type { SectionDetail }

type SectionGroupDescriptor = {
  id: 'header' | 'template' | 'ai' | 'footer'
  title: string
  items: SidebarItem[]
  allowReorder?: boolean
  allowAdd?: boolean
}

export const SectionsPanelBase = memo(function SectionsPanelBase({
  panelTitle,
  allowTemplateAdd = true,
  activeDetail: controlledActiveDetail,
  onActiveDetailChange,
  ...props
}: SectionsPanelBaseProps) {
  const { reorderTemplateItems, reorderFooterItems, aiSections = [], onRemoveAiSection, onReorderAiSections } = props
  const { setHoveredSectionId, setScrollToSectionId, setActiveTab } = useUIActions()
  const isControlled = controlledActiveDetail !== undefined
  const templateDefinitions = props.templateDefinitions
  const resolveItemIcon = useCallback((item: SidebarItem) => {
    const identifier = item.definitionId ?? item.id
    return resolveSectionIcon(identifier, item.icon)
  }, [])

  const isItemPremium = useCallback((item: SidebarItem): boolean => {
    // Check section definition ID first (for template sections)
    if (item.definitionId) {
      return isPremium(item.definitionId)
    }
    // Fall back to item ID (for header/footer features like announcement-bar)
    return isPremium(item.id)
  }, [])

  const [internalActiveDetail, setInternalActiveDetail] = useState<SectionDetail | null>(null)
  const activeDetail = isControlled ? controlledActiveDetail : internalActiveDetail
  const setActiveDetail = useCallback((detail: SectionDetail | null) => {
    if (isControlled) {
      onActiveDetailChange?.(detail)
    } else {
      setInternalActiveDetail(detail)
    }
  }, [isControlled, onActiveDetailChange])
  const [isDragging, setIsDragging] = useState(false)
  const [footerExpanded, setFooterExpanded] = useState(true)
  const [announcementBarExpanded, setAnnouncementBarExpanded] = useState(true)
  useHistoryInteractionBlocker('sections-drag', isDragging)

  // Custom sensors with different constraints for mouse vs touch (Puck pattern)
  const [sensors] = useState(() => [
    PointerSensor.configure({
      activationConstraints(event, source) {
        const { pointerType, target } = event
        // Mouse with handle: no delay, just 5px distance
        if (
          pointerType === 'mouse' &&
          isElement(target) &&
          (source.handle === target || source.handle?.contains(target))
        ) {
          return { distance: { value: 5 } }
        }
        // Touch: 200ms delay with 10px tolerance
        if (pointerType === 'touch') {
          return { delay: { value: 200, tolerance: 10 } }
        }
        // Other: delay + distance
        return { delay: { value: 200, tolerance: 10 }, distance: { value: 5 } }
      },
    }),
  ])
  const templateItems = useMemo(() => {
    const allItems = props.templateItems.map((item, originalIndex) => {
      let label = item.label

      // Map subheader label to current header layout
      if (item.id === 'subheader') {
        const labelMap: Record<string, string> = {
          'Landing': 'Landing',
          'Search': 'Search',
          'Magazine': 'Magazine',
          'Highlight': 'Highlight',
          'Off': 'Off',
        }
        label = labelMap[props.headerStyleValue] || item.label
      }

      return {
        ...item,
        label,
        icon: resolveItemIcon(item),
        originalIndex
      }
    })

    // Remove featured entirely for Highlight layout (it's embedded in the header)
    // and for non-Magazine/Highlight layouts
    if (props.headerStyleValue === 'Highlight') {
      return allItems.filter(item => item.id !== 'featured')
    }
    if (props.headerStyleValue !== 'Magazine') {
      return allItems.filter(item => item.id !== 'featured')
    }

    return allItems
  }, [props.templateItems, props.headerStyleValue, resolveItemIcon])

  const footerChildItems = useMemo(() =>
    props.footerItems.map((item, originalIndex) => ({
      ...item,
      icon: resolveItemIcon(item),
      originalIndex
    })),
    [props.footerItems, resolveItemIcon]
  )

  const aiSectionItems = useMemo(() =>
    aiSections.map((section, originalIndex) => ({
      id: section.id,
      label: section.name,
      icon: Sparkles,
      isAiGenerated: true,
      originalIndex
    })),
    [aiSections]
  )

  const groups = useMemo<SectionGroupDescriptor[]>(() => {
    const baseGroups: SectionGroupDescriptor[] = [
      {
        id: 'header',
        title: 'Header',
        items: [
          { id: 'announcement-bar', label: 'Announcement bar', icon: PanelTopDashed },
          { id: 'header', label: 'Header', icon: GhostIcon }
        ],
      },
      {
        id: 'template',
        title: 'Template',
        items: templateItems,
        allowReorder: true,
        allowAdd: true,
      },
    ]

    // Add AI sections group only if there are AI-generated sections
    if (aiSectionItems.length > 0) {
      baseGroups.push({
        id: 'ai',
        title: 'AI Generated',
        items: aiSectionItems,
        allowReorder: true,
      })
    }

    baseGroups.push({
      id: 'footer',
      title: 'Footer',
      items: [
        { id: 'footer', label: 'Footer', icon: PanelBottomDashed }
      ],
    })

    return baseGroups
  }, [templateItems, aiSectionItems])

  // Lookup map for drag overlay
  const itemsById = useMemo(() => {
    const map = new Map<string, SidebarItem>()
    groups.forEach((group) => {
      group.items.forEach((item) => map.set(item.id, item))
    })
    // Add footer child items
    footerChildItems.forEach((item) => map.set(item.id, item))
    return map
  }, [groups, footerChildItems])

  const hasGhostGrid = useMemo(
    () => Object.values(props.customSections).some((section) => section.definitionId === 'ghostGrid'),
    [props.customSections]
  )

  const addableDefinitions = useMemo(
    () => templateDefinitions.filter((definition) =>
      (definition.id !== 'ghostGrid' || !hasGhostGrid) &&
      !UPCOMING_SECTION_IDS.has(definition.id)
    ),
    [templateDefinitions, hasGhostGrid]
  )

  const availableSectionIds = useMemo(() => {
    const ids = new Set<string>()
    groups.forEach((group) => {
      group.items.forEach((item) => ids.add(item.id))
    })
    if (ids.has('footer')) {
      footerChildItems.forEach((item) => ids.add(item.id))
    }
    return ids
  }, [groups, footerChildItems])

  useEffect(() => {
    if (!activeDetail) {
      return
    }
    if (!availableSectionIds.has(activeDetail.id)) {
      setActiveDetail(null)
    }
  }, [activeDetail, availableSectionIds, setActiveDetail])

  const handleOpenDetail = useCallback((id: string, label: string, blockType?: string, blockIndex?: number) => {
    // Skip update if already selected (prevents re-renders that could clear highlight)
    if (activeDetail?.id === id && activeDetail?.blockIndex === blockIndex) {
      return
    }
    setActiveDetail({ id, label, blockType, blockIndex })
  }, [activeDetail, setActiveDetail])

  // @dnd-kit drag end handler
  const handleDragEnd = useCallback((event: { operation: { source?: { id: string | number; data?: { group?: string; originalIndex?: number } } | null; target?: { id: string | number; data?: { originalIndex?: number } } | null } }) => {
    setIsDragging(false)
    const { source, target } = event.operation
    if (!source || !target || source.id === target.id) {
      return
    }

    const groupType = source.data?.group as 'template' | 'footer' | 'ai' | undefined
    if (!groupType) {
      return
    }

    const sourceIndex = source.data?.originalIndex
    const targetIndex = target.data?.originalIndex

    if (sourceIndex === undefined || targetIndex === undefined) {
      return
    }

    if (groupType === 'template') {
      reorderTemplateItems(sourceIndex, targetIndex)
    } else if (groupType === 'ai' && onReorderAiSections) {
      onReorderAiSections(sourceIndex, targetIndex)
    } else if (groupType === 'footer') {
      reorderFooterItems(sourceIndex, targetIndex)
    }
  }, [reorderTemplateItems, reorderFooterItems, onReorderAiSections])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <PanelHeader title={panelTitle} />
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-5">
            <DragDropProvider
              sensors={sensors}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              {groups.map((group, groupIndex) => (
                <section
                  key={group.id}
                  className="mt-5 space-y-2 first:mt-0"
                >
                  <h3 className="font-md font-bold text-foreground">{group.title}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="space-y-0.5">
                      {group.items.length === 0 ? (
                        <div className="rounded-md border border-dashed border-border-strong bg-subtle px-4 py-6 text-center font-sm text-muted">
                          No sections configured yet.
                        </div>
                      ) : (
                        group.items.map((item) => (
                          <div key={item.id}>
                            <SectionRow
                              item={item}
                              index={item.originalIndex ?? 0}
                              draggable={Boolean(group.allowReorder) && item.id !== 'footer'}
                              groupType={group.id}
                              hidden={Boolean(props.sectionVisibility[item.id])}
                              isParentDragging={isDragging}
                              onToggleVisibility={() => props.toggleSectionVisibility(item.id)}
                              onOpenDetail={handleOpenDetail}
                              canOpenDetail={() => true}
                              onRemoveTemplateSection={
                                group.id === 'template' && item.definitionId
                                  ? () => props.onRemoveTemplateSection(item.id)
                                  : group.id === 'ai' && onRemoveAiSection
                                    ? () => onRemoveAiSection(item.id)
                                    : undefined
                              }
                              isAnnouncementBar={item.id === 'announcement-bar'}
                              announcementBarExpanded={announcementBarExpanded}
                              onToggleAnnouncementBar={() => setAnnouncementBarExpanded(!announcementBarExpanded)}
                              isFooter={item.id === 'footer'}
                              footerExpanded={footerExpanded}
                              onToggleFooter={() => setFooterExpanded(!footerExpanded)}
                              isPremium={isItemPremium(item)}
                              isSelected={activeDetail?.id === item.id && activeDetail?.blockIndex === undefined}
                              onSectionHover={setHoveredSectionId}
                              onScrollToSection={setScrollToSectionId}
                              showVisibilityToggle={item.id !== 'footer'}
                            />
                          {item.id === 'announcement-bar' && announcementBarExpanded && (
                            <div className="space-y-0.5 mt-0.5">
                              {props.announcementContentConfig.announcements.map((_, idx) => (
                                <SectionRow
                                  key={`announcement-${idx}`}
                                  item={{
                                    id: `announcement-block-${idx}`,
                                    label: `Announcement ${idx + 1}`,
                                    icon: Maximize
                                  }}
                                  index={idx}
                                  draggable={false}
                                  hidden={false}
                                  onToggleVisibility={() => {}}
                                  onOpenDetail={() => handleOpenDetail('announcement-bar', `Announcement ${idx + 1}`, 'announcement', idx)}
                                  canOpenDetail={() => true}
                                  isSubItem={true}
                                  showVisibilityToggle={false}
                                  isSelected={activeDetail?.id === 'announcement-bar' && activeDetail?.blockIndex === idx}
                                  onSectionHover={setHoveredSectionId}
                                  onScrollToSection={setScrollToSectionId}
                                  onRemoveTemplateSection={props.announcementContentConfig.announcements.length > 1 ? () => {
                                    const newAnnouncements = props.announcementContentConfig.announcements.filter((_, i) => i !== idx)
                                    props.onAnnouncementContentConfigChange(() => ({
                                      ...props.announcementContentConfig,
                                      announcements: newAnnouncements
                                    }))
                                  } : undefined}
                                />
                              ))}
                              {/* Add Announcement button - hidden for now, can be re-enabled later
                              <button
                                type="button"
                                onClick={() => {
                                  const newAnnouncements = [...props.announcementContentConfig.announcements, {
                                    text: '',
                                    link: '',
                                    typographySize: 'normal' as const,
                                    typographyWeight: 'default' as const,
                                    typographySpacing: 'regular' as const,
                                    typographyCase: 'default' as const
                                  }]
                                  props.onAnnouncementContentConfigChange(() => ({
                                    ...props.announcementContentConfig,
                                    announcements: newAnnouncements
                                  }))
                                }}
                                className="flex w-full items-center rounded-md bg-surface px-2 py-2 font-md font-normal text-foreground transition-colors hover:bg-subtle"
                              >
                                <div className="flex flex-1 items-center gap-1 ml-6">
                                  <span className="w-4 shrink-0" />
                                  <span className="flex h-7 w-7 items-center justify-center text-secondary">
                                    <CirclePlus size={16} strokeWidth={1.5} />
                                  </span>
                                  <span className="flex-1 truncate text-left">Add announcement</span>
                                </div>
                              </button>
                              */}
                            </div>
                          )}
                          {item.id === 'footer' && footerExpanded && (
                            <div className="space-y-0.5 mt-0.5">
                              {footerChildItems.map((footerItem) => (
                                <SectionRow
                                  key={footerItem.id}
                                  item={footerItem}
                                  index={footerItem.originalIndex ?? 0}
                                  draggable={true}
                                  groupType="footer"
                                  isParentDragging={isDragging}
                                  hidden={Boolean(props.sectionVisibility[footerItem.id])}
                                  onToggleVisibility={() => props.toggleSectionVisibility(footerItem.id)}
                                  onOpenDetail={handleOpenDetail}
                                  canOpenDetail={() => true}
                                  isSubItem={true}
                                  isSelected={activeDetail?.id === footerItem.id}
                                  onSectionHover={setHoveredSectionId}
                                  onScrollToSection={setScrollToSectionId}
                                />
                              ))}
                            </div>
                          )}
                          </div>
                        ))
                      )}
                    </div>

	                    {group.allowAdd && (
	                      <AddSectionCard
	                        definitions={addableDefinitions}
	                        onGenerateBlock={() => setActiveTab('ai')}
	                        onSelect={props.onAddTemplateSection}
	                        disabled={!allowTemplateAdd}
	                      />
	                    )}
                  </div>
                  {groupIndex < groups.length - 1 && (
                    <div className="mt-3">
                      <Separator.Root className="block h-px w-full bg-hover" decorative />
                    </div>
                  )}
                </section>
              ))}
              <DragOverlay>
                {(source) => {
                  if (!source) return null
                  const item = itemsById.get(String(source.id))
                  if (!item) return null
                  const isSubItem = (source.data as { group?: string } | undefined)?.group === 'footer'
                  return (
                    <div className="flex items-center justify-between rounded-md px-2 py-2 bg-subtle/80">
                      <div className={`flex flex-1 items-center gap-1 min-w-0 ${isSubItem ? 'ml-6' : ''}`}>
                        <span className="w-4 shrink-0" />
                        <div className="relative flex h-7 w-7 items-center justify-center">
                          <span className="absolute inset-0 flex h-7 w-7 items-center justify-center rounded-md text-secondary bg-hover">
                            <GripVertical size={16} strokeWidth={1.5} />
                          </span>
                        </div>
                        <span className="font-md text-foreground">{item.label}</span>
                      </div>
                    </div>
                  )
                }}
              </DragOverlay>
            </DragDropProvider>
      </div>
    </div>
  )
})
