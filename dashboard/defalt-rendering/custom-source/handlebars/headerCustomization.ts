import { TEMPLATE_SECTION_SELECTORS, FOOTER_SECTION_SELECTORS, FOOTER_ROOT_SELECTOR, toSelectorList } from './sectionSelectors'
type StickyCleanupWindow = Window & {
  __ghEditorStickyCleanup?: () => void
}

export type StickyHeaderMode = 'Always' | 'Scroll up' | 'Never'

export type HeaderCustomizationOptions = {
  stickyHeaderMode: StickyHeaderMode
  showSearch: boolean
  typographyCase: 'default' | 'uppercase'
  sectionPadding: Record<string, { top: number, bottom: number }>
  sectionMargins?: Record<string, { top?: number, bottom?: number }>
  subheaderStyle?: string
  showFeaturedPosts?: boolean
}

const STICKY_HEADER_STYLE_ID = 'gh-editor-sticky-header-style'
const SEARCH_TOGGLE_STYLE_ID = 'gh-editor-search-toggle-style'
const TYPOGRAPHY_STYLE_ID = 'gh-editor-typography-style'

const STICKY_HEADER_STYLES = `
  .gh-navigation:not(.is-open).is-sticky-always,
  .gh-navigation:not(.is-open).is-sticky-scroll-up {
    position: sticky;
    top: 0;
    z-index: 4000000;
  }

  .gh-navigation:not(.is-open).is-sticky-scroll-up {
    transition: transform 0.3s ease;
    will-change: transform;
  }

  .gh-navigation:not(.is-open).is-sticky-scroll-up.is-sticky-hidden {
    transform: translateY(-110%);
  }
`

const SEARCH_TOGGLE_STYLES = `
  .gh-search.is-hidden-by-editor {
    visibility: hidden !important;
    pointer-events: none !important;
  }
`

const TYPOGRAPHY_STYLES = `
  #gh-navigation.is-typography-uppercase .gh-navigation-brand,
  #gh-navigation.is-typography-uppercase .gh-navigation-brand a,
  #gh-navigation.is-typography-uppercase .gh-navigation-brand button,
  #gh-navigation.is-typography-uppercase .gh-navigation-menu,
  #gh-navigation.is-typography-uppercase .gh-navigation-menu a,
  #gh-navigation.is-typography-uppercase .gh-navigation-actions,
  #gh-navigation.is-typography-uppercase .gh-navigation-actions a,
  #gh-navigation.is-typography-uppercase .gh-navigation-actions button {
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`

const SECTION_PADDING_SELECTORS: Record<string, string[]> = {
  subheader: toSelectorList(TEMPLATE_SECTION_SELECTORS.subheader),
  main: [...toSelectorList(TEMPLATE_SECTION_SELECTORS.main)],
  footerBar: [FOOTER_SECTION_SELECTORS.footerBar],
  footerSignup: [FOOTER_SECTION_SELECTORS.footerSignup],
}

const BLOCK_PADDING_SECTIONS = new Set(['footerBar', 'subheader'])
const VARIABLE_PADDING_SECTIONS: Record<string, { top: string, bottom: string }> = {
  main: {
    top: '--defalt-main-padding-top',
    bottom: '--defalt-main-padding-bottom',
  },
}

const SECTION_MARGIN_SELECTORS: Record<string, string[]> = {
  footer: [FOOTER_ROOT_SELECTOR],
  footerBar: [FOOTER_SECTION_SELECTORS.footerBar],
  subheader: toSelectorList(TEMPLATE_SECTION_SELECTORS.subheader),
}

const VARIABLE_MARGIN_SECTIONS: Record<string, { top?: string, bottom?: string }> = {
  footerBar: {
    bottom: '--defalt-footer-bar-margin-bottom',
  },
}



function ensureStyleElement(doc: Document, id: string, css: string) {
  let styleEl = doc.getElementById(id) as HTMLStyleElement | null

  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = id
    styleEl.type = 'text/css'
    styleEl.appendChild(doc.createTextNode(css))
    if (doc.head) {
      doc.head.appendChild(styleEl)
    } else {
      doc.body.appendChild(styleEl)
    }
  } else if (styleEl.textContent !== css) {
    styleEl.textContent = css
  }

  return styleEl
}

