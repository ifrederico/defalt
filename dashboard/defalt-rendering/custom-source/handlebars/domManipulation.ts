import type { MutableRefObject } from 'react'
import {
  FOOTER_INNER_SELECTOR,
  FOOTER_ROOT_SELECTOR,
  FOOTER_SECTION_SELECTORS,
  TEMPLATE_CONTAINER_SELECTOR,
  TEMPLATE_SECTION_SELECTORS,
  toSelectorList,
  getSectionSelector,
} from './sectionSelectors'
import { throttle } from '@defalt/utils/performance/throttle'
import {
  applyHeaderCustomizations,
  type HeaderCustomizationOptions,
} from './headerCustomization'
import { sanitizeCustomCss } from '@defalt/utils/security/sanitizers'
import { BASE_PATH } from '@defalt/utils/env/basePath'

let portalMockElement: HTMLDivElement | null = null
const CUSTOM_CSS_STYLE_ID = 'gh-editor-custom-css'
const PREVIEW_STYLES_ID = 'gh-editor-preview-styles'
const THEME_CSS_LINK_ID = 'gh-editor-theme-css'
const THEME_CSS_HREF = `${BASE_PATH}/themes/source-complete/assets/built/screen.css`
const PREVIEW_INLINE_STYLES = `
body.app-hide-announcement-bar #gh-announcement-bar,
body.app-hide-announcement-bar .gh-announcement-bar {
  display: none !important;
}

body.app-hide-header #gh-navigation,
body.app-hide-header .gh-navigation {
  display: none !important;
}

body.app-hide-subheader section.gh-header,
body.app-hide-subheader section.gh-cta {
  display: none !important;
}

body.app-hide-main section.gh-container {
  display: none !important;
}

body.app-hide-footer-bar .gh-footer-bar {
  display: none !important;
}

body.app-hide-footer-signup .gh-footer-signup {
  display: none !important;
}

[data-section-hidden="true"] {
  display: none !important;
}

/* Keep Koenig card defaults from screen.css (export parity) */
`


type InjectPreviewOptions = {
  templateOrder: string[]
  footerOrder: string[]
  headerOptions: HeaderCustomizationOptions
  announcementBars?: Array<{ id: string; html: string; hidden: boolean }>
  selectedSectionId?: string | null
  sectionIds?: string[]
  onSelectSection?: (sectionId: string) => void
  customCss?: string
  customSections?: Array<{ id: string, html: string, hidden: boolean }>
  onNavigate?: (href: string) => boolean
}

