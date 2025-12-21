import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo
} from 'react'
import * as Separator from '@radix-ui/react-separator'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  GhostIcon,
  PanelTopDashed,
  GripVertical,
  PanelBottomDashed,
  Maximize,
  Sparkles,
  CirclePlus
} from 'lucide-react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { PointerSensor } from '@dnd-kit/react'
import { isElement } from '@dnd-kit/dom/utilities'
import type { SidebarItem } from '@defalt/utils/config/sectionRegistry'
import { type AnnouncementBarConfig, type AnnouncementContentConfig, type AnnouncementBarInstance } from '@defalt/utils/config/themeConfig'
import type { PreviewData } from '@defalt/rendering/custom-source/handlebars/dataResolvers'
import { resolveSectionIcon } from '@defalt/utils/config/sectionIcons'
import { resolveAnnouncementBarLabel } from '@defalt/utils/config/sectionRegistry'
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
  previewData: PreviewData
  dataSource: 'placeholder' | 'ghost'
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
  toggleSectionVisibility: (id: string, forceHidden?: boolean, options?: { silent?: boolean }) => void
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
  announcementBars: AnnouncementBarInstance[]
  onAddAnnouncementBar: () => string | null
  onRemoveAnnouncementBar: (id: string) => void
  onToggleAnnouncementBarHidden: (id: string, forceHidden?: boolean) => void
  onAnnouncementBarConfigChange: (id: string, updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  onAnnouncementContentConfigChange: (id: string, updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => void
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
  const {
    reorderTemplateItems,
    reorderFooterItems,
    aiSections = [],
    onRemoveAiSection,
    onReorderAiSections,
    announcementBars,
    onAddAnnouncementBar
  } = props
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
  const [expandedAnnouncementBars, setExpandedAnnouncementBars] = useState<Record<string, boolean>>({})
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
	    const announcementBarItems: SidebarItem[] = props.announcementBars.map((bar) => ({
	      id: bar.id,
	      label: resolveAnnouncementBarLabel(bar.id),
	      icon: PanelTopDashed
	    }))

	    const baseGroups: SectionGroupDescriptor[] = [
	      {
	        id: 'header',
	        title: 'Header',
	        items: [
	          ...announcementBarItems,
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
	  }, [props.announcementBars, templateItems, aiSectionItems])

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

  const addableDefinitions = useMemo(
    () => templateDefinitions.filter((definition) => !UPCOMING_SECTION_IDS.has(definition.id)),
    [templateDefinitions]
  )

  const announcementBarById = useMemo(() => {
    const map = new Map<string, AnnouncementBarInstance>()
    announcementBars.forEach((bar) => map.set(bar.id, bar))
    return map
  }, [announcementBars])

  const isAnnouncementBarItem = useCallback((id: string) =>
    id === 'announcement-bar' || id.startsWith('announcement-bar-'),
  [])

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

  const handleAddAnnouncementBar = useCallback(() => {
    const id = onAddAnnouncementBar()
    if (!id) {
      return
    }
    setExpandedAnnouncementBars((current) => ({
      ...current,
      [id]: true
    }))
  }, [onAddAnnouncementBar])

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
                      {group.id === 'header' && (
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                            className="group flex w-full items-center gap-1 rounded-md bg-surface px-2 py-2 text-base font-medium text-[#626D79] transition-colors hover:text-foreground hover:bg-subtle cursor-pointer"
                            >
                              <span className="w-4 shrink-0" />
                              <span className="flex h-7 w-7 items-center justify-center">
                                <CirclePlus size={16} strokeWidth={1.5} />
                              </span>
                              <span className="flex-1 truncate text-left">Add section</span>
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              side="right"
                              align="start"
                              sideOffset={6}
                              className="w-64 rounded-md border border-border bg-surface shadow-xl z-[200]"
                            >
	                              <div className="py-2">
	                                <DropdownMenu.Item
	                                  onSelect={handleAddAnnouncementBar}
	                                  className="mx-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 font-md text-foreground hover:bg-subtle focus:bg-subtle focus:outline-none group"
	                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-secondary">
                                    <PanelTopDashed size={16} strokeWidth={1.5} />
                                  </span>
                                  <span className="flex-1 truncate font-normal leading-none text-foreground">Announcement bar</span>
                                </DropdownMenu.Item>
                              </div>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      )}
                      {group.items.length === 0 ? (
                        <div className="rounded-md border border-dashed border-border-strong bg-subtle px-4 py-6 text-center font-sm text-muted">
                          No sections configured yet.
                        </div>
                      ) : (
                        group.items.map((item) => {
                          const isAnnouncementBar = isAnnouncementBarItem(item.id)
                          const announcementBar = isAnnouncementBar ? announcementBarById.get(item.id) : undefined
                          const announcementBarExpanded = isAnnouncementBar ? (expandedAnnouncementBars[item.id] ?? true) : false
                          const hidden = isAnnouncementBar ? Boolean(announcementBar?.hidden) : Boolean(props.sectionVisibility[item.id])

                          const onToggleVisibility = () => {
                            if (isAnnouncementBar) {
                              props.onToggleAnnouncementBarHidden(item.id)
                            } else {
                              props.toggleSectionVisibility(item.id)
                            }
                          }

                          const onRemoveTemplateSection = (() => {
                            if (isAnnouncementBar) {
                              return () => props.onRemoveAnnouncementBar(item.id)
                            }
                            if (group.id === 'template' && item.definitionId) {
                              return () => props.onRemoveTemplateSection(item.id)
                            }
                            if (group.id === 'ai' && onRemoveAiSection) {
                              return () => onRemoveAiSection(item.id)
                            }
                            return undefined
                          })()

                          const onToggleAnnouncementBar = isAnnouncementBar
                            ? () => setExpandedAnnouncementBars((current) => ({
                              ...current,
                              [item.id]: !(current[item.id] ?? true)
                            }))
                            : undefined

                          return (
                            <div key={item.id}>
                              <SectionRow
                                item={item}
                                index={item.originalIndex ?? 0}
                                draggable={Boolean(group.allowReorder) && item.id !== 'footer'}
                                groupType={group.id}
                                hidden={hidden}
                                isParentDragging={isDragging}
                                onToggleVisibility={onToggleVisibility}
                                onOpenDetail={handleOpenDetail}
                                canOpenDetail={() => true}
                                onRemoveTemplateSection={onRemoveTemplateSection}
                                isAnnouncementBar={isAnnouncementBar}
                                announcementBarExpanded={announcementBarExpanded}
                                onToggleAnnouncementBar={onToggleAnnouncementBar}
                                isFooter={item.id === 'footer'}
                                footerExpanded={footerExpanded}
                                onToggleFooter={() => setFooterExpanded(!footerExpanded)}
                                isPremium={isItemPremium(item)}
                                isSelected={activeDetail?.id === item.id && activeDetail?.blockIndex === undefined}
                                onSectionHover={setHoveredSectionId}
                                onScrollToSection={setScrollToSectionId}
                                showVisibilityToggle={item.id !== 'footer'}
                              />
                              {isAnnouncementBar && announcementBarExpanded && announcementBar && (
                                <div className="space-y-0.5 mt-0.5">
                                  <SectionRow
                                    item={{
                                      id: `${item.id}-announcement`,
                                      label: 'Announcement 1',
                                      icon: Maximize
                                    }}
                                    index={0}
                                    draggable={false}
                                    hidden={false}
                                    onToggleVisibility={() => {}}
                                    onOpenDetail={() => handleOpenDetail(item.id, 'Announcement 1', 'announcement', 0)}
                                    canOpenDetail={() => true}
                                    isSubItem={true}
                                    showVisibilityToggle={false}
                                    isSelected={activeDetail?.id === item.id && activeDetail?.blockIndex === 0}
                                    onSectionHover={(id) => setHoveredSectionId(id ? item.id : null)}
                                    onScrollToSection={(id) => {
                                      void id
                                      setScrollToSectionId(item.id)
                                    }}
                                  />
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
                          )
                        })
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
                        <span className="text-base font-medium text-foreground">{item.label}</span>
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