function applySearchVisibility(doc: Document, showSearch: boolean) {
  const searchButtons = Array.from(
    doc.querySelectorAll<HTMLButtonElement>('button.gh-search.gh-icon-button')
  )

  if (!searchButtons.length) {
    return
  }

  ensureStyleElement(doc, SEARCH_TOGGLE_STYLE_ID, SEARCH_TOGGLE_STYLES)

  searchButtons.forEach((button) => {
    if (showSearch) {
      button.classList.remove('is-hidden-by-editor')
      button.removeAttribute('data-editor-hidden-search')
    } else {
      button.classList.add('is-hidden-by-editor')
      button.setAttribute('data-editor-hidden-search', 'true')
    }
  })
}

function applyStickyHeaderBehavior(doc: Document, mode: StickyHeaderMode) {
  const header = doc.getElementById('gh-navigation')
  const win = doc.defaultView as StickyCleanupWindow | null

  if (!header || !win) {
    return
  }

  if (typeof win.__ghEditorStickyCleanup === 'function') {
    win.__ghEditorStickyCleanup()
  }

  header.classList.remove('is-sticky-always', 'is-sticky-scroll-up', 'is-sticky-hidden')
  doc.documentElement.style.scrollPaddingTop = ''

  if (mode === 'Never') {
    win.__ghEditorStickyCleanup = undefined
    return
  }

  ensureStyleElement(doc, STICKY_HEADER_STYLE_ID, STICKY_HEADER_STYLES)

  const headerHeight = header.getBoundingClientRect().height
  if (headerHeight > 0) {
    doc.documentElement.style.scrollPaddingTop = `${Math.round(headerHeight)}px`
  }

  if (mode === 'Always') {
    header.classList.add('is-sticky-always')
    win.__ghEditorStickyCleanup = () => {
      header.classList.remove('is-sticky-always')
      doc.documentElement.style.scrollPaddingTop = ''
    }
    return
  }

  header.classList.add('is-sticky-scroll-up')
  header.classList.remove('is-sticky-hidden')

  let lastScrollY = win.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0
  const threshold = Math.max(headerHeight || 0, 80)

  const handleScroll = () => {
    const currentScrollY = win.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0
    const isScrollingDown = currentScrollY > lastScrollY
    const shouldHide = currentScrollY > threshold && isScrollingDown

    if (shouldHide) {
      header.classList.add('is-sticky-hidden')
    } else {
      header.classList.remove('is-sticky-hidden')
    }

    lastScrollY = currentScrollY
  }

  const handleResize = () => {
    header.classList.remove('is-sticky-hidden')
    lastScrollY = win.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0
  }

  win.addEventListener('scroll', handleScroll, { passive: true })
  win.addEventListener('resize', handleResize, { passive: true })

  win.__ghEditorStickyCleanup = () => {
    win.removeEventListener('scroll', handleScroll)
    win.removeEventListener('resize', handleResize)
    header.classList.remove('is-sticky-scroll-up', 'is-sticky-hidden')
    doc.documentElement.style.scrollPaddingTop = ''
  }

  handleScroll()
}

function applySectionPadding(doc: Document, paddingMap: Record<string, { top: number, bottom: number }>) {
  if (!paddingMap) {
    return
  }

  Object.entries(paddingMap).forEach(([key, padding]) => {
    const selectors = SECTION_PADDING_SELECTORS[key]
    if (!selectors || selectors.length === 0) {
      return
    }

    const top = Math.max(0, padding?.top ?? 0)
    const bottom = Math.max(0, padding?.bottom ?? 0)
    const isBlockMode = BLOCK_PADDING_SECTIONS.has(key)
    const blockValue = top || bottom
    const variableConfig = VARIABLE_PADDING_SECTIONS[key]

    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll<HTMLElement>(selector)
      elements.forEach((element) => {
        if (variableConfig) {
          element.style.setProperty(variableConfig.top, `${top}px`)
          element.style.setProperty(variableConfig.bottom, `${bottom}px`)
          element.style.paddingTop = `${top}px`
          element.style.paddingBottom = `${bottom}px`
          element.style.removeProperty('padding-block')
        } else if (isBlockMode) {
          element.style.removeProperty('padding-top')
          element.style.removeProperty('padding-bottom')
          element.style.setProperty('padding-block', `${blockValue}px`)
        } else {
          element.style.paddingTop = `${top}px`
          element.style.paddingBottom = `${bottom}px`
          element.style.removeProperty('padding-block')
        }
      })
    })
  })

  Object.entries(SECTION_PADDING_SELECTORS).forEach(([key, selectors]) => {
    if (paddingMap[key]) {
      return
    }
    const variableConfig = VARIABLE_PADDING_SECTIONS[key]
    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll<HTMLElement>(selector)
      elements.forEach((element) => {
        element.style.removeProperty('padding-top')
        element.style.removeProperty('padding-bottom')
        element.style.removeProperty('padding-block')
        if (variableConfig) {
          element.style.removeProperty(variableConfig.top)
          element.style.removeProperty(variableConfig.bottom)
        }
      })
    })
  })
}

