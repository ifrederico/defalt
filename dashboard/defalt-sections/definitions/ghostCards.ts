import {
  escapeHtml,
  sanitizeHexColor,
  sanitizeHref,
  type SectionDefinition
} from './sectionTypes.js'
import {
  formatInternalTag,
  toApiTagSlug,
  filterPagesByTag
} from '../utils/tagUtils.js'

export type GhostCardsCardConfig = {
  title: string
  description: string
  buttonText?: string
  buttonHref?: string
}

export type GhostCardsSectionConfig = {
  ghostPageTag: string
  heading: string
  subheading: string
  cards: GhostCardsCardConfig[]
  backgroundColor: string
  textColor: string
  cardBackgroundColor: string
  cardBorderColor: string
  buttonColor: string
  showHeader: boolean
  headerAlignment?: 'left' | 'center' | 'right'
  titleSize?: 'small' | 'normal' | 'large'
}

const DEFAULT_GHOST_CARD_HREFS = ['#ghost-card-one', '#ghost-card-two', '#ghost-card-three']
const INTERNAL_TAG_BASE = '#ghost-card'
const HIDE_TAG = '#cards-hide'

function normalizeTagValue(value: unknown, fallback: string) {
  const fallbackTag = formatInternalTag(fallback) || INTERNAL_TAG_BASE
  const sanitizedValue = formatInternalTag(value)
  return sanitizedValue || fallbackTag
}

