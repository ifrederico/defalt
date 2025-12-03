import {
  escapeHtml,
  sanitizeHexColor,
  sanitizeHref,
  type SectionDefinition,
  type PreviewPageData
} from './sectionTypes.js'
import {
  formatInternalTag,
  toApiTagSlug,
  findPageByTag
} from '../utils/tagUtils.js'

export type GhostGridCardConfig = {
  title: string
  description: string
  buttonText?: string
  buttonHref?: string
}

export type GhostGridSectionConfig = {
  heading: string
  subheading: string
  leftColumnTag: string
  rightColumnTag: string
  cards: GhostGridCardConfig[]
  backgroundColor: string
  textColor: string
  cardBackgroundColor: string
  cardBorderColor: string
  buttonColor: string
  showHeader: boolean
  headerAlignment?: 'left' | 'center' | 'right'
  titleSize?: 'small' | 'normal' | 'large'
  stackOnMobile?: boolean
  columnGap?: number
}

const DEFAULT_LEFT_TAG = '#ghost-grid-1'
const DEFAULT_RIGHT_TAG = '#ghost-grid-2'
const HIDE_TAG = '#grid-hide'

const DEFAULT_GHOST_GRID_CARDS: GhostGridCardConfig[] = [
  { title: '', description: '', buttonText: '', buttonHref: '' },
  { title: '', description: '', buttonText: '', buttonHref: '' }
]