function applySectionMargins(doc: Document, marginMap: Record<string, { top?: number, bottom?: number }>) {
  if (!marginMap) {
    return
  }

  Object.entries(SECTION_MARGIN_SELECTORS).forEach(([key, selectors]) => {
    const margins = marginMap[key]
    if (!margins) {
      return
    }
    const variableConfig = VARIABLE_MARGIN_SECTIONS[key]
    const top = Math.max(0, margins?.top ?? 0)
    const bottom = Math.max(0, margins?.bottom ?? 0)
    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll<HTMLElement>(selector)
      elements.forEach((element) => {
        if (margins?.top !== undefined) {
          if (variableConfig?.top) {
            element.style.setProperty(variableConfig.top, `${top}px`)
          }
          element.style.marginTop = `${top}px`
        } else {
          if (variableConfig?.top) {
            element.style.removeProperty(variableConfig.top)
          }
          element.style.removeProperty('margin-top')
        }

        if (margins?.bottom !== undefined) {
          if (variableConfig?.bottom) {
            element.style.setProperty(variableConfig.bottom, `${bottom}px`)
          }
          element.style.marginBottom = `${bottom}px`
        } else {
          if (variableConfig?.bottom) {
            element.style.removeProperty(variableConfig.bottom)
          }
          element.style.removeProperty('margin-bottom')
        }
      })
    })
  })

  Object.entries(SECTION_MARGIN_SELECTORS).forEach(([key, selectors]) => {
    if (marginMap[key]) {
      return
    }
    const variableConfig = VARIABLE_MARGIN_SECTIONS[key]
    selectors.forEach((selector) => {
      const elements = doc.querySelectorAll<HTMLElement>(selector)
      elements.forEach((element) => {
        if (variableConfig?.top) {
          element.style.removeProperty(variableConfig.top)
        }
        element.style.removeProperty('margin-top')
        if (variableConfig?.bottom) {
          element.style.removeProperty(variableConfig.bottom)
        }
        element.style.removeProperty('margin-bottom')
      })
    })
  })
}

function applyTypographyCase(doc: Document, typographyCase: 'default' | 'uppercase') {
  const header = doc.getElementById('gh-navigation')
  if (!header) {
    return
  }

  if (typographyCase === 'uppercase') {
    ensureStyleElement(doc, TYPOGRAPHY_STYLE_ID, TYPOGRAPHY_STYLES)
    header.classList.add('is-typography-uppercase')
  } else {
    header.classList.remove('is-typography-uppercase')
  }
}

export function applyHeaderCustomizations(doc: Document, options: HeaderCustomizationOptions) {
  applySearchVisibility(doc, options.showSearch)
  applyStickyHeaderBehavior(doc, options.stickyHeaderMode)
  applyTypographyCase(doc, options.typographyCase)
  const basePadding = options.sectionPadding ? { ...options.sectionPadding } : {}
  const subscribeEnabled = options.subheaderStyle === 'Landing' || options.subheaderStyle === 'Search'
  applySectionPadding(doc, basePadding)
  applySectionMargins(doc, options.sectionMargins ?? {})
  const hideCta = !subscribeEnabled
  applyCtaVisibility(doc, hideCta)
  // Featured posts positioning is now handled by template generation, no DOM manipulation needed
}

function applyCtaVisibility(doc: Document, hide: boolean) {
  const cta = doc.querySelector<HTMLElement>('.gh-cta')
  if (!cta) {
    return
  }

  if (hide) {
    cta.dataset.editorHiddenCta = 'true'
    if (cta.parentElement) {
      cta.parentElement.removeChild(cta)
    } else {
      cta.remove()
    }
  } else {
    if (cta.dataset.editorHiddenCta) {
      delete cta.dataset.editorHiddenCta
    }
    cta.style.removeProperty('display')
  }
}
