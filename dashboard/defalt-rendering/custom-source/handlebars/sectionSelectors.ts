export const TEMPLATE_CONTAINER_SELECTOR = '.gh-viewport'
export const FOOTER_ROOT_SELECTOR = 'footer.gh-footer.gh-outer'
export const FOOTER_INNER_SELECTOR = '.gh-footer-inner.gh-inner'

export type SectionSelector = string | string[]

export const TEMPLATE_SECTION_SELECTORS = {
  subheader: 'section.gh-header',
  featured: 'section.gh-featured',
  cta: 'section.gh-cta',
  main: ['section.gh-container.is-grid', 'section.gh-container.is-list']
} as const satisfies Record<string, SectionSelector>

export const FOOTER_SECTION_SELECTORS = {
  footerBar: '.gh-footer-bar',
  footerSignup: 'section.gh-footer-signup'
} as const

// Mapping from sidebar section IDs to DOM selectors
export const SECTION_ID_TO_SELECTOR: Record<string, SectionSelector> = {
  // Header sections
  'header': ['#gh-navigation', '.gh-navigation'],
  'announcement-bar': '.announcement-bar',
  'announcement': '.announcement-bar',
  // Template sections
  'subheader': TEMPLATE_SECTION_SELECTORS.subheader,
  'featured': TEMPLATE_SECTION_SELECTORS.featured,
  'cta': TEMPLATE_SECTION_SELECTORS.cta,
  'main': TEMPLATE_SECTION_SELECTORS.main,
  // Footer sections
  'footer': FOOTER_ROOT_SELECTOR,
  'footerBar': FOOTER_SECTION_SELECTORS.footerBar,
  'footer-bar': FOOTER_SECTION_SELECTORS.footerBar,
  'footerSignup': FOOTER_SECTION_SELECTORS.footerSignup,
  'footer-signup': FOOTER_SECTION_SELECTORS.footerSignup,
  // Page content
  'page': '.gh-article',
  'post': '.gh-article',
}

export type TemplateSectionKey = keyof typeof TEMPLATE_SECTION_SELECTORS
export type FooterSectionKey = keyof typeof FOOTER_SECTION_SELECTORS

export function toSelectorList(selector: SectionSelector | undefined): string[] {
  if (!selector) {
    return []
  }
  return Array.isArray(selector) ? selector : [selector]
}

/**
 * Gets the DOM selector(s) for a given section ID
 */
export function getSectionSelector(sectionId: string): string[] {
  // Check predefined selectors first
  const predefined = SECTION_ID_TO_SELECTOR[sectionId]
  if (predefined) {
    return toSelectorList(predefined)
  }
  // Fall back to custom section selector
  return [`[data-section-id="${sectionId}"]`]
}