function escapeSectionId(sectionId: string): string {
  const css = typeof globalThis !== 'undefined' && typeof (globalThis as { CSS?: { escape?: (value: string) => string } }).CSS?.escape === 'function'
    ? (globalThis as { CSS: { escape: (value: string) => string } }).CSS.escape
    : null
  if (css) {
    return css(sectionId)
  }
  return sectionId.replace(/["\\]/g, '\\$&')
}

function getCustomSectionSelector(sectionId: string) {
  return `[data-section-id="${escapeSectionId(sectionId)}"]`
}

function findCommentMarker(doc: Document, key: string, position: 'start' | 'end'): Comment | null {
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT)
  const marker = `defalt-${key}-${position}`
  let node = walker.nextNode()
  while (node) {
    const comment = node as Comment
    if (comment.nodeValue?.includes(marker)) {
      return comment
    }
    node = walker.nextNode()
  }
  return null
}

function collectCommentRange(doc: Document, key: string): Node[] {
  const start = findCommentMarker(doc, key, 'start')
  const end = findCommentMarker(doc, key, 'end')
  if (!start || !end) {
    return []
  }

  const nodes: Node[] = []
  let current: Node | null = start
  // safeguard against infinite loops
  const safetyLimit = 1000
  let steps = 0
  while (current && steps < safetyLimit) {
    nodes.push(current)
    if (current === end) {
      break
    }
    current = current.nextSibling
    steps += 1
  }
  return nodes
}

function ensurePreviewStyles(doc: Document) {
  if (doc.getElementById(PREVIEW_STYLES_ID)) {
    return
  }

  const styleEl = doc.createElement('style')
  styleEl.id = PREVIEW_STYLES_ID
  styleEl.type = 'text/css'
  styleEl.appendChild(doc.createTextNode(PREVIEW_INLINE_STYLES))

  const head = doc.head || doc.body
  head.appendChild(styleEl)

  // Ensure theme CSS (includes Koenig card styles) is present for Ghost content
  const existingThemeLink = doc.getElementById(THEME_CSS_LINK_ID) as HTMLLinkElement | null
  const foundScreenLink = doc.querySelector<HTMLLinkElement>('link[href*="screen.css"]')
  if (!existingThemeLink) {
    if (foundScreenLink) {
      foundScreenLink.id = THEME_CSS_LINK_ID
    } else {
      const themeLink = doc.createElement('link')
      themeLink.id = THEME_CSS_LINK_ID
      themeLink.rel = 'stylesheet'
      themeLink.href = THEME_CSS_HREF
      head.prepend(themeLink)
    }
  }
}

export function syncTemplateSections(doc: Document, sections: Array<{ id: string, html: string, hidden: boolean }>) {
  ensurePreviewStyles(doc)

  const viewport = doc.querySelector(TEMPLATE_CONTAINER_SELECTOR)
  if (!viewport) return

  // Find footer anchor to insert AI sections before it (between main and footer)
  const footerAnchor =
    viewport.querySelector(FOOTER_ROOT_SELECTOR) ??
    viewport.querySelector('footer.gh-footer')

  const desiredIds = new Set(sections.map((section) => section.id))

  Array.from(viewport.querySelectorAll<HTMLElement>('[data-section-id]')).forEach((element) => {
    const sectionId = element.getAttribute('data-section-id')
    if (!sectionId) {
      return
    }
    if (!desiredIds.has(sectionId)) {
      element.remove()
    }
  })

  sections.forEach((section) => {
    const selector = getCustomSectionSelector(section.id)
    const template = doc.createElement('template')
    template.innerHTML = section.html

    // HBS templates may have <style> tags followed by <section> tags
    // We need to handle both: inject styles into head, and section into viewport
    const children = Array.from(template.content.children)
    let sectionElement: HTMLElement | null = null
    const styleElements: HTMLStyleElement[] = []

    for (const child of children) {
      if (child.tagName === 'STYLE') {
        styleElements.push(child as HTMLStyleElement)
      } else if (child.tagName === 'SECTION' || child.classList?.contains('gh-outer')) {
        sectionElement = child as HTMLElement
      }
    }

    // If no explicit section found, use first non-style element
    if (!sectionElement) {
      sectionElement = children.find(c => c.tagName !== 'STYLE') as HTMLElement | null
    }

    if (!sectionElement) {
      return
    }

    // Inject style elements into document head with section-specific IDs
    const existingStyleId = `section-style-${section.id}`
    const existingStyle = doc.getElementById(existingStyleId)
    if (existingStyle) {
      existingStyle.remove()
    }

    if (styleElements.length > 0) {
      const combinedStyle = doc.createElement('style')
      combinedStyle.id = existingStyleId
      combinedStyle.textContent = styleElements.map(s => s.textContent).join('\n')
      doc.head.appendChild(combinedStyle)
    }

    sectionElement.setAttribute('data-section-id', section.id)
    sectionElement.dataset.sectionType = 'custom'
    sectionElement.dataset.sectionHidden = section.hidden ? 'true' : 'false'
    sectionElement.setAttribute('aria-hidden', section.hidden ? 'true' : 'false')

    const existing = viewport.querySelector<HTMLElement>(selector)
    if (existing) {
      existing.replaceWith(sectionElement)
    } else if (footerAnchor) {
      // Insert before footer so AI sections appear between main and footer
      viewport.insertBefore(sectionElement, footerAnchor)
    } else {
      viewport.appendChild(sectionElement)
    }
  })
}

/**
 * Reorders template sections inside the preview iframe to match the
 * user-defined order from the sidebar drag-and-drop interface.
 */
export function reorderTemplateInDOM(doc: Document, order: string[]) {
  const viewport = doc.querySelector(TEMPLATE_CONTAINER_SELECTOR)
  if (!viewport) {
    return
  }

  const footerAnchor =
    viewport.querySelector(FOOTER_ROOT_SELECTOR) ??
    viewport.querySelector('footer.gh-footer')

  const sections: Record<string, Node[]> = {}

  order.forEach((key) => {
    const selectorDef = TEMPLATE_SECTION_SELECTORS[key as keyof typeof TEMPLATE_SECTION_SELECTORS]
    const elements: Node[] = []

    // Try standard selectors first
    if (selectorDef) {
      toSelectorList(selectorDef).forEach((selector) => {
        const matches = Array.from(doc.querySelectorAll(selector))
        matches.forEach((match) => {
          if (viewport.contains(match) && !elements.includes(match)) {
            elements.push(match)
          }
        })
      })
    }

    // Try comment-based ranges
    const commentNodes = collectCommentRange(doc, key)
    if (commentNodes.length > 0) {
      commentNodes.forEach((node) => {
        if (node.parentNode && viewport.contains(node.parentNode)) {
          if (!elements.includes(node)) {
            elements.push(node)
          }
        }
      })
      const lastNode = commentNodes[commentNodes.length - 1]
      if (lastNode) {
        let sibling = lastNode.nextSibling
        while (sibling && sibling.nodeType === Node.TEXT_NODE && sibling.textContent?.trim() === '') {
          sibling = sibling.nextSibling
        }
        if (sibling && !elements.includes(sibling)) {
          elements.push(sibling)
        }
      }
    }

    // Try custom section selector as fallback
    if (elements.length === 0) {
      const customSelector = getCustomSectionSelector(key)
      const customElement = doc.querySelector(customSelector)
      if (customElement && viewport.contains(customElement)) {
        elements.push(customElement)
      }
    }

    if (elements.length > 0) {
      sections[key] = elements
    }
  })

  if (Object.keys(sections).length === 0) {
    return
  }

  // Remove all sections from DOM (but keep them in memory)
  const sectionsToRemove: Node[] = []
  Object.values(sections).forEach((sectionElements) => {
    sectionElements.forEach((section) => {
      if (section.parentNode) {
        sectionsToRemove.push(section)
      }
    })
  })

  sectionsToRemove.forEach((section) => {
    section.parentNode?.removeChild(section)
  })

  // Build fragment in correct order
  const fragment = doc.createDocumentFragment()
  order.forEach((key) => {
    const sectionElements = sections[key]
    if (sectionElements) {
      sectionElements.forEach((section) => {
        fragment.appendChild(section)
      })
    }
  })

  // Insert fragment before footer
  if (footerAnchor && footerAnchor.parentElement === viewport) {
    viewport.insertBefore(fragment, footerAnchor)
  } else {
    viewport.appendChild(fragment)
  }
}

/**
 * Reorders footer sections in the preview to reflect editor changes.
 */
export function reorderFooterInDOM(doc: Document, order: string[]) {
  const footerInner =
    doc.querySelector(FOOTER_INNER_SELECTOR) ??
    doc.querySelector('.gh-footer-inner')
  if (!footerInner) return

  const sections: Record<string, Element> = {}

  order.forEach((key) => {
    const selector = FOOTER_SECTION_SELECTORS[key as keyof typeof FOOTER_SECTION_SELECTORS]
    if (!selector) {
      return
    }

    const element = footerInner.querySelector(selector) ?? doc.querySelector(selector)
    if (element) {
      sections[key] = element
    }
  })

  if (Object.keys(sections).length === 0) {
    return
  }

  Object.values(sections).forEach((section) => {
    section.remove()
  })

  // Re-append in the correct order
  order.forEach(key => {
    const section = sections[key]
    if (section) {
      footerInner.appendChild(section)
    }
  })
}

/**
 * Sets up portal link previews in the iframe
 */
export function setupPortalPreview(doc: Document) {
  const portalLinks = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href="#/portal/signup"], a[href="#/portal/signin"]')
  )

  if (!portalLinks.length || typeof document === 'undefined') {
    return
  }

  portalLinks.forEach((link) => {
    link.classList.add('gh-portal-close')
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const mode = link.getAttribute('href')?.includes('signup') ? 'signup' : 'signin'
      showPortalMock(mode === 'signup' ? 'signup' : 'signin')
    })
  })
}