export const ghostGridDefinition: SectionDefinition<GhostGridSectionConfig> = {
  id: 'ghostGrid',
  label: 'Ghost grid',
  description: 'Show two Ghost pages side-by-side as feature cards.',
  category: 'template',
  settingsSchema: [
    { type: 'text', id: 'heading', label: 'Heading', default: '' },
    { type: 'text', id: 'subheading', label: 'Subheading', default: '' },
    { type: 'text', id: 'leftColumnTag', label: 'Left column tag', default: DEFAULT_LEFT_TAG, info: 'Tag for left column page' },
    { type: 'text', id: 'rightColumnTag', label: 'Right column tag', default: DEFAULT_RIGHT_TAG, info: 'Tag for right column page' },
    { type: 'checkbox', id: 'showHeader', label: 'Show heading', default: false },
    {
      type: 'select',
      id: 'headerAlignment',
      label: 'Heading alignment',
      default: 'center',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ]
    },
    {
      type: 'select',
      id: 'titleSize',
      label: 'Heading size',
      default: 'normal',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Normal', value: 'normal' },
        { label: 'Large', value: 'large' }
      ]
    },
    {
      type: 'range',
      id: 'columnGap',
      label: 'Column gap',
      min: 0,
      max: 100,
      step: 1,
      default: 20
    },
    { type: 'checkbox', id: 'stackOnMobile', label: 'Stack on mobile', default: true },
    { type: 'color', id: 'backgroundColor', label: 'Background', default: '#ffffff' },
    { type: 'color', id: 'textColor', label: 'Text color', default: '#151515' },
    { type: 'color', id: 'cardBackgroundColor', label: 'Card background', default: '#ffffff' },
    { type: 'color', id: 'cardBorderColor', label: 'Card border', default: '#e6e6e6' },
    { type: 'color', id: 'buttonColor', label: 'Button color', default: '#151515' }
  ],
  blocksSchema: [
    {
      type: 'card',
      name: 'Card',
      limit: 2,
      settings: [
        { type: 'text', id: 'title', label: 'Title', default: '' },
        { type: 'textarea', id: 'description', label: 'Description', default: '' },
        { type: 'text', id: 'buttonText', label: 'Button label', default: '' },
        { type: 'url', id: 'buttonHref', label: 'Button link', default: '' }
      ]
    }
  ],
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32, left: 0, right: 0 },
  usesUnifiedPadding: false,
  createConfig: () => ({
    heading: '',
    subheading: '',
    leftColumnTag: DEFAULT_LEFT_TAG,
    rightColumnTag: DEFAULT_RIGHT_TAG,
    cards: DEFAULT_GHOST_GRID_CARDS.map((card) => ({ ...card })),
    backgroundColor: '#ffffff',
    textColor: '#151515',
    cardBackgroundColor: '#ffffff',
    cardBorderColor: '#e6e6e6',
    buttonColor: '#151515',
    showHeader: false,
    headerAlignment: 'center',
    titleSize: 'normal',
    stackOnMobile: true,
    columnGap: 20
  }),
  renderHtml: (config, options) => {
    const paddingTop = Math.max(0, Math.round(options?.padding?.top ?? 32))
    const paddingBottom = Math.max(0, Math.round(options?.padding?.bottom ?? 32))
    const paddingLeft = Math.max(0, Math.round(options?.padding?.left ?? 0))
    const paddingRight = Math.max(0, Math.round(options?.padding?.right ?? 0))

    const headingTrimmed = typeof config.heading === 'string' ? config.heading.trim() : ''
    const subheadingTrimmed = typeof config.subheading === 'string' ? config.subheading.trim() : ''

    const cards = Array.isArray(config.cards) && config.cards.length > 0 ? config.cards.slice(0, 2) : DEFAULT_GHOST_GRID_CARDS

    const backgroundColor = sanitizeHexColor(config.backgroundColor, '#ffffff')
    const textColor = sanitizeHexColor(config.textColor, '#151515')
    const cardBackgroundColor = sanitizeHexColor(config.cardBackgroundColor, '#ffffff')
    const cardBorderColor = sanitizeHexColor(config.cardBorderColor, '#e6e6e6')
    const buttonColor = sanitizeHexColor(config.buttonColor, '#151515')

    const stackOnMobile = config.stackOnMobile !== false
    const columnGapValue = (() => {
      const numericGap = typeof config.columnGap === 'number' && Number.isFinite(config.columnGap) ? config.columnGap : 20
      return Math.max(0, Math.min(100, Math.round(numericGap)))
    })()

    const sectionStyle = [
      `--gd-ghost-cards-padding-top: ${paddingTop}px`,
      `--gd-ghost-cards-padding-bottom: ${paddingBottom}px`,
      `--gd-ghost-cards-padding-left: ${paddingLeft}px`,
      `--gd-ghost-cards-padding-right: ${paddingRight}px`,
      `--gd-ghost-cards-background: ${backgroundColor}`,
      `--gd-ghost-cards-text: ${textColor}`,
      `--gd-ghost-cards-card-background: ${cardBackgroundColor}`,
      `--gd-ghost-cards-card-border: ${cardBorderColor}`,
      `--gd-ghost-cards-button-color: ${buttonColor}`,
      `--gd-ghost-grid-gap: ${columnGapValue}px`
    ].join('; ')

    const shouldShowHeader = config.showHeader !== false

    // Get configurable tags
    const leftTag = formatInternalTag(config.leftColumnTag) || DEFAULT_LEFT_TAG
    const rightTag = formatInternalTag(config.rightColumnTag) || DEFAULT_RIGHT_TAG

    // Check for Ghost pages from API
    const ghostPages = options?.pages ?? []
    const leftApiTagSlug = toApiTagSlug(leftTag)
    const rightApiTagSlug = toApiTagSlug(rightTag)
    const hideApiTagSlug = toApiTagSlug(HIDE_TAG)

    const leftPage = findPageByTag(ghostPages, leftApiTagSlug, hideApiTagSlug)
    const rightPage = findPageByTag(ghostPages, rightApiTagSlug, hideApiTagSlug)

    const alignmentValue =
      config.headerAlignment === 'left' || config.headerAlignment === 'right' ? config.headerAlignment : 'center'
    const titleSizeValue = config.titleSize === 'small' || config.titleSize === 'large' ? config.titleSize : 'normal'
    const sectionClasses = [
      'gd-ghost-cards-section',
      config.showHeader === false ? 'gd-ghost-cards-hide-header' : '',
      alignmentValue === 'left'
        ? 'gd-ghost-cards-header-left'
        : alignmentValue === 'right'
          ? 'gd-ghost-cards-header-right'
          : 'gd-ghost-cards-header-center',
      `gd-ghost-title-${titleSizeValue}`,
      stackOnMobile ? '' : 'gd-ghost-grid-no-stack'
    ].filter(Boolean).join(' ')

    // If we have Ghost pages, render them
    if (leftPage || rightPage) {
      const renderColumn = (page: PreviewPageData | undefined, placeholderTag: string) => {
        if (!page) {
          return `
            <div class="gd-ghost-grid-placeholder-column">
              <div class="gd-ghost-grid-placeholder-card">
                <p class="gd-ghost-grid-placeholder-title">Column placeholder</p>
                <p class="gd-ghost-grid-placeholder-copy">
                  Add tag <code>${escapeHtml(placeholderTag)}</code> to a page.
                </p>
              </div>
            </div>
          `.trim()
        }
        const pageTitle = page.title || 'Untitled'
        const tagClasses = page.tags?.map(t => `tag-${t.slug}`).join(' ') || ''
        const hasImage = page.feature_image ? '' : 'no-image'
        return `
          <article class="gh-article post ${tagClasses} ${hasImage}">
            ${shouldShowHeader ? `
            <header class="gh-article-header">
              <h1 class="gh-article-title is-title">${escapeHtml(pageTitle)}</h1>
            </header>` : ''}
            <section class="gh-content is-body">
              ${page.html || ''}
            </section>
          </article>
        `.trim()
      }

      return `
        <section class="${sectionClasses} gh-outer" style="${sectionStyle}" data-section-type="ghost-grid">
          <div class="gh-inner">
            <div class="gd-ghost-cards-inner">
              <div class="gd-ghost-cards-grid">
                ${renderColumn(leftPage, leftTag)}
                ${renderColumn(rightPage, rightTag)}
              </div>
            </div>
          </div>
        </section>
      `.trim()
    }

    // Fall back to manual cards or placeholder
    const cardsWithContent = cards.filter((card) => {
      const titleValue = typeof card.title === 'string' ? card.title : ''
      const descriptionValue = typeof card.description === 'string' ? card.description : ''
      const buttonValue = typeof card.buttonText === 'string' ? card.buttonText : ''
      return Boolean(titleValue.trim() || descriptionValue.trim() || buttonValue.trim())
    })

    const hasSectionContent = Boolean(headingTrimmed || subheadingTrimmed || cardsWithContent.length > 0)

    const columnHeader = shouldShowHeader
      ? `
        <header class="gh-article-header gd-ghost-placeholder-header">
          <h1 class="gh-article-title is-title">Page title</h1>
        </header>
      `.trim()
      : ''

    if (!hasSectionContent) {
      return `
        <section class="${sectionClasses} gh-outer" style="${sectionStyle}" data-section-type="ghost-grid">
          <div class="gh-inner">
            <div class="gd-ghost-cards-inner">
              <div class="gd-ghost-grid-placeholder" role="status" aria-live="polite">
                <div class="gd-ghost-grid-placeholder-column">
                  ${columnHeader}
                  <div class="gd-ghost-grid-placeholder-card">
                    <p class="gd-ghost-grid-placeholder-title">Left column</p>
                    <p class="gd-ghost-grid-placeholder-copy">
                      Highlight a published page tagged <code>${escapeHtml(leftTag)}</code>.
                    </p>
                  </div>
                </div>
                <div class="gd-ghost-grid-placeholder-column">
                  ${columnHeader}
                  <div class="gd-ghost-grid-placeholder-card">
                    <p class="gd-ghost-grid-placeholder-title">Right column</p>
                    <p class="gd-ghost-grid-placeholder-copy">
                      Highlight a published page tagged <code>${escapeHtml(rightTag)}</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      `.trim()
    }

    const cardsMarkup = cardsWithContent
      .map((card) => {
        const titleTrimmed = typeof card.title === 'string' ? card.title.trim() : ''
        const descriptionTrimmed = typeof card.description === 'string' ? card.description.trim() : ''
        const buttonTrimmed = typeof card.buttonText === 'string' ? card.buttonText.trim() : ''
        const buttonHrefValue = typeof card.buttonHref === 'string' ? card.buttonHref.trim() : ''
        const sanitizedButtonHref = sanitizeHref(buttonHrefValue || '#')

        const titleMarkup = titleTrimmed ? `<h3 class="gd-ghost-card-title">${escapeHtml(titleTrimmed)}</h3>` : ''
        const descriptionMarkup = descriptionTrimmed
          ? `<p class="gd-ghost-card-description">${escapeHtml(descriptionTrimmed)}</p>`
          : ''
        const buttonMarkup = buttonTrimmed
          ? `<a href="${sanitizedButtonHref}" class="gd-ghost-card-button">${escapeHtml(buttonTrimmed)}</a>`
          : ''

        return `
        <article class="gd-ghost-card">
          <div class="gd-ghost-card-body">
            ${titleMarkup}
            ${descriptionMarkup}
            ${buttonMarkup}
          </div>
        </article>
      `.trim()
      })
      .join('')

    const headingMarkup = headingTrimmed ? `<h2 class="gd-ghost-cards-title">${escapeHtml(headingTrimmed)}</h2>` : ''
    const subheadingMarkup = subheadingTrimmed
      ? `<p class="gd-ghost-cards-subtitle">${escapeHtml(subheadingTrimmed)}</p>`
      : ''

    return `
      <section class="${sectionClasses}" style="${sectionStyle}" data-section-type="ghost-grid">
        <div class="gh-inner">
          <div class="gd-ghost-cards-inner">
            <div class="gd-ghost-cards-container">
              <div class="gd-ghost-cards-intro">
                ${headingMarkup}
                ${subheadingMarkup}
              </div>
              <div class="gd-ghost-cards-grid">
                ${cardsMarkup}
              </div>
            </div>
          </div>
        </div>
      </section>
    `.trim()
  }
}
