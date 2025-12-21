import { useCallback, useEffect, useState } from 'react'
import { getSectionSelector } from '../../custom-source/handlebars/sectionSelectors'
import { useFrame } from '../AutoFrame/useFrame'

const FOOTER_SECTION_IDS = new Set(['footer', 'footerbar', 'footersignup'])

type OverlayRect = {
  top: number
  left: number
  width: number
  height: number
}

type SelectionOverlayProps = {
  selectedSectionId?: string | null
  hoveredSectionId?: string | null
  renderKey?: string
  layoutKey?: unknown
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

const computeOverlayRect = (doc: Document, element: Element, sectionId: string): OverlayRect | null => {
  const win = doc.defaultView
  const rect = element.getBoundingClientRect()
  const computed = win ? win.getComputedStyle(element) : getComputedStyle(element)
  const marginTop = parseFloat(computed.marginTop) || 0
  const marginBottom = parseFloat(computed.marginBottom) || 0
  const scrollX = win?.scrollX ?? doc.documentElement.scrollLeft ?? doc.body?.scrollLeft ?? 0
  const scrollY = win?.scrollY ?? doc.documentElement.scrollTop ?? doc.body?.scrollTop ?? 0
  const fullWidth = FOOTER_SECTION_IDS.has(sectionId.toLowerCase()) || marginTop > 0 || marginBottom > 0
  const top = rect.top + scrollY - marginTop
  const height = rect.height + marginTop + marginBottom
  if (height <= 0) {
    return null
  }

  if (fullWidth) {
    const width = doc.documentElement.clientWidth || rect.width
    return {
      top,
      left: scrollX,
      width,
      height,
    }
  }

  return {
    top,
    left: rect.left + scrollX,
    width: rect.width,
    height,
  }
}

export function SelectionOverlay({
  selectedSectionId,
  hoveredSectionId,
  renderKey,
  layoutKey,
}: SelectionOverlayProps) {
  const { document: frameDocument } = useFrame()
  const [selectedRect, setSelectedRect] = useState<OverlayRect | null>(null)
  const [hoverRect, setHoverRect] = useState<OverlayRect | null>(null)

  const updateRects = useCallback(() => {
    if (!frameDocument) {
      setSelectedRect(null)
      setHoverRect(null)
      return
    }

    if (selectedSectionId) {
      const element = resolveSectionElement(frameDocument, selectedSectionId)
      setSelectedRect(element ? computeOverlayRect(frameDocument, element, selectedSectionId) : null)
    } else {
      setSelectedRect(null)
    }

    if (hoveredSectionId && hoveredSectionId !== selectedSectionId) {
      const element = resolveSectionElement(frameDocument, hoveredSectionId)
      setHoverRect(element ? computeOverlayRect(frameDocument, element, hoveredSectionId) : null)
    } else {
      setHoverRect(null)
    }
  }, [frameDocument, selectedSectionId, hoveredSectionId])

  useEffect(() => {
    updateRects()
  }, [updateRects, renderKey, layoutKey])

  useEffect(() => {
    const win = frameDocument?.defaultView
    if (!win) {
      return
    }

    const handleScroll = () => updateRects()
    const handleResize = () => updateRects()

    win.addEventListener('scroll', handleScroll, { passive: true })
    win.addEventListener('resize', handleResize)

    return () => {
      win.removeEventListener('scroll', handleScroll)
      win.removeEventListener('resize', handleResize)
    }
  }, [frameDocument, updateRects])

  if (!frameDocument || (!selectedRect && !hoverRect)) {
    return null
  }

  return (
    <>
      {selectedRect && (
        <div
          className="df-selection-overlay df-selection-overlay--selected"
          style={selectedRect}
        />
      )}
      {hoverRect && (
        <div
          className="df-selection-overlay df-selection-overlay--hover"
          style={hoverRect}
        />
      )}
    </>
  )
}