/**
 * Sets up click handling for navigation within the preview
 */
export function setupPreviewNavigation(doc: Document, onNavigate?: (href: string) => boolean) {
  if (!onNavigate) {
    return
  }

  doc.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const target = event.target as HTMLElement | null
    const anchor = target?.closest('a')
    if (!anchor) {
      return
    }

    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#/portal')) {
      return
    }

    if (anchor.target && anchor.target.toLowerCase() === '_blank') {
      return
    }

    const handled = onNavigate(href)
    if (handled) {
      event.preventDefault()
    }
  })
}

export function setupSectionSelection(
  doc: Document,
  sectionIds: string[],
  onSelectSection?: (sectionId: string) => void
) {
  if (!onSelectSection || sectionIds.length === 0) {
    return () => {}
  }

  const entries = Array.from(new Set(sectionIds))
    .map((id) => ({
      id,
      selectors: (() => {
        const base = getSectionSelector(id)
        const escaped = escapeSectionId(id)
        const fallback = `[data-section-id="${escaped}"]`
        return Array.from(new Set([...base, fallback]))
      })()
    }))
    .filter((entry) => entry.selectors.length > 0)

  if (entries.length === 0) {
    return () => {}
  }

  ensureHighlightStyles(doc)

  const normalizeSectionId = (sectionId: string): string => {
    const lower = sectionId.toLowerCase()
    if (lower === 'footer_bar' || lower === 'footer-bar') {
      return 'footerBar'
    }
    if (lower === 'footer_signup' || lower === 'footer-signup') {
      return 'footerSignup'
    }
    return sectionId
  }

  const getSelectedSectionId = (): string | null => {
    const raw = doc.documentElement?.getAttribute(SELECTED_SECTION_ID_ATTRIBUTE)
    return raw ? normalizeSectionId(raw) : null
  }

  const resolveEventTargetElement = (event: Event): Element | null => {
    const maybePath = (event as unknown as { composedPath?: () => EventTarget[] }).composedPath
    const path = typeof maybePath === 'function' ? maybePath.call(event) : []
    for (const entry of path) {
      const node = entry as unknown as { nodeType?: number, closest?: (selector: string) => Element | null }
      if (node?.nodeType === 1 && typeof node.closest === 'function') {
        return entry as unknown as Element
      }
    }

    const target = event.target as unknown as { nodeType?: number, parentElement?: Element | null, closest?: (selector: string) => Element | null } | null
    if (target?.nodeType === 1 && typeof target.closest === 'function') {
      return target as unknown as Element
    }
    if (target?.parentElement) {
      return target.parentElement
    }
    return null
  }

  const findMatch = (target: Element | null): { id: string, element: Element } | null => {
    if (!target) return null
    const dataEl = target.closest('[data-section-id]')
    if (dataEl) {
      const attrId = dataEl.getAttribute('data-section-id')
      if (attrId) {
        return { id: attrId, element: dataEl }
      }
    }
    // Collect all matches, then pick the innermost (most specific) one
    const matches: { id: string, element: Element }[] = []
    for (const entry of entries) {
      for (const selector of entry.selectors) {
        const match = target.closest(selector)
        if (match) {
          matches.push({ id: entry.id, element: match })
          break // Only one match per entry
        }
      }
    }
    if (matches.length === 0) return null
    if (matches.length === 1) return matches[0]
    // Return innermost: the element that contains no other matched elements
    return matches.reduce((innermost, current) => {
      return current.element.contains(innermost.element) ? innermost : current
    })
  }

  let hoveredEl: Element | null = null
  let currentHoverId: string | null = null

  const clearHover = () => {
    if (!hoveredEl) return
    if (hoveredEl.classList.contains(SECTION_OVERLAY_CLASS)) {
      hoveredEl.remove()
    } else {
      hoveredEl.classList.remove(SECTION_HOVER_CLASS)
    }
    hoveredEl = null
    currentHoverId = null
  }

  const applyHover = (el: Element, sectionId: string) => {
    // Prevent re-applying if already hovering this section
    if (currentHoverId === sectionId) return

    clearHover()
    currentHoverId = sectionId

    const target = getHighlightTarget(sectionId, el)
    if (target.classList.contains(SECTION_HIGHLIGHT_CLASS)) {
      return
    }
    // Check if element has margins - if so, use overlay to include them
    const computedStyle = getComputedStyle(el)
    const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                       (parseFloat(computedStyle.marginBottom) || 0) > 0
    if ((target !== el && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
      hoveredEl = createOverlayForSection(target as HTMLElement, el, [SECTION_OVERLAY_CLASS, SECTION_HOVER_CLASS], hasMargins)
    } else {
      hoveredEl = target
      target.classList.add(SECTION_HOVER_CLASS)
    }
  }

  const handleClick = (event: MouseEvent) => {
    const target = resolveEventTargetElement(event)

    const match = findMatch(target)
    if (match) {
      const anchor = target?.closest('a[href]')
      if (anchor) {
        const selectedId = getSelectedSectionId()
        const clickedId = normalizeSectionId(match.id)
        if (clickedId !== selectedId) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      }
      onSelectSection(match.id)
    }
  }

  // Parent sections with children - don't hover these in preview, only their children
  // Users can select parents via sidebar
  const parentSections = new Set(['footer', 'announcement-bar'])

  // Check if point is within element's box INCLUDING its margins
  const isInMarginArea = (el: Element, x: number, y: number): boolean => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const marginTop = parseFloat(style.marginTop) || 0
    const marginBottom = parseFloat(style.marginBottom) || 0
    const expandedTop = rect.top - marginTop
    const expandedBottom = rect.bottom + marginBottom
    return x >= rect.left && x <= rect.right && y >= expandedTop && y <= expandedBottom
  }

  // Throttle pointermove to 50ms for performance (Puck pattern)
  const handlePointerMove = throttle((event: PointerEvent) => {
    const target = resolveEventTargetElement(event)
    const match = findMatch(target)
    if (!match) {
      clearHover()
      return
    }
    // For parent sections, check if we're in a child's margin area
    if (parentSections.has(match.id)) {
      // Check footerBar's margin area when inside footer
      if (match.id === 'footer') {
        const footerBar = doc.querySelector('.gh-footer-bar')
        if (footerBar && isInMarginArea(footerBar, event.clientX, event.clientY)) {
          if (currentHoverId !== 'footerBar') {
            applyHover(footerBar, 'footerBar')
          }
          return
        }
      }
      // Show hover for announcement-bar
      if (match.id === 'announcement-bar') {
        if (currentHoverId !== 'announcement-bar') {
          applyHover(match.element, 'announcement-bar')
        }
        return
      }
      clearHover()
      return
    }
    // Compare against ID to prevent overlay recreation loop
    if (match.id !== currentHoverId) {
      applyHover(match.element, match.id)
    }
  }, 50)

  const handlePointerLeave = () => {
    // Cancel any pending throttled calls to prevent stale hover
    handlePointerMove.cancel()
    clearHover()
  }

  doc.addEventListener('click', handleClick, true)
  doc.addEventListener('pointermove', handlePointerMove as unknown as EventListener, true)
  // Use multiple events for reliable hover clearing when leaving iframe
  doc.documentElement.addEventListener('pointerleave', handlePointerLeave)
  doc.documentElement.addEventListener('mouseleave', handlePointerLeave)
  if (doc.body) {
    doc.body.addEventListener('mouseleave', handlePointerLeave)
  }
  return () => {
    doc.removeEventListener('click', handleClick, true)
    doc.removeEventListener('pointermove', handlePointerMove as unknown as EventListener, true)
    doc.documentElement.removeEventListener('pointerleave', handlePointerLeave)
    doc.documentElement.removeEventListener('mouseleave', handlePointerLeave)
    if (doc.body) {
      doc.body.removeEventListener('mouseleave', handlePointerLeave)
    }
    handlePointerMove.cancel()
    clearHover()
  }
}

