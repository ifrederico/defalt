import {
  escapeHtml,
  type SectionDefinition
} from './sectionTypes.js'
import {
  formatInternalTag,
  toApiTagSlug,
  findPageByTag
} from '../utils/tagUtils.js'

export type ImageWithTextSectionConfig = {
  ghostPageTag: string
  imagePosition: 'left' | 'right'
  showHeader: boolean
  headerAlignment: 'left' | 'center' | 'right'
  aspectRatio: 'default' | '1:1' | '3:4' | '4:3' | '16:9' | '2:3'
  imageBorderRadius: number
  containerWidth: 'default' | 'narrow' | 'full'
  imageWidth: '1/2' | '2/3' | '3/4'
  gap: number
  textAlignment: 'top' | 'middle' | 'bottom'
  headingSize: 'small' | 'normal' | 'large' | 'x-large'
}

const DEFAULT_TAG = '#image-with-text'
const HIDE_TAG = '#image-text-hide'

export const imageWithTextDefinition: SectionDefinition<ImageWithTextSectionConfig> = {
  id: 'image-with-text',
  label: 'Image with Text',
  description: 'Display an image alongside text content with optional call-to-action.',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32, left: 0, right: 0 },
  usesUnifiedPadding: false,
  settingsSchema: [
    { type: 'text', id: 'ghostPageTag', label: 'Ghost page tag', default: '#image-with-text', info: 'Tag to fetch content from' },
    {
      type: 'select',
      id: 'imagePosition',
      label: 'Image position',
      default: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' }
      ]
    },
    { type: 'checkbox', id: 'showHeader', label: 'Show heading', default: true },
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
    }
  ],
  createConfig: () => ({
    ghostPageTag: '#image-with-text',
    imagePosition: 'left',
    showHeader: true,
    headerAlignment: 'center',
    aspectRatio: 'default',
    imageBorderRadius: 0,
    containerWidth: 'default',
    imageWidth: '1/2',
    gap: 32,
    textAlignment: 'middle',
    headingSize: 'normal'
  }),
  renderHtml: (config, options) => {
    const padding = options?.padding || { top: 32, bottom: 32, left: 0, right: 0 }
    const rawTag = config.ghostPageTag || DEFAULT_TAG
    const tag = formatInternalTag(rawTag) || DEFAULT_TAG
    const imagePosition = config.imagePosition || 'left'
    const showHeader = config.showHeader !== false
    const headerAlignment = config.headerAlignment || 'center'
    const aspectRatio = config.aspectRatio || 'default'
    const borderRadius = config.imageBorderRadius ?? 0
    const containerWidth = config.containerWidth || 'default'
    const imageWidth = config.imageWidth || '1/2'
    const textAlignment = config.textAlignment || 'middle'
    const headingSize = config.headingSize || 'normal'
    const gapValue = Math.max(0, Math.min(100, typeof config.gap === 'number' ? config.gap : 32))

    // Convert aspect ratio to CSS value
    const aspectRatioMap: Record<string, string> = {
      'default': '',
      '1:1': '1 / 1',
      '3:4': '3 / 4',
      '4:3': '4 / 3',
      '16:9': '16 / 9',
      '2:3': '2 / 3'
    }
    const aspectRatioCss = aspectRatioMap[aspectRatio] || ''
    const aspectRatioStyle = aspectRatioCss ? `aspect-ratio: ${aspectRatioCss}; object-fit: cover;` : ''

    // Image width percentages
    const imageWidthMap: Record<string, string> = {
      '1/2': '50%',
      '2/3': '66.666%',
      '3/4': '75%'
    }
    const imageWidthCss = imageWidthMap[imageWidth] || '50%'

    // Text vertical alignment
    const textAlignMap: Record<string, string> = {
      'top': 'flex-start',
      'middle': 'center',
      'bottom': 'flex-end'
    }
    const textAlignCss = textAlignMap[textAlignment] || 'center'

    // Heading size
    const headingSizeMap: Record<string, string> = {
      'small': '1.5rem',
      'normal': '2rem',
      'large': '2.5rem',
      'x-large': '3rem'
    }
    const headingSizeCss = headingSizeMap[headingSize] || '2rem'
    const placeholderFallbackHeight = aspectRatioCss ? '' : 'height: 300px;'

    const sectionClasses = ['gh-image-with-text', 'gh-outer']
    if (imagePosition === 'right') {
      sectionClasses.push('gh-image-with-text-reverse')
    }
    if (containerWidth === 'narrow') {
      sectionClasses.push('gd-container-narrow')
    } else if (containerWidth === 'full') {
      sectionClasses.push('gd-container-full')
    }

    // Build content styles
    const contentStyle = `align-items: ${textAlignCss}; gap: ${gapValue}px;`
    const imageContainerStyle = `flex: 0 0 ${imageWidthCss}; max-width: ${imageWidthCss};`

    // Check for Ghost pages from API
    const ghostPages = options?.pages ?? []
    const apiTagSlug = toApiTagSlug(tag)
    const hideApiTagSlug = toApiTagSlug(HIDE_TAG)
    const matchingPage = findPageByTag(ghostPages, apiTagSlug, hideApiTagSlug)

    // If we have a matching Ghost page, render it
    if (matchingPage) {
      const pageTitle = matchingPage.title || 'Untitled'
      const tagClasses = matchingPage.tags?.map(t => `tag-${t.slug}`).join(' ') || ''
      const hasImage = matchingPage.feature_image ? '' : 'no-image'

      return `
        <section class="${sectionClasses.join(' ')}" style="padding-top: ${padding.top}px; padding-bottom: ${padding.bottom}px;" data-ghost-tag="${escapeHtml(tag)}" data-section-type="image-with-text">
          <div class="${containerWidth === 'full' ? '' : 'gh-inner'}">
            <div class="gd-image-with-text-content ${imagePosition === 'right' ? 'gd-image-right' : ''}" style="${contentStyle}">
              ${matchingPage.feature_image ? `
              <div class="gd-image-with-text-image" style="${imageContainerStyle}">
                <img src="${escapeHtml(matchingPage.feature_image)}" alt="${escapeHtml(matchingPage.feature_image_alt || pageTitle)}" style="border-radius: ${borderRadius}px; ${aspectRatioStyle}" />
              </div>` : ''}
              <article class="gh-article post ${tagClasses} ${hasImage}">
                ${showHeader ? `
                <header class="gh-article-header gd-header-${headerAlignment}">
                  <h1 class="gh-article-title is-title" style="font-size: ${headingSizeCss};">${escapeHtml(pageTitle)}</h1>
                </header>` : ''}
                <section class="gh-content is-body">
                  ${matchingPage.html || ''}
                </section>
              </article>
            </div>
          </div>
        </section>
      `.trim()
    }

    // Fallback to placeholder
    return `
      <section class="${sectionClasses.join(' ')}" style="padding-top: ${padding.top}px; padding-bottom: ${padding.bottom}px;" data-ghost-tag="${escapeHtml(tag)}" data-section-type="image-with-text">
        <div class="${containerWidth === 'full' ? '' : 'gh-inner'}">
            <div class="gd-image-with-text-placeholder ${imagePosition === 'right' ? 'gd-image-right' : ''}" style="${contentStyle}" role="status" aria-live="polite">
            <div class="gd-image-with-text-placeholder-image" style="${imageContainerStyle} border-radius: ${borderRadius}px; ${aspectRatioStyle || placeholderFallbackHeight}"></div>
            <div class="gd-image-with-text-placeholder-content">
              ${showHeader ? `
              <header class="gh-article-header gd-ghost-placeholder-header gd-header-${headerAlignment}">
                <h1 class="gh-article-title is-title" style="font-size: ${headingSizeCss};">Page title</h1>
              </header>` : ''}
              <p class="gd-image-with-text-placeholder-copy">
                Add the tag <code>${escapeHtml(tag)}</code> to a published page. The featured image, page title, excerpt, and any button cards will appear here.
              </p>
            </div>
          </div>
        </div>
      </section>
    `.trim()
  }
}