export const ghostCardsDefinition: SectionDefinition<GhostCardsSectionConfig> = {
  id: 'ghostCards',
  label: 'Ghost cards',
  description: 'Display a three-card grid for featured posts or offers.',
  category: 'template',
  settingsSchema: [
    { type: 'text', id: 'heading', label: 'Heading', default: '' },
    { type: 'text', id: 'subheading', label: 'Subheading', default: '' },
    { type: 'text', id: 'ghostPageTag', label: 'Ghost page tag', default: INTERNAL_TAG_BASE, info: 'Tag to fetch cards from' },
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
    ghostPageTag: INTERNAL_TAG_BASE,
    heading: '',
    subheading: '',
    cards: DEFAULT_GHOST_CARD_HREFS.map((href) => ({
      title: '',
      description: '',
      buttonText: '',
      buttonHref: href
    })),
    backgroundColor: '#ffffff',
    textColor: '#151515',
    cardBackgroundColor: '#ffffff',
    cardBorderColor: '#e6e6e6',
    buttonColor: '#151515',
    showHeader: false,
    headerAlignment: 'center',
    titleSize: 'normal'
  }),
  renderHtml: (config, options) => {
    const paddingTop = Math.max(0, Math.round(options?.padding?.top ?? 32))
    const paddingBottom = Math.max(0, Math.round(options?.padding?.bottom ?? 32))
    const paddingLeft = Math.max(0, Math.round(options?.padding?.left ?? 0))
    const paddingRight = Math.max(0, Math.round(options?.padding?.right ?? 0))

    const headingValue = typeof config.heading === 'string' ? config.heading : ''
    const headingTrimmed = headingValue.trim()
    const subheadingValue = typeof config.subheading === 'string' ? config.subheading : ''
    const subheadingTrimmed = subheadingValue.trim()

    const backgroundColor = sanitizeHexColor(config.backgroundColor, '#ffffff')
    const textColor = sanitizeHexColor(config.textColor, '#151515')
    const cardBackgroundColor = sanitizeHexColor(config.cardBackgroundColor, '#ffffff')
    const cardBorderColor = sanitizeHexColor(config.cardBorderColor, '#e6e6e6')
    const buttonColor = sanitizeHexColor(config.buttonColor, '#151515')

    const sectionStyle = [
      `--gd-ghost-cards-padding-top: ${paddingTop}px`,
      `--gd-ghost-cards-padding-bottom: ${paddingBottom}px`,
      `--gd-ghost-cards-padding-left: ${paddingLeft}px`,
      `--gd-ghost-cards-padding-right: ${paddingRight}px`,
      `--gd-ghost-cards-background: ${backgroundColor}`,
      `--gd-ghost-cards-text: ${textColor}`,
      `--gd-ghost-cards-card-background: ${cardBackgroundColor}`,
      `--gd-ghost-cards-card-border: ${cardBorderColor}`,
      `--gd-ghost-cards-button-color: ${buttonColor}`
    ].join('; ')

    const shouldShowHeader = config.showHeader !== false

    const alignmentValue =
      config.headerAlignment === 'left' || config.headerAlignment === 'right' ? config.headerAlignment : 'center'
    const titleSizeValue = config.titleSize === 'small' || config.titleSize === 'large' ? config.titleSize : 'normal'
    const sectionClasses = [
      'gd-ghost-cards-section',
      shouldShowHeader ? '' : 'gd-ghost-cards-hide-header',
      alignmentValue === 'left'
        ? 'gd-ghost-cards-header-left'
        : alignmentValue === 'right'
          ? 'gd-ghost-cards-header-right'
          : 'gd-ghost-cards-header-center',
      `gd-ghost-title-${titleSizeValue}`
    ].filter(Boolean).join(' ')

    const resolvedTag = normalizeTagValue(config.ghostPageTag, INTERNAL_TAG_BASE)
    const apiTagSlug = toApiTagSlug(resolvedTag)
    const hideApiTagSlug = toApiTagSlug(HIDE_TAG)

    // Check for Ghost pages from API
    const ghostPages = options?.pages ?? []
    const matchingPages = filterPagesByTag(ghostPages, apiTagSlug, hideApiTagSlug)

    // If we have matching Ghost pages, render them
    if (matchingPages.length > 0) {
      const ghostCardsMarkup = matchingPages.slice(0, 3).map((page) => {
        const pageTitle = page.title || 'Untitled'
        const tagClasses = page.tags?.map(t => `tag-${t.slug}`).join(' ') || ''
        const hasImage = page.feature_image ? '' : 'no-image'

        return `
    <article class="gh-article post ${tagClasses} ${hasImage}">
        <header class="gh-article-header">
            <h1 class="gh-article-title is-title">${escapeHtml(pageTitle)}</h1>
        </header>
        <section class="gh-content is-body">
            ${page.html || ''}
        </section>
    </article>
      `.trim()
      }).join('\n')

      return `
        <section class="${sectionClasses} gh-outer" style="${sectionStyle}" data-section-type="ghost-cards">
          <div class="gh-inner">
            <div class="gd-ghost-cards-inner">
              ${ghostCardsMarkup}
            </div>
          </div>
        </section>
      `.trim()
    }

    // Fall back to manual cards or placeholder
    const cards =
      Array.isArray(config.cards) && config.cards.length > 0
        ? config.cards
        : DEFAULT_GHOST_CARD_HREFS.map((href) => ({ title: '', description: '', buttonText: '', buttonHref: href }))

    const cardsWithContent = cards.filter((card) => {
      const titleValue = typeof card.title === 'string' ? card.title : ''
      const descriptionValue = typeof card.description === 'string' ? card.description : ''
      const buttonValue = typeof card.buttonText === 'string' ? card.buttonText : ''
      return Boolean(titleValue.trim() || descriptionValue.trim() || buttonValue.trim())
    })

    const hasSectionContent = Boolean(headingTrimmed || subheadingTrimmed || cardsWithContent.length > 0)

    const pageTitleMarkup = shouldShowHeader
      ? `
        <header class="gh-article-header gd-ghost-placeholder-header">
          <h1 class="gh-article-title is-title">Page title</h1>
        </header>
      `.trim()
      : ''

    if (!hasSectionContent) {
      const placeholderTag = resolvedTag
      return `
        <section class="${sectionClasses} gh-outer" style="${sectionStyle}" data-section-type="ghost-cards">
          <div class="gh-inner">
            <div class="gd-ghost-cards-inner">
              ${pageTitleMarkup}
              <div class="gd-ghost-cards-placeholder" role="status" aria-live="polite">
                <p class="gd-ghost-cards-placeholder-title">Waiting for tagged pages</p>
                <p class="gd-ghost-cards-placeholder-copy">
                  Add the tag <code>${escapeHtml(placeholderTag)}</code> to a published page. To hide this section, add <code>${escapeHtml(HIDE_TAG)}</code> to that same page.
                </p>
              </div>
            </div>
          </div>
        </section>
      `.trim()
    }

    const cardsMarkup = cardsWithContent
      .map((card) => {
        const titleValue = typeof card.title === 'string' ? card.title : ''
        const titleTrimmed = titleValue.trim()
        const descriptionValue = typeof card.description === 'string' ? card.description : ''
        const descriptionTrimmed = descriptionValue.trim()
        const buttonValue = typeof card.buttonText === 'string' ? card.buttonText : ''
        const buttonTrimmed = buttonValue.trim()
        const buttonHrefValue = typeof card.buttonHref === 'string' ? card.buttonHref : ''
        const buttonHrefTrimmed = buttonHrefValue.trim()

        const sanitizedButtonHref = sanitizeHref(buttonHrefTrimmed || '#')
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
      <section class="${sectionClasses}" style="${sectionStyle}" data-section-type="ghost-cards">
        <div class="gh-inner">
          <div class="gd-ghost-cards-inner">
            ${pageTitleMarkup}
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