/**
 * Applies custom CSS to the preview iframe.
 */
export function applyCustomCss(doc: Document, css?: string) {
  const existing = doc.getElementById(CUSTOM_CSS_STYLE_ID)
  if (existing?.parentNode) {
    existing.parentNode.removeChild(existing)
  }

  const sanitized = sanitizeCustomCss(css)
  if (!sanitized) {
    return
  }

  const styleEl = doc.createElement('style')
  styleEl.id = CUSTOM_CSS_STYLE_ID
  styleEl.type = 'text/css'
  styleEl.appendChild(doc.createTextNode(sanitized))

  const target = doc.head || doc.body
  target?.appendChild(styleEl)
}

/**
 * Updates CSS color variables incrementally without full document re-render.
 * This prevents scroll jumps when only colors change.
 */
export function updateColorVariables(
  doc: Document,
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal'
) {
  const root = doc.documentElement
  if (!root) return

  const layoutWidth = pageLayout === 'narrow' ? '1000px' : '1200px'

  root.style.setProperty('--ghost-accent-color', accentColor)
  root.style.setProperty('--background-color', backgroundColor)
  root.style.setProperty('--container-width', layoutWidth)

  // Also update body background if needed
  if (doc.body) {
    doc.body.style.backgroundColor = backgroundColor
  }
}

