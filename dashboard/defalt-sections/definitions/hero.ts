import {
  escapeHtml,
  sanitizeHref,
  sanitizeHexColor,
  type SectionDefinition
} from './sectionTypes.js'

export type HeroSectionConfig = {
  ghostPageTag: string
  placeholder: {
    title: string
    description: string
    imageUrl?: string
    buttonText?: string
    buttonHref?: string
  }
  imagePosition?: 'background' | 'left' | 'right'
  contentAlignment?: 'left' | 'center' | 'right'
  contentWidth?: 'regular' | 'wide' | 'full'
  heightMode?: 'regular' | 'expand'
  backgroundColor: string
  buttonColor: string
  buttonTextColor: string
  buttonBorderRadius?: number
  cardBorderRadius?: number
  showButton: boolean
}

const HERO_PLACEHOLDER_SAMPLE = {
  title: 'Enter heading text',
  description: 'Enter subheading text',
  buttonText: 'Add button text',
  buttonHref: ''
}

export const heroDefinition: SectionDefinition<HeroSectionConfig> = {
  id: 'hero',
  label: 'Hero',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32 },
  usesUnifiedPadding: false,
  createConfig: () => ({
    ghostPageTag: 'hero-preview',
    placeholder: {
      title: '',
      description: '',
      buttonText: '',
      buttonHref: ''
    },
    imagePosition: 'background',
    contentAlignment: 'center',
    contentWidth: 'full',
    heightMode: 'regular',
    backgroundColor: '#000000',
    buttonColor: '#ffffff',
    buttonTextColor: '#151515',
    buttonBorderRadius: 3,
    cardBorderRadius: 24,
    showButton: true
  }),
  renderHtml: (config, options) => {
    const placeholder = config.placeholder ?? {
      title: '',
      description: '',
      buttonText: '',
      buttonHref: '#latest'
    }
    const titleValue = typeof placeholder.title === 'string' ? placeholder.title : ''
    const titleTrimmed = titleValue.trim()
    const descriptionValue = typeof placeholder.description === 'string' ? placeholder.description : ''
    const descriptionTrimmed = descriptionValue.trim()
    const buttonValue = typeof placeholder.buttonText === 'string' ? placeholder.buttonText : ''
    const buttonTrimmed = buttonValue.trim()
    const buttonHrefValue = typeof placeholder.buttonHref === 'string' ? placeholder.buttonHref : ''
    const buttonHrefTrimmed = buttonHrefValue.trim()
    const alignmentClass =
      config.contentAlignment === 'left'
        ? 'gd-align-left'
        : config.contentAlignment === 'right'
          ? 'gd-align-right'
          : 'gd-align-center'
    const widthClass = config.contentWidth === 'regular' ? 'gd-width-regular' : 'gd-width-full'
    const heightMode = config.heightMode === 'expand' ? 'expand' : 'regular'
    const innerPadding = heightMode === 'expand' ? 92 : 64
    const paddingTop = Math.max(0, Math.round(options?.padding?.top ?? 32))
    const paddingBottom = Math.max(0, Math.round(options?.padding?.bottom ?? 32))
    const backgroundColor = sanitizeHexColor(config.backgroundColor, '#000000')
    const buttonColor = sanitizeHexColor(config.buttonColor, '#ffffff')
    const buttonTextColor = sanitizeHexColor(config.buttonTextColor, '#151515')
    const cardRadiusRaw = config.cardBorderRadius ?? config.buttonBorderRadius
    const cardBorderRadius =
      typeof cardRadiusRaw === 'number' && Number.isFinite(cardRadiusRaw)
        ? Math.max(0, Math.min(96, Math.round(cardRadiusRaw)))
        : 24
    const displayTitle = titleTrimmed || HERO_PLACEHOLDER_SAMPLE.title
    const displayDescription = descriptionTrimmed || HERO_PLACEHOLDER_SAMPLE.description
    const displayButtonText = buttonTrimmed || HERO_PLACEHOLDER_SAMPLE.buttonText
    const fallbackButtonHref = 'https://example.com'
    const displayButtonHref = buttonHrefTrimmed.length > 0 ? buttonHrefTrimmed : fallbackButtonHref
    const buttonVisible = config.showButton !== false && Boolean(displayButtonText)

    const headingMarkup = displayTitle
      ? `
            <h2 class="gd-hero-heading${titleTrimmed ? '' : ' gd-hero-placeholder'}"><span style="white-space: pre-wrap;">${escapeHtml(displayTitle)}</span></h2>
          `
      : ''

    const subheadingMarkup = displayDescription
      ? `
            <p class="gd-hero-subheading${descriptionTrimmed ? '' : ' gd-hero-placeholder'}"><span style="white-space: pre-wrap;">${escapeHtml(displayDescription)}</span></p>
          `
      : ''

    const buttonMarkup = displayButtonText
      ? `
            <a href="${sanitizeHref(displayButtonHref || '#')}" class="gd-hero-button${buttonTrimmed ? '' : ' gd-hero-placeholder'}">${escapeHtml(displayButtonText)}</a>
          `
      : ''

    const effectiveCardBorderRadius = widthClass === 'gd-width-full' ? 0 : cardBorderRadius

    const sectionPaddingStyle = [
      `--gd-hero-padding-top: ${paddingTop}px`,
      `--gd-hero-padding-bottom: ${paddingBottom}px`,
      `--gd-hero-card-radius: ${effectiveCardBorderRadius}px`,
      `border-radius: ${effectiveCardBorderRadius}px`
    ].join('; ')

    const cardStyle = [
      `--gd-hero-background: ${backgroundColor}`,
      `--gd-hero-inner-padding-top: ${innerPadding}px`,
      `--gd-hero-inner-padding-bottom: ${innerPadding}px`,
      `--gd-hero-card-radius: ${effectiveCardBorderRadius}px`,
      `--gd-hero-button-color: ${buttonColor}`,
      `--gd-hero-button-text-color: ${buttonTextColor}`,
      `--gd-hero-button-radius: 3px`,
      `border-radius: ${effectiveCardBorderRadius}px`
    ].join('; ')

    return `
      <section class="gd-hero-section ${widthClass === 'gd-width-regular' ? 'gd-hero-section-regular' : ''} gh-hero" style="${sectionPaddingStyle}" data-section-id="${escapeHtml(config.ghostPageTag)}">
        <div class="gd-hero-card" style="${cardStyle}">
          <div class="gd-hero-content ${alignmentClass} ${widthClass}">
            ${headingMarkup}
            ${subheadingMarkup}
            ${buttonVisible ? buttonMarkup : ''}
          </div>
        </div>
      </section>
    `.trim()
  }
}
