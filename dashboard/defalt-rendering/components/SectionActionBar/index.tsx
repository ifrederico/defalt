import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { CodeXml, Copy, Trash2, Eye, EyeOff, Clipboard } from 'lucide-react'
import { FOOTER_ROOT_SELECTOR, TEMPLATE_CONTAINER_SELECTOR } from '../../custom-source/handlebars/sectionSelectors'
import { isFixedSection } from '@defalt/utils/config/sectionRegistry'
import { useFrame } from '../AutoFrame/useFrame'
import { getOverlayStyle, resolveSectionElement, type OverlayStyle } from '../overlayUtils'
import { type SectionInstance, getSectionDefinition } from '@defalt/sections/engine'
import { type SectionPadding } from '@defalt/utils/config/themeConfig'
import { withBasePath } from '@defalt/utils/env/basePath'
import {
  buildSectionSnippet,
  PARTIAL_FILENAME_MAP,
  getCachedSnippet,
  setCachedSnippet,
  sanitizeTemplateForCopy,
  inlineStylePartialForCopy
} from './snippetBuilder'
import { copyToClipboard, createCopyStatusHandler } from './copyToClipboard'

type SectionActionBarProps = {
  selectedSectionId?: string | null
  hiddenSections?: Record<string, boolean>
  customSectionIds?: string[]
  aiSectionIds?: string[]
  customSections?: SectionInstance[]
  sectionPadding?: Record<string, SectionPadding>
  onToggleVisibility?: (sectionId: string) => void
  onDuplicateSection?: (sectionId: string) => void
  onRemoveSection?: (sectionId: string) => void
  renderKey?: string
  layoutKey?: unknown
}

const ACTION_BAR_SPACE = 8
const ACTION_BAR_SIDE = ACTION_BAR_SPACE
const ACTION_BAR_MIN_TOP = 12

const isAnnouncementSection = (sectionId: string) =>
  sectionId === 'announcement-bar' || sectionId.startsWith('announcement-bar-')
const isFooterParentSection = (sectionId: string) => sectionId.toLowerCase() === 'footer'
const isFooterChildSection = (sectionId: string) => {
  const normalized = sectionId.toLowerCase()
  return normalized === 'footerbar' || normalized === 'footer-bar' || normalized === 'footersignup' || normalized === 'footer-signup'
}