/**
 * Injects rendered Handlebars output into the preview iframe and applies
 * all editor-driven customizations (hidden sections, custom CSS, portal mock).
 *
 * @param iframeRef - Reference to the iframe hosting the preview.
 * @param html - Rendered HTML string to write into the iframe.
 * @param options - Flags/configurations used during injection.
 */
export function injectHtmlIntoIframe(
  html: string,
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  options: InjectPreviewOptions
) {
  const iframe = iframeRef.current
  if (!iframe) return

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  // Save scroll position before any updates
  const scrollTop = doc.documentElement?.scrollTop || doc.body?.scrollTop || 0
  const scrollLeft = doc.documentElement?.scrollLeft || doc.body?.scrollLeft || 0

  // Always do a full document write (simple and reliable)
  doc.open()
  doc.write(html)
  doc.close()

  // Wait for iframe to fully load before manipulating DOM
  const applyPostProcessing = () => {
    ensurePreviewStyles(doc)
    applyCustomCss(doc, options.customCss)
    syncTemplateSections(doc, options.customSections ?? [])
    reorderTemplateInDOM(doc, options.templateOrder)
    reorderFooterInDOM(doc, options.footerOrder)
    setupPortalPreview(doc)
    setupPreviewNavigation(doc, options.onNavigate)
    applyHeaderCustomizations(doc, options.headerOptions)
    syncAnnouncementBars(doc, options.announcementBars ?? [])
    if (options.sectionIds && options.sectionIds.length && options.onSelectSection) {
      setupSectionSelection(doc, options.sectionIds, options.onSelectSection)
    }
    if (typeof options.selectedSectionId !== 'undefined') {
      highlightSection(doc, options.selectedSectionId ?? null)
    }
  }

  // Use DOMContentLoaded or readystatechange to ensure DOM is parsed
  if (doc.readyState === 'complete') {
    // Already loaded, apply immediately
    const win = doc.defaultView
    if (win) {
      win.requestAnimationFrame(applyPostProcessing)
    } else {
      applyPostProcessing()
    }
  } else {
    // Wait for load
    iframe.addEventListener('load', () => {
      const updatedDoc = iframe.contentDocument
      if (updatedDoc) {
        const win = updatedDoc.defaultView
        if (win) {
          win.requestAnimationFrame(applyPostProcessing)
        } else {
          applyPostProcessing()
        }
      }
    }, { once: true })
  }

  // Restore scroll position after content is loaded
  // Use multiple rAF frames and disable smooth scrolling for instant restoration
  if (scrollTop > 0 || scrollLeft > 0) {
    const win = doc.defaultView
    if (win) {
      const restoreScroll = () => {
        // Temporarily disable smooth scrolling
        const originalBehavior = doc.documentElement?.style.scrollBehavior
        if (doc.documentElement) {
          doc.documentElement.style.scrollBehavior = 'auto'
        }

        // Use scrollTo for more reliable restoration
        win.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: 'instant'
        })

        // Fallback for older browsers
        if (doc.documentElement) {
          doc.documentElement.scrollTop = scrollTop
          doc.documentElement.scrollLeft = scrollLeft
        }
        if (doc.body) {
          doc.body.scrollTop = scrollTop
          doc.body.scrollLeft = scrollLeft
        }

        // Restore original scroll behavior after a frame
        win.requestAnimationFrame(() => {
          if (doc.documentElement && originalBehavior !== undefined) {
            doc.documentElement.style.scrollBehavior = originalBehavior
          }
        })
      }

      // Wait for two animation frames to ensure content is painted
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(restoreScroll)
      })
    }
  }
}

