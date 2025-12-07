import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  memo
} from 'react'
import * as Separator from '@radix-ui/react-separator'
import type { LucideIcon } from 'lucide-react'
import {
  Ghost as GhostIcon,
  GalleryVertical,
  PanelTopDashed,
  Maximize,
  Grid3x3,
  MessageSquareQuote,
  MessageCircleQuestionMark,
  SquareUserRound,
  LayoutList,
  GripVertical,
  PanelBottomDashed
} from 'lucide-react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { PointerSensor } from '@dnd-kit/react'
import { isElement } from '@dnd-kit/dom/utilities'
import type { SidebarItem } from '@defalt/utils/hooks/configStateDefaults'
import { type AnnouncementBarConfig, type AnnouncementContentConfig } from '@defalt/utils/config/themeConfig'
import type {
  SectionDefinition,
  SectionInstance,
  SectionConfigSchema
} from '@defalt/sections/definitions/definitions'
import { isPremium } from '@defalt/sections/definitions/definitions'
import { PanelHeader } from '@defalt/ui'
import {
  SectionRow,
  AddSectionCard,
  SectionDetailRenderer,
  type SectionDetail
} from './components'
import { useHistoryInteractionBlocker } from '@defalt/app/contexts/useHistoryInteractionBlocker'
import { useUIActions } from '@defalt/app/stores'
import { Sparkles } from 'lucide-react'

const GHOST_SECTION_IDS = new Set(['subheader', 'featured', 'footerbar', 'footer-signup', 'footersignup', 'main'])

// IDs of upcoming sections (used to filter from addable definitions)
const UPCOMING_SECTION_IDS = new Set([
  'grid', 'testimonials', 'faq', 'about', 'slideshow', 'metrics', 'map', 'blog-post', 'logo-list'
])

const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  'hero': GalleryVertical,
  'grid': Grid3x3,
  'testimonials': MessageSquareQuote,
  'faq': MessageCircleQuestionMark,
  'about': SquareUserRound,
  'image-with-text': LayoutList,
  'ghostCards': GhostIcon,
  'ghostGrid': GhostIcon,
}

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
  // Controlled mode props (optional, for dual-sidebar layout)
  activeDetail?: SectionDetail | null
  onActiveDetailChange?: (detail: SectionDetail | null) => void
  renderDetailInline?: boolean
}

export type SectionsPanelBaseProps = SectionsPanelProps & {
  panelTitle: string
  allowTemplateAdd?: boolean
}

// Re-export SectionDetail type for consumers
export type { SectionDetail }

