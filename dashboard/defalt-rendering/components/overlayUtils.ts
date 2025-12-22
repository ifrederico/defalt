import { getSectionSelector } from '../custom-source/handlebars/sectionSelectors'

const escapeSectionId = (sectionId: string): string => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.CSS?.escape === 'function') {
    return globalThis.CSS.escape(sectionId)
  }
  return sectionId.replace(/["\\]/g, '\\$&')
}

const isHiddenCandidate = (doc: Document, element: Element): boolean => {
  const el = element as HTMLElement
  if (el.closest('.hidden, [data-preview-hidden="true"], [data-section-hidden="true"]')) {
    return true
  }
  const win = doc.defaultView
  const style = win ? win.getComputedStyle(el) : getComputedStyle(el)
  return style.display === 'none' || style.visibility === 'hidden'
}

const scoreCandidate = (
  rect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): number => {
  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0))
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = Math.max(0, rect.width) * Math.max(0, rect.height)
  if (visibleArea > 0) {
    return visibleArea + totalArea * 0.001
  }
  return totalArea
}

type ScrollPosition = {
  x: number
  y: number
}

type AccumulatedTransform = {
  scaleX: number
  scaleY: number
}

export type OverlayStyle = {
  left: number
  top: number
  width: number
  height: number
}

const getDeepScrollPosition = (element: HTMLElement): ScrollPosition => {
  let totalScroll = { x: 0, y: 0 }
  let current: HTMLElement | null = element

  while (current && current !== element.ownerDocument.documentElement) {
    const parent = current.parentElement
    if (parent) {
      totalScroll.x += parent.scrollLeft
      totalScroll.y += parent.scrollTop
    }
    current = parent
  }

  return totalScroll
}

const accumulateTransform = (element: HTMLElement): AccumulatedTransform => {
  let matrix = new DOMMatrixReadOnly()
  let current: HTMLElement | null = element.parentElement

  while (current && current !== element.ownerDocument.documentElement) {
    const transform = getComputedStyle(current).transform
    if (transform && transform !== 'none') {
      matrix = new DOMMatrixReadOnly(transform).multiply(matrix)
    }
    current = current.parentElement
  }

  return { scaleX: matrix.a || 1, scaleY: matrix.d || 1 }
}

export const getOverlayStyle = (
  element: HTMLElement,
  portalContainer?: HTMLElement | null
): OverlayStyle => {
  const rect = element.getBoundingClientRect()
  const width = element.offsetWidth || rect.width
  const height = element.offsetHeight || rect.height

  if (!portalContainer) {
    return {
      left: rect.left,
      top: rect.top,
      width,
      height,
    }
  }
  const deepScroll = getDeepScrollPosition(element)
  const portalRect = portalContainer?.getBoundingClientRect()
  const portalScroll = portalContainer ? getDeepScrollPosition(portalContainer) : { x: 0, y: 0 }

  const scroll = {
    x: deepScroll.x - portalScroll.x - (portalRect?.left ?? 0),
    y: deepScroll.y - portalScroll.y - (portalRect?.top ?? 0),
  }

  const transform = accumulateTransform(element)

  return {
    left: (rect.left + scroll.x) / transform.scaleX,
    top: (rect.top + scroll.y) / transform.scaleY,
    width,
    height,
  }
}

export function resolveSectionElement(doc: Document, sectionId: string): Element | null {
  const selectors = getSectionSelector(sectionId)
  const dataSelector = `[data-section-id="${escapeSectionId(sectionId)}"]`
  const allSelectors = Array.from(new Set([...selectors, dataSelector]))
  const elements = new Set<Element>()

  allSelectors.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((el) => elements.add(el))
  })

  const candidates = Array.from(elements).filter((el) => !isHiddenCandidate(doc, el))
  if (candidates.length === 0) {
    return null
  }

  const win = doc.defaultView
  const viewportWidth = doc.documentElement.clientWidth || win?.innerWidth || 0
  const viewportHeight = doc.documentElement.clientHeight || win?.innerHeight || 0

  let best = candidates[0]
  let bestScore = -1

  candidates.forEach((candidate) => {
    const rect = candidate.getBoundingClientRect()
    const score = scoreCandidate(rect, viewportWidth, viewportHeight)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  })

  return best
}