/**
 * Sync announcement bars using engine-rendered HTML
 * Replaces any existing bars with newly rendered content.
 */
export function syncAnnouncementBars(doc: Document, bars: Array<{ id: string; html: string; hidden: boolean }>) {
  const styleId = 'section-style-announcement-bar'

  // Remove any existing bars (including the base theme partial).
  Array.from(doc.querySelectorAll<HTMLElement>('.announcement-bar')).forEach((bar) => {
    bar.remove()
  })

  const existingStyle = doc.getElementById(styleId)
  if (existingStyle) {
    existingStyle.remove()
  }

  if (!bars.length) {
    return
  }

  const parsedBars = bars
    .filter((bar) => typeof bar.html === 'string' && bar.html.length > 0)
    .map((bar) => {
      const template = doc.createElement('template')
      template.innerHTML = bar.html

      const children = Array.from(template.content.children)
      const styleElements = children.filter((child) => child.tagName === 'STYLE') as HTMLStyleElement[]
      const sectionElement = (children.find((child) =>
        child.tagName === 'SECTION' || child.classList?.contains('announcement-bar')
      ) ?? children.find((child) => child.tagName !== 'STYLE')) as HTMLElement | undefined

      if (!sectionElement) {
        return null
      }

      sectionElement.setAttribute('data-section-id', bar.id)
      sectionElement.dataset.sectionType = 'announcement-bar'
      sectionElement.dataset.sectionHidden = bar.hidden ? 'true' : 'false'
      sectionElement.setAttribute('aria-hidden', bar.hidden ? 'true' : 'false')

      return { ...bar, sectionElement, styleElements }
    })
    .filter((bar): bar is { id: string; html: string; hidden: boolean; sectionElement: HTMLElement; styleElements: HTMLStyleElement[] } => bar !== null)

  if (!parsedBars.length) {
    return
  }

  // Inject styles once (templates all share the same base CSS).
  const styleElements = parsedBars[0].styleElements
  if (styleElements.length > 0) {
    const combinedStyle = doc.createElement('style')
    combinedStyle.id = styleId
    combinedStyle.textContent = styleElements.map((s) => s.textContent).join('\n')
    doc.head.appendChild(combinedStyle)
  }

  // Insert before navigation, same as default.hbs.
  const nav = doc.querySelector<HTMLElement>('#gh-navigation, .gh-navigation')
  const viewport = doc.querySelector<HTMLElement>('.gh-viewport')

  if (nav && nav.parentNode) {
    // Insert in reverse order so first bar stays on top.
    for (let i = parsedBars.length - 1; i >= 0; i -= 1) {
      nav.parentNode.insertBefore(parsedBars[i].sectionElement, nav)
    }
    return
  }

  if (viewport) {
    for (let i = parsedBars.length - 1; i >= 0; i -= 1) {
      viewport.prepend(parsedBars[i].sectionElement)
    }
    return
  }

  for (let i = parsedBars.length - 1; i >= 0; i -= 1) {
    doc.body.prepend(parsedBars[i].sectionElement)
  }
}

