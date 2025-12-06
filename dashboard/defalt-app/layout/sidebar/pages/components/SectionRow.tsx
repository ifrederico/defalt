import { useState, useCallback, useRef, memo, useEffect } from 'react'
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Ghost as GhostIcon,
  Crown
} from 'lucide-react'
import { useSortable } from '@dnd-kit/react/sortable'
import { useDragOperation } from '@dnd-kit/react'
import type { SidebarItem } from '@defalt/utils/hooks/configStateDefaults'

export type SectionRowProps = {
  item: SidebarItem
  index?: number
  draggable: boolean
  groupType?: 'header' | 'template' | 'footer'
  hidden: boolean
  isParentDragging?: boolean
  onToggleVisibility: () => void
  onOpenDetail: (id: string, label: string) => void
  canOpenDetail: (id: string) => boolean
  onRemoveTemplateSection?: () => void
  isAnnouncementBar?: boolean
  announcementBarExpanded?: boolean
  onToggleAnnouncementBar?: () => void
  isFooter?: boolean
  footerExpanded?: boolean
  onToggleFooter?: () => void
  isSubItem?: boolean
  showVisibilityToggle?: boolean
  isPremium?: boolean
  isSelected?: boolean
  onSectionHover?: (id: string | null) => void
}

export const SectionRow = memo(function SectionRow({
  item,
  index,
  draggable,
  groupType,
  hidden,
  isParentDragging = false,
  onToggleVisibility,
  onOpenDetail,
  canOpenDetail,
  onRemoveTemplateSection,
  isAnnouncementBar = false,
  announcementBarExpanded = false,
  onToggleAnnouncementBar,
  isFooter = false,
  footerExpanded = false,
  onToggleFooter,
  isSubItem = false,
  showVisibilityToggle = true,
  isPremium = false,
  isSelected = false,
  onSectionHover,
}: SectionRowProps) {
  const Icon = item.icon ?? GhostIcon
  const isSelectable = canOpenDetail(item.id)
  const [rowHovered, setRowHovered] = useState(false)
  const [handleFocused, setHandleFocused] = useState(false)
  const [handleHovered, setHandleHovered] = useState(false)
  const handleButtonRef = useRef<HTMLButtonElement | null>(null)
  const pointerDownRef = useRef(false)
  const handleVisible = rowHovered || handleHovered || handleFocused
  const handleHighlighted = handleHovered || handleFocused
  const labelWeightClass = 'font-normal'

  // @dnd-kit sortable setup with Puck-style transition
  const { ref: sortableRef, isDragging, isDropTarget } = useSortable({
    id: item.id,
    index: index ?? 0,
    disabled: !draggable,
    data: { group: groupType, originalIndex: index ?? 0 },
    // "Out of the way" easing from react-beautiful-dnd
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  })

  // Get drag operation to determine drop indicator position
  const { source } = useDragOperation()
  const sourceIndex = (source?.data as { originalIndex?: number } | undefined)?.originalIndex
  const sourceId = source?.id
  const currentIndex = index ?? 0
  // Only show indicator when parent confirms drag is active and this is a valid drop target
  const isValidDropTarget = isParentDragging && isDropTarget && !isDragging && sourceId !== undefined && sourceId !== item.id
  // Show indicator at top if dragging from below, at bottom if dragging from above
  const showIndicatorAtTop = isValidDropTarget && sourceIndex !== undefined && sourceIndex > currentIndex
  const showIndicatorAtBottom = isValidDropTarget && sourceIndex !== undefined && sourceIndex < currentIndex

  // Reset hover states and blur handle when drag ends
  useEffect(() => {
    if (!isDragging) {
      setRowHovered(false)
      setHandleHovered(false)
      setHandleFocused(false)
      // Blur the handle to prevent focus restoration when switching tabs
      handleButtonRef.current?.blur()
    }
  }, [isDragging])

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true
  }, [])

  const handlePointerEnd = useCallback(() => {
    if (!pointerDownRef.current) {
      return
    }
    pointerDownRef.current = false
    const handleButton = handleButtonRef.current
    if (handleButton && typeof document !== 'undefined' && document.activeElement === handleButton) {
      handleButton.blur()
    }
  }, [handleButtonRef])

  return (
    <div
      ref={sortableRef}
      className={`group relative flex items-center justify-between rounded-md px-2 py-2 font-md transition-colors ${
        isSelected || rowHovered ? 'bg-subtle' : 'bg-surface'
      } ${isDragging ? 'opacity-50' : ''} ${isSelectable ? 'cursor-pointer' : ''}`}
      data-section-id={item.id}
      data-section-index={index}
      onClick={() => {
        if (isSelectable) {
          onOpenDetail(item.id, item.label)
        }
      }}
      onMouseEnter={() => {
        if (!isParentDragging) {
          setRowHovered(true)
          onSectionHover?.(item.id)
        }
      }}
      onMouseLeave={() => {
        setRowHovered(false)
        setHandleHovered(false)
        onSectionHover?.(null)
      }}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {/* Drop indicators */}
      {showIndicatorAtTop && (
        <div className="absolute -top-px left-0 right-0 flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-success -ml-0.5" />
          <div className="flex-1 h-px bg-success" />
        </div>
      )}
      {showIndicatorAtBottom && (
        <div className="absolute -bottom-px left-0 right-0 flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-success -ml-0.5" />
          <div className="flex-1 h-px bg-success" />
        </div>
      )}
      <div className={`flex flex-1 items-center gap-1 min-w-0 ${isSubItem ? 'ml-6' : ''}`}>
        {isAnnouncementBar || isFooter ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (isAnnouncementBar) {
                onToggleAnnouncementBar?.()
              } else if (isFooter) {
                onToggleFooter?.()
              }
            }}
            className="flex h-7 w-4 items-center justify-center shrink-0 text-secondary hover:text-foreground transition-colors"
            aria-label={
              isAnnouncementBar
                ? (announcementBarExpanded ? 'Collapse announcement bar' : 'Expand announcement bar')
                : (footerExpanded ? 'Collapse footer' : 'Expand footer')
            }
          >
            {(isAnnouncementBar ? announcementBarExpanded : footerExpanded) ? (
              <ChevronDown size={16} strokeWidth={1.5} />
            ) : (
              <ChevronRight size={16} strokeWidth={1.5} />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {draggable ? (
          <div className="relative flex h-7 w-7 items-center justify-center">
            <span
              className={`flex h-7 w-7 items-center justify-center text-secondary transition-opacity duration-150 ${handleVisible ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden={handleVisible}
            >
              <Icon size={16} strokeWidth={1.5} />
            </span>
            <button
              type="button"
              ref={handleButtonRef}
              className={`absolute inset-0 flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong hover:bg-hover ${
                handleVisible ? 'opacity-100 text-secondary pointer-events-auto' : 'opacity-0 text-placeholder pointer-events-none'
              } ${handleHighlighted ? 'bg-hover' : ''}`}
              aria-label={`Drag ${item.label}`}
              onPointerDown={handlePointerDown}
              onFocus={() => setHandleFocused(true)}
              onBlur={() => setHandleFocused(false)}
              onMouseEnter={() => setHandleHovered(true)}
              onMouseLeave={() => setHandleHovered(false)}
            >
              <GripVertical size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center text-secondary">
            <Icon size={16} strokeWidth={1.5} />
          </span>
        )}
        {isSelectable ? (
          <button
            type="button"
            className={`flex-1 text-left ${labelWeightClass} text-foreground hover:text-secondary flex items-center justify-between min-w-0`}
            onClick={() => onOpenDetail(item.id, item.label)}
          >
            <span className="truncate">{item.label}</span>
            {isPremium && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 shrink-0 ml-2 mr-2">
                <Crown size={9} strokeWidth={0} fill="currentColor" className="text-amber-600" />
              </span>
            )}
          </button>
        ) : (
          <span className={`flex-1 ${labelWeightClass} text-foreground flex items-center justify-between min-w-0`}>
            <span className="truncate">{item.label}</span>
            {isPremium && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 shrink-0 ml-2 mr-2">
                <Crown size={9} strokeWidth={0} fill="currentColor" className="text-amber-600" />
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onRemoveTemplateSection && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onRemoveTemplateSection()
            }}
            className={`flex rounded-full p-1 text-muted transition-opacity hover:text-foreground ${rowHovered ? 'opacity-100' : 'opacity-0'}`}
            aria-label={`Remove ${item.label}`}
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        )}
        {showVisibilityToggle && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleVisibility()
            }}
            className={`flex rounded-full p-1 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 focus-visible:pointer-events-auto ${
              hidden
                ? 'opacity-50 pointer-events-auto text-placeholder'
                : `text-muted ${rowHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
            }`}
            aria-pressed={!hidden}
            aria-label={hidden ? `Show ${item.label}` : `Hide ${item.label}`}
          >
            {hidden ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  )
})