type SectionGroupDescriptor = {
  id: 'header' | 'template' | 'footer'
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
  renderDetailInline = true,
  ...props
}: SectionsPanelBaseProps) {
  const { reorderTemplateItems, reorderFooterItems } = props
  const { setHoveredSectionId, setScrollToSectionId, setActiveTab } = useUIActions()
  const isControlled = controlledActiveDetail !== undefined
  const templateDefinitions = useMemo(
    () => props.templateDefinitions.filter((definition) => definition.id !== 'hero'),
    [props.templateDefinitions]
  ) // Hero removed for now; keep definition list for later reintroduction.
  const resolveGhostSectionIcon = useCallback((item: SidebarItem) => {
    const identifier = item.definitionId ?? item.id
    if (!identifier) {
      return item.icon
    }
    const normalized = identifier.toLowerCase()
    if (GHOST_SECTION_IDS.has(normalized)) {
      return GhostIcon
    }
    // Check SECTION_ICON_MAP for custom sections
    if (SECTION_ICON_MAP[identifier]) {
      return SECTION_ICON_MAP[identifier]
    }
    return item.icon
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
  const [announcementBarExpanded, setAnnouncementBarExpanded] = useState(true)
  const [footerExpanded, setFooterExpanded] = useState(true)
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
        icon: resolveGhostSectionIcon(item) ?? item.icon ?? GhostIcon,
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
  }, [props.templateItems, props.headerStyleValue, resolveGhostSectionIcon])

  const footerChildItems = useMemo(() =>
    props.footerItems.map((item, originalIndex) => ({
      ...item,
      icon: resolveGhostSectionIcon(item) ?? item.icon ?? GhostIcon,
      originalIndex
    })),
    [props.footerItems, resolveGhostSectionIcon]
  )

  const groups = useMemo<SectionGroupDescriptor[]>(() => ([
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
    {
      id: 'footer',
      title: 'Footer',
      items: [
        { id: 'footer', label: 'Footer', icon: PanelBottomDashed }
      ],
    },
  ]), [templateItems])

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
    if (ids.has('announcement-bar')) {
      ids.add('announcement')
    }
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

  const handleOpenDetail = useCallback((id: string, label: string) => {
    // Skip update if already selected (prevents re-renders that could clear highlight)
    if (activeDetail?.id === id) {
      return
    }
    setActiveDetail({ id, label })
  }, [activeDetail, setActiveDetail])

  const handleCloseDetail = useCallback(() => setActiveDetail(null), [setActiveDetail])

  // @dnd-kit drag end handler
  const handleDragEnd = useCallback((event: { operation: { source?: { id: string | number; data?: { group?: string; originalIndex?: number } } | null; target?: { id: string | number; data?: { originalIndex?: number } } | null } }) => {
    setIsDragging(false)
    const { source, target } = event.operation
    if (!source || !target || source.id === target.id) {
      return
    }

    const groupType = source.data?.group as 'template' | 'footer' | undefined
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
    } else {
      reorderFooterItems(sourceIndex, targetIndex)
    }
  }, [reorderTemplateItems, reorderFooterItems])

  // Determine if we should show detail inline (only when activeDetail exists, renderDetailInline is true)
  const showDetailInline = activeDetail && renderDetailInline

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      {showDetailInline ? (
        <>
          <PanelHeader title={activeDetail.label} onBack={handleCloseDetail} />
          <div className="flex-1 overflow-y-auto bg-surface">
            <SectionDetailRenderer activeDetail={activeDetail} props={props} />
          </div>
        </>
      ) : (
        <>
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
                                  : undefined
                              }
                              isAnnouncementBar={item.id === 'announcement-bar'}
                              announcementBarExpanded={announcementBarExpanded}
                              onToggleAnnouncementBar={() => setAnnouncementBarExpanded(!announcementBarExpanded)}
                              isFooter={item.id === 'footer'}
                              footerExpanded={footerExpanded}
                              onToggleFooter={() => setFooterExpanded(!footerExpanded)}
                              isPremium={isItemPremium(item)}
                              isSelected={!renderDetailInline && activeDetail?.id === item.id}
                              onSectionHover={setHoveredSectionId}
                              onScrollToSection={setScrollToSectionId}
                              showVisibilityToggle={item.id !== 'footer'}
                            />
                            {group.id === 'template' && item.id === 'main' && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('ai')}
                                className="group mt-1 flex w-full items-center gap-1 rounded-md bg-surface px-2 py-2 font-md font-normal text-foreground transition-colors hover:bg-subtle"
                              >
                                <span className="w-4 shrink-0" />
                                <span className="flex-1 truncate text-left font-normal leading-none">AI Section</span>
                              </button>
                            )}
                            {item.id === 'announcement-bar' && announcementBarExpanded && (
                            <div className="mt-0.5">
                              <SectionRow
                                item={{ id: 'announcement', label: 'Announcement', icon: Maximize }}
                                index={0}
                                draggable={false}
                                hidden={Boolean(props.sectionVisibility['announcement'])}
                                onToggleVisibility={() => props.toggleSectionVisibility('announcement')}
                                onOpenDetail={handleOpenDetail}
                                canOpenDetail={() => true}
                                isSubItem={true}
                                showVisibilityToggle={false}
                                isSelected={!renderDetailInline && activeDetail?.id === 'announcement'}
                                onSectionHover={setHoveredSectionId}
                                onScrollToSection={setScrollToSectionId}
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
                                  isSelected={!renderDetailInline && activeDetail?.id === footerItem.id}
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
        </>
      )}
    </div>
  )
})