// Portal mock helpers
function ensurePortalMock() {
  if (portalMockElement) {
    return portalMockElement
  }

  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-portal-mock', 'true')
  wrapper.style.cssText = `
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.45);
    z-index: 9999;
  `

  wrapper.innerHTML = `
    <div style="background: white; width: 360px; max-width: 92vw; border-radius: 18px; padding: 32px; box-shadow: 0 25px 65px rgba(15, 15, 15, 0.25); position: relative;">
      <button data-portal-close style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; cursor: pointer; color: #0f172a;">×</button>
      <header style="margin-bottom: 16px;">
        <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Ghost Portal</p>
        <h1 data-portal-title style="margin: 0; font-size: 28px; font-weight: 700; color: #111827;">Sign in</h1>
      </header>
      <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">Portal interactions are disabled in the editor, so this static preview shows what members see when they sign in.</p>
      <label style="display:block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">Email</label>
      <input type="email" placeholder="jamie@example.com" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 16px;" />
      <button data-portal-primary style="width: 100%; padding: 12px; border: none; border-radius: 999px; background-color: #fb6ade; color: white; font-weight: 600; font-size: 15px; cursor: not-allowed;">Continue</button>
      <div style="text-align: center; font-size: 14px; color: #475569; margin-top: 14px;">
        <span data-portal-helper>Don't have an account?</span>
        <button data-portal-switch style="background: none; border: none; color: #fb6ade; font-weight: 600; margin-left: 4px; cursor: pointer;">Sign up</button>
      </div>
    </div>
  `

  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) {
      hidePortalMock()
    }
  })

  wrapper.querySelector('[data-portal-close]')?.addEventListener('click', () => hidePortalMock())

  wrapper.querySelector('[data-portal-switch]')?.addEventListener('click', () => {
    const nextMode = wrapper.dataset.mode === 'signup' ? 'signin' : 'signup'
    showPortalMock(nextMode === 'signup' ? 'signup' : 'signin')
  })

  document.body.appendChild(wrapper)
  portalMockElement = wrapper as HTMLDivElement
  return portalMockElement
}

function showPortalMock(mode: 'signin' | 'signup') {
  if (typeof document === 'undefined') {
    return
  }

  const wrapper = ensurePortalMock()
  wrapper.dataset.mode = mode

  const title = wrapper.querySelector<HTMLElement>('[data-portal-title]')
  if (title) {
    title.textContent = mode === 'signup' ? 'Sign up' : 'Sign in'
  }

  const helper = wrapper.querySelector<HTMLElement>('[data-portal-helper]')
  if (helper) {
    helper.textContent = mode === 'signup' ? 'Already have an account?' : "Don't have an account?"
  }

  const switchButton = wrapper.querySelector<HTMLElement>('[data-portal-switch]')
  if (switchButton) {
    switchButton.textContent = mode === 'signup' ? 'Sign in' : 'Sign up'
  }

  const primaryButton = wrapper.querySelector<HTMLElement>('[data-portal-primary]')
  if (primaryButton) {
    primaryButton.textContent = mode === 'signup' ? 'Subscribe' : 'Continue'
  }

  wrapper.style.display = 'flex'
}

function hidePortalMock() {
  if (portalMockElement) {
    portalMockElement.style.display = 'none'
  }
}

// Section highlight styles
const SECTION_HIGHLIGHT_STYLE_ID = 'gh-editor-section-highlight'
const SECTION_HIGHLIGHT_CLASS = 'gh-editor-section-highlighted'
const SECTION_HOVER_CLASS = 'gh-editor-section-hover'
const SECTION_OVERLAY_CLASS = 'gh-editor-section-overlay'
const SECTION_HIGHLIGHT_COLOR = '#4dd831'
const SECTION_HOVER_COLOR = 'rgba(77, 216, 49, 0.6)'
const SELECTED_SECTION_ID_ATTRIBUTE = 'data-gh-editor-selected-section-id'
// Canonical footer ids (lowercase) for preview-only overlays
const FOOTER_SECTION_IDS = new Set(['footer', 'footerbar', 'footersignup'])

function ensureHighlightStyles(doc: Document) {
  let styleEl = doc.getElementById(SECTION_HIGHLIGHT_STYLE_ID) as HTMLStyleElement | null

  const css = `
    .${SECTION_OVERLAY_CLASS} {
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      border-radius: 0;
      z-index: 2;
    }
    .${SECTION_HIGHLIGHT_CLASS} {
      position: relative;
      z-index: 1;
      border-radius: 0;
      outline: 2px solid ${SECTION_HIGHLIGHT_COLOR} !important;
      outline-offset: -3px;
    }
    .${SECTION_HOVER_CLASS} {
      position: relative;
      z-index: 1;
      border-radius: 0;
      outline: 2px solid ${SECTION_HOVER_COLOR} !important;
      outline-offset: -3px;
    }
  `

  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = SECTION_HIGHLIGHT_STYLE_ID
    styleEl.type = 'text/css'
    styleEl.textContent = css
    const head = doc.head || doc.body
    head.appendChild(styleEl)
  }
}

function getHighlightTarget(sectionId: string, element: Element): Element {
  const normalized = sectionId.toLowerCase()
  if (FOOTER_SECTION_IDS.has(normalized)) {
    const footerRoot = element.closest('footer.gh-footer')
    if (footerRoot) {
      return footerRoot
    }
  }
  return element
}