export function SectionActionBar({
  selectedSectionId,
  hiddenSections,
  customSectionIds = [],
  aiSectionIds = [],
  customSections = [],
  sectionPadding,
  onToggleVisibility,
  onDuplicateSection,
  onRemoveSection,
  renderKey,
  layoutKey,
}: SectionActionBarProps) {
  const { document: frameDocument } = useFrame()
  const barRef = useRef<HTMLDivElement>(null)
  const copyTimeoutRef = useRef<number | null>(null)
  const [overlayStyle, setOverlayStyle] = useState<OverlayStyle | null>(null)
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null)
  const [isCodeOpen, setIsCodeOpen] = useState(false)
  const [partialSnippet, setPartialSnippet] = useState<string>('')
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false)
  const [copyStatus, setCopyStatus] = useState<{ target: 'include' | 'partial'; status: 'success' | 'error' } | null>(null)

  const selectedId = selectedSectionId ?? null
  const isHidden = selectedId ? Boolean(hiddenSections?.[selectedId]) : false
  const isFixed = selectedId ? isFixedSection(selectedId) : false
  const isCustom = selectedId
    ? customSectionIds.includes(selectedId) || aiSectionIds.includes(selectedId)
    : false
  const selectedCustomSection = useMemo(
    () => (selectedId ? customSections.find((section) => section.id === selectedId) ?? null : null),
    [customSections, selectedId]
  )
  const includeSnippet = useMemo(() => {
    if (!selectedCustomSection) {
      return ''
    }
    return buildSectionSnippet(selectedCustomSection, sectionPadding?.[selectedCustomSection.id])
  }, [selectedCustomSection, sectionPadding])
  const canShowCode = Boolean(selectedCustomSection && includeSnippet)
  const canDuplicate = Boolean(selectedId && onDuplicateSection && isCustom && !isFixed)
  const canDelete = Boolean(selectedId && onRemoveSection && isCustom && !isFixed)
  const canToggleVisibility = Boolean(selectedId && onToggleVisibility)

  const updatePosition = useCallback(() => {
    if (!selectedId || !frameDocument) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    if (isAnnouncementSection(selectedId) || isHidden) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    const target = resolveSectionElement(frameDocument, selectedId)
    if (!target) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    const element = target as HTMLElement
    let nextStyle = getOverlayStyle(element)

    if (isFooterChildSection(selectedId)) {
      const footerRoot = frameDocument.querySelector<HTMLElement>(FOOTER_ROOT_SELECTOR)
      if (footerRoot) {
        const footerStyle = getOverlayStyle(footerRoot)
        nextStyle = {
          ...nextStyle,
          left: footerStyle.left,
          width: footerStyle.width,
        }
      }
    }

    if (isFooterParentSection(selectedId)) {
      const computed = frameDocument.defaultView?.getComputedStyle(element)
      const marginTop = computed ? Number.parseFloat(computed.marginTop) || 0 : 0
      if (marginTop > 0) {
        nextStyle = {
          ...nextStyle,
          top: nextStyle.top - marginTop,
        }
      }
    }

    setTargetEl((current) => (current !== element ? element : current))
    setOverlayStyle(nextStyle)
  }, [frameDocument, selectedId, isHidden])

  const applyActionBarPosition = useCallback(() => {
    const node = barRef.current
    if (!node) {
      return
    }

    const barHeight = node.offsetHeight || 0
    const desiredTop = -(barHeight + ACTION_BAR_SPACE)

    node.style.left = ''
    node.style.top = `${desiredTop}px`
    node.style.transformOrigin = 'right top'

    const rect = node.getBoundingClientRect()
    const exceedsBoundsTop = rect.y < ACTION_BAR_MIN_TOP

    if (exceedsBoundsTop) {
      node.style.top = `${ACTION_BAR_MIN_TOP}px`
    }
  }, [])

  const syncActionsPosition = useCallback((node: HTMLDivElement | null) => {
    barRef.current = node
    applyActionBarPosition()
  }, [applyActionBarPosition])

  useEffect(() => {
    updatePosition()
  }, [updatePosition, renderKey, layoutKey, isHidden])

  useEffect(() => {
    applyActionBarPosition()
  }, [applyActionBarPosition, overlayStyle, selectedId])

  useEffect(() => {
    if (!targetEl) {
      return
    }
    const observer = new ResizeObserver(() => updatePosition())
    observer.observe(targetEl)
    return () => observer.disconnect()
  }, [targetEl, updatePosition])

  useEffect(() => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }
    setIsCodeOpen(false)
    setPartialSnippet('')
    setIsLoadingSnippet(false)
    setCopyStatus(null)
  }, [selectedId])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
        copyTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isCodeOpen || !frameDocument) {
      return
    }
    const handleClick = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null
      if (barRef.current && target && !barRef.current.contains(target)) {
        setIsCodeOpen(false)
      }
    }
    frameDocument.addEventListener('mousedown', handleClick)
    return () => frameDocument.removeEventListener('mousedown', handleClick)
  }, [frameDocument, isCodeOpen])

  useEffect(() => {
    if (!isCodeOpen || !selectedCustomSection) {
      return
    }

    const definition = getSectionDefinition(selectedCustomSection.definitionId)
    const templatePath = definition?.templatePath
    if (!templatePath) {
      setPartialSnippet('')
      return
    }

    const cached = getCachedSnippet(templatePath)
    if (cached !== undefined) {
      setPartialSnippet(cached)
      return
    }

    let cancelled = false
    setIsLoadingSnippet(true)
    const loadTemplate = async () => {
      try {
        const url = withBasePath(`/sections/${templatePath}`)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Template fetch failed: ${response.status}`)
        }
        const content = await response.text()
        const inlined = await inlineStylePartialForCopy(templatePath, content)
        const sanitized = sanitizeTemplateForCopy(inlined)
        if (cancelled) return
        setCachedSnippet(templatePath, sanitized)
        setPartialSnippet(sanitized)
      } catch {
        if (!cancelled) {
          setPartialSnippet('')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSnippet(false)
        }
      }
    }
    void loadTemplate()

    return () => {
      cancelled = true
    }
  }, [isCodeOpen, selectedCustomSection])

  useEffect(() => {
    const win = frameDocument?.defaultView
    if (!win) {
      return
    }

    let rafId: number | null = null
    const schedulePositionUpdate = () => {
      if (rafId !== null) {
        return
      }
      rafId = win.requestAnimationFrame(() => {
        rafId = null
        updatePosition()
      })
    }

    const handleScroll = () => {
      schedulePositionUpdate()
    }

    const handleResize = () => {
      schedulePositionUpdate()
    }

    const scrollTargets: Array<Window | HTMLElement> = [win]
    const viewport = frameDocument.querySelector<HTMLElement>(TEMPLATE_CONTAINER_SELECTOR)
    if (viewport && viewport !== frameDocument.documentElement && viewport !== frameDocument.body) {
      scrollTargets.push(viewport)
    }

    scrollTargets.forEach((target) => target.addEventListener('scroll', handleScroll, { passive: true }))
    win.addEventListener('resize', handleResize)

    return () => {
      scrollTargets.forEach((target) => target.removeEventListener('scroll', handleScroll))
      win.removeEventListener('resize', handleResize)
      if (rafId !== null) {
        win.cancelAnimationFrame(rafId)
      }
    }
  }, [frameDocument, updatePosition, renderKey])

  if (!selectedId || isAnnouncementSection(selectedId) || isHidden) {
    return null
  }

  const wrapperStyle: CSSProperties = overlayStyle
    ? {
        top: overlayStyle.top,
        left: overlayStyle.left,
        width: overlayStyle.width,
        height: overlayStyle.height,
      }
    : {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }

  const handleDuplicate = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDuplicate && selectedId) {
      onDuplicateSection?.(selectedId)
    }
  }

  const handleDelete = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDelete && selectedId) {
      onRemoveSection?.(selectedId)
    }
  }

  const handleToggleVisibility = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canToggleVisibility && selectedId) {
      onToggleVisibility?.(selectedId)
    }
  }

  const handleToggleCode = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canShowCode) {
      return
    }
    setIsCodeOpen((current) => !current)
  }

  const { notifySuccess, notifyFailure } = createCopyStatusHandler(setCopyStatus, copyTimeoutRef)

  const handleCopySnippet = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!includeSnippet) {
      return
    }
    void copyToClipboard(includeSnippet, frameDocument).then((success) => {
      if (success) {
        notifySuccess('include')
      } else {
        notifyFailure('include')
      }
    })
  }

  const handleCopyPartial = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!partialSnippet) {
      return
    }
    void copyToClipboard(partialSnippet, frameDocument).then((success) => {
      if (success) {
        notifySuccess('partial')
      } else {
        notifyFailure('partial')
      }
    })
  }

  return (
    <div className="df-action-bar-overlay" style={wrapperStyle}>
      <div className="df-action-bar-overlay-inner" style={{ top: 0 }}>
        <div
          ref={syncActionsPosition}
          className="df-action-bar"
          style={{
            top: 0,
            right: 16,
            paddingLeft: ACTION_BAR_SIDE,
            paddingRight: ACTION_BAR_SIDE,
          }}
        >
          {canShowCode && (
            <button
              type="button"
              aria-label="Show section code"
              aria-expanded={isCodeOpen}
              onClick={handleToggleCode}
            >
              <CodeXml size={16} />
            </button>
          )}
          {canShowCode && <span className="df-action-bar__separator" aria-hidden="true" />}
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
          {isCodeOpen && canShowCode && (
            <div className="df-action-bar__popover" onClick={(event) => event.stopPropagation()}>
              <div className="df-action-bar__popover-header">
                <span>home.hbs</span>
                <div className="df-action-bar__copy-group">
                  {copyStatus?.target === 'include' && (
                    <span
                      className={`df-action-bar__copy-status${
                        copyStatus.status === 'success'
                          ? ' df-action-bar__copy-status--success'
                          : ' df-action-bar__copy-status--error'
                      }`}
                    >
                      {copyStatus.status === 'success' ? '✓ Copied' : 'Copy failed'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="df-action-bar__copy"
                    onClick={handleCopySnippet}
                    aria-label="Copy home.hbs snippet"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
              </div>
              <pre className="df-action-bar__code">{includeSnippet}</pre>
              <div className="df-action-bar__popover-header">
                <span>
                  {selectedCustomSection?.definitionId
                    ? `partials/${PARTIAL_FILENAME_MAP[selectedCustomSection.definitionId] ?? 'partial.hbs'}`
                    : 'partials/partial.hbs'}
                </span>
                <div className="df-action-bar__copy-group">
                  {copyStatus?.target === 'partial' && (
                    <span
                      className={`df-action-bar__copy-status${
                        copyStatus.status === 'success'
                          ? ' df-action-bar__copy-status--success'
                          : ' df-action-bar__copy-status--error'
                      }`}
                    >
                      {copyStatus.status === 'success' ? '✓ Copied' : 'Copy failed'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="df-action-bar__copy"
                    onClick={handleCopyPartial}
                    disabled={!partialSnippet}
                    aria-label="Copy partial snippet"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
              </div>
              <pre className="df-action-bar__code">
                {isLoadingSnippet ? 'Loading template…' : (partialSnippet || 'Template unavailable.')}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
