import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { getSectionSelector } from '../../custom-source/handlebars/sectionSelectors'
import { isFixedSection } from '@defalt/utils/config/sectionRegistry'
import { useFrame } from '../AutoFrame/useFrame'

type SectionActionBarProps = {
  selectedSectionId?: string | null
  hiddenSections?: Record<string, boolean>
  customSectionIds?: string[]
  aiSectionIds?: string[]
  onToggleVisibility?: (sectionId: string) => void
  onDuplicateSection?: (sectionId: string) => void
  onRemoveSection?: (sectionId: string) => void
  renderKey?: string
  layoutKey?: unknown
}

type PositionStyle = {
  top: number
  left: number
}

const resolveSectionElement = (doc: Document, sectionId: string): Element | null => {
  const selectors = getSectionSelector(sectionId)
  for (const selector of selectors) {
    const match = doc.querySelector(selector)
    if (match) {
      return match
    }
  }
  return null
}

const isAnnouncementSection = (sectionId: string) =>
  sectionId === 'announcement-bar' || sectionId.startsWith('announcement-bar-')

export function SectionActionBar({
  selectedSectionId,
  hiddenSections,
  customSectionIds = [],
  aiSectionIds = [],
  onToggleVisibility,
  onDuplicateSection,
  onRemoveSection,
  renderKey,
  layoutKey,
}: SectionActionBarProps) {
  const { document: frameDocument } = useFrame()
  const barRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PositionStyle | null>(null)

  const selectedId = selectedSectionId ?? null
  const isHidden = selectedId ? Boolean(hiddenSections?.[selectedId]) : false
  const isFixed = selectedId ? isFixedSection(selectedId) : false
  const isCustom = selectedId
    ? customSectionIds.includes(selectedId) || aiSectionIds.includes(selectedId)
    : false
  const canDuplicate = Boolean(selectedId && onDuplicateSection && isCustom && !isFixed)
  const canDelete = Boolean(selectedId && onRemoveSection && isCustom && !isFixed)
  const canToggleVisibility = Boolean(selectedId && onToggleVisibility)

  const updatePosition = useCallback(() => {
    if (!selectedId || !frameDocument || !barRef.current) {
      setPosition(null)
      return
    }

    if (isAnnouncementSection(selectedId)) {
      setPosition(null)
      return
    }

    const target = resolveSectionElement(frameDocument, selectedId)
    if (!target) {
      setPosition(null)
      return
    }

    const barRect = barRef.current.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    const win = frameDocument.defaultView
    const scrollX = win?.scrollX ?? frameDocument.documentElement.scrollLeft ?? frameDocument.body?.scrollLeft ?? 0
    const scrollY = win?.scrollY ?? frameDocument.documentElement.scrollTop ?? frameDocument.body?.scrollTop ?? 0

    let top = rect.top + scrollY - barRect.height - 8
    const minTop = scrollY + 8
    if (top < minTop) {
      top = rect.bottom + scrollY + 8
    }

    const viewportWidth = frameDocument.documentElement.clientWidth || win?.innerWidth || rect.width
    const minLeft = scrollX + 8
    const maxLeft = scrollX + viewportWidth - barRect.width - 8
    let left = rect.right + scrollX - barRect.width
    if (maxLeft >= minLeft) {
      left = Math.min(Math.max(left, minLeft), maxLeft)
    } else {
      left = minLeft
    }

    setPosition({ top, left })
  }, [frameDocument, selectedId])

  useEffect(() => {
    updatePosition()
  }, [updatePosition, renderKey, layoutKey, isHidden, canDuplicate, canDelete])

  useEffect(() => {
    const win = frameDocument?.defaultView
    if (!win) {
      return
    }

    let rafId: number | null = null
    const scheduleUpdate = () => {
      if (rafId !== null) {
        return
      }
      rafId = win.requestAnimationFrame(() => {
        rafId = null
        updatePosition()
      })
    }

    win.addEventListener('scroll', scheduleUpdate, { passive: true })
    win.addEventListener('resize', scheduleUpdate)

    return () => {
      win.removeEventListener('scroll', scheduleUpdate)
      win.removeEventListener('resize', scheduleUpdate)
      if (rafId !== null) {
        win.cancelAnimationFrame(rafId)
      }
    }
  }, [frameDocument, updatePosition])

  if (!selectedId || isAnnouncementSection(selectedId)) {
    return null
  }

  const style = position ?? {
    top: 0,
    left: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
  }

  const handleDuplicate = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDuplicate && selectedId) {
      onDuplicateSection?.(selectedId)
    }
  }

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDelete && selectedId) {
      onRemoveSection?.(selectedId)
    }
  }

  const handleToggleVisibility = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canToggleVisibility && selectedId) {
      onToggleVisibility?.(selectedId)
    }
  }

  return (
    <div
      ref={barRef}
      className="df-action-bar"
      style={style}
    >
      <button
        type="button"
        aria-label={isHidden ? 'Show section' : 'Hide section'}
        onClick={handleToggleVisibility}
        disabled={!canToggleVisibility}
      >
        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        type="button"
        aria-label="Duplicate section"
        onClick={handleDuplicate}
        disabled={!canDuplicate}
      >
        <Copy size={16} />
      </button>
      <button
        type="button"
        aria-label="Delete section"
        onClick={handleDelete}
        disabled={!canDelete}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