function createOverlayForSection(
  container: HTMLElement | null,
  refElement: Element,
  classNames: string[],
  useViewportWidth = false
): HTMLElement {
  const doc = refElement.ownerDocument
  const overlay = doc.createElement('div')
  overlay.classList.add(...classNames)

  // Get computed margins to include them in the overlay
  const computedStyle = getComputedStyle(refElement)
  const marginTop = parseFloat(computedStyle.marginTop) || 0
  const marginBottom = parseFloat(computedStyle.marginBottom) || 0

  if (useViewportWidth || !container) {
    const refRect = refElement.getBoundingClientRect()
    const scrollTop = (doc.documentElement?.scrollTop ?? 0) || (doc.body?.scrollTop ?? 0)
    overlay.style.position = 'absolute'
    overlay.style.top = `${refRect.top + scrollTop - marginTop}px`
    overlay.style.left = '0'
    overlay.style.right = '0'
    overlay.style.width = '100%'
    overlay.style.pointerEvents = 'none'
    doc.body.appendChild(overlay)
    overlay.style.height = `${refRect.height + marginTop + marginBottom}px`
    return overlay
  }

  const containerRect = container.getBoundingClientRect()
  const refRect = refElement.getBoundingClientRect()
  const scrollTop = container.scrollTop ?? 0
  const top = refRect.top - containerRect.top + scrollTop - marginTop
  overlay.style.top = `${top}px`
  overlay.style.height = `${refRect.height + marginTop + marginBottom}px`
  overlay.style.position = 'absolute'
  overlay.style.left = '0'
  overlay.style.right = '0'
  overlay.style.pointerEvents = 'none'
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative'
  }
  container.appendChild(overlay)
  return overlay
}

/**
 * Scrolls to a section in the preview iframe without selecting or highlighting it.
 */
export function scrollToSection(doc: Document, sectionId: string | null) {
  if (!sectionId) return

  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) return

  const target = getHighlightTarget(sectionId, element)
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

export function highlightSection(
  doc: Document,
  sectionId: string | null,
  options?: { scroll?: boolean }
) {
  const shouldScroll = options?.scroll ?? true

  if (sectionId) {
    doc.documentElement?.setAttribute(SELECTED_SECTION_ID_ATTRIBUTE, sectionId)
  } else {
    doc.documentElement?.removeAttribute(SELECTED_SECTION_ID_ATTRIBUTE)
  }

  // Remove existing highlights
  const existing = doc.querySelectorAll(`.${SECTION_HIGHLIGHT_CLASS}, .${SECTION_OVERLAY_CLASS}`)
  existing.forEach((el) => {
    el.classList.remove(SECTION_HIGHLIGHT_CLASS)
    if (el.classList.contains(SECTION_OVERLAY_CLASS)) {
      el.remove()
    }
  })

  if (!sectionId) {
    return
  }

  // Ensure highlight styles are present
  ensureHighlightStyles(doc)

  // Find the section element
  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) {
    return
  }

  const target = getHighlightTarget(sectionId, element)

  // Check if element has margins - if so, use overlay to include them
  const computedStyle = getComputedStyle(element)
  const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                     (parseFloat(computedStyle.marginBottom) || 0) > 0

  // Add highlight class (use overlay for footer or sections with margins)
  if ((target !== element && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
    createOverlayForSection(target as HTMLElement, element, [SECTION_OVERLAY_CLASS, SECTION_HIGHLIGHT_CLASS], hasMargins)
  } else {
    target.classList.add(SECTION_HIGHLIGHT_CLASS)
  }

  // Scroll into view only when explicitly requested (e.g., new selection, not padding updates)
  if (shouldScroll) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }
}

/**
 * Highlights a section in the preview iframe on hover (from sidebar).
 * Uses a subtler highlight style than selection.
 *
 * @param doc - Document instance inside the preview iframe
 * @param sectionId - The section ID to highlight (null to clear hover highlight)
 */
export function highlightHoveredSection(
  doc: Document,
  sectionId: string | null
) {
  // Remove existing hover highlights (but not selection highlights)
  const existing = doc.querySelectorAll(`.${SECTION_HOVER_CLASS}`)
  existing.forEach((el) => {
    if (el.classList.contains(SECTION_OVERLAY_CLASS)) {
      el.remove()
    } else {
      el.classList.remove(SECTION_HOVER_CLASS)
    }
  })

  if (!sectionId) {
    return
  }

  // Ensure highlight styles are present
  ensureHighlightStyles(doc)

  // Find the section element
  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) {
    return
  }

  const target = getHighlightTarget(sectionId, element)

  // Don't apply hover if already selected
  if (target.classList.contains(SECTION_HIGHLIGHT_CLASS)) {
    return
  }

  // Check if element has margins - if so, use overlay to include them
  const computedStyle = getComputedStyle(element)
  const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                     (parseFloat(computedStyle.marginBottom) || 0) > 0

  // Add hover class (use overlay for footer or sections with margins)
  if ((target !== element && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
    createOverlayForSection(target as HTMLElement, element, [SECTION_OVERLAY_CLASS, SECTION_HOVER_CLASS], hasMargins)
  } else {
    target.classList.add(SECTION_HOVER_CLASS)
  }
}
