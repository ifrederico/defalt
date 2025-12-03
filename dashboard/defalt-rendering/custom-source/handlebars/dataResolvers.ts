import Handlebars from 'handlebars'
import { safeJsonForScript } from '@defalt/utils/security/sanitizers'

// Types from HandlebarsRenderer.tsx
export type PageType = 'home' | 'about' | 'post' | 'page2'

export interface PaginationInfo {
  page: number
  pages: number
  total: number
  limit: number
  next: number | null
  prev: number | null
}

export interface PreviewPost {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  feature_image_caption?: string | Handlebars.SafeString | null
  featured?: boolean
  excerpt?: string
  custom_excerpt?: string
  published_at?: string
  reading_time?: string
  primary_tag?: {
    name?: string
    slug?: string
    url?: string
  } | null
  authors?: PreviewAuthor[]
  primary_author?: PreviewAuthor | null
  tag?: {
    name?: string
    slug?: string
    href?: string
  } | string
}

export interface PreviewAuthor {
  name: string
  profile_image?: string
  url?: string
}

export interface PreviewPage {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  feature_image_caption?: string | Handlebars.SafeString | null
  html?: string
  excerpt?: string
  custom_excerpt?: string
  tags?: Array<{ name?: string; slug?: string; visibility?: string }>
}

export interface NavigationItem {
  label: string
  href: string
  current?: boolean
  slug?: string
}

export interface NavigationMenus {
  primary: NavigationItem[]
  secondary: NavigationItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreviewData = Record<string, any>

// Utility functions
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function escapeHtml(value?: string) {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function toRelativeUrl(href?: string, siteUrl?: string) {
  if (!href) {
    return '#'
  }

  try {
    const base = new URL(siteUrl || 'https://source-newsletter.ghost.io/')
    const target = new URL(href, base)
    if (target.origin === base.origin) {
      const normalizedPath = target.pathname.replace(/\/+$/, '') || '/'
      return normalizedPath + target.search
    }
    return target.toString()
  } catch {
    return href
  }
}

export function toAbsoluteUrl(href?: string, siteUrl?: string) {
  if (!href && siteUrl) return siteUrl
  try {
    const base = new URL(siteUrl || 'https://source-newsletter.ghost.io/')
    if (!href) return base.toString()
    const url = new URL(href, base)
    return url.toString()
  } catch {
    return href || siteUrl || ''
  }
}

export function extractSlugFromUrl(href?: string) {
  if (!href) {
    return ''
  }

  try {
    const url = new URL(href, 'https://example.com')
    const segments = url.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || ''
  } catch {
    const parts = href.split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  }
}

function countWords(value?: string) {
  if (!value) return 0
  const cleaned = value.replace(/<[^>]+>/g, ' ')
  const words = cleaned.trim().split(/\s+/)
  return words.filter(Boolean).length
}

interface ContentBlock {
  type?: string
  text?: string
  html?: string
  level?: number
  id?: string
  src?: string
  alt?: string
  caption?: string
  caption_html?: string
  card_width?: string
  layout?: string
  width?: string | number
  height?: number
  image_width?: number
  image_height?: number
  srcset?: string | string[]
  sizes?: string
  href?: string
  images?: ContentBlock[]
  style?: string
  featured?: boolean
  datetime?: string
  date?: string
  author?: Record<string, unknown> | null
  [key: string]: unknown
}

function countWordsInBlock(block: ContentBlock): number {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return countWords(block.text ?? block.html ?? '')
    case 'html':
      return countWords(block.html ?? '')
    default:
      return 0
  }
}

function formatReadingTimeFromWordCount(words: number) {
  if (!words || Number.isNaN(words)) {
    return '1 min read'
  }
  const minutes = Math.max(1, Math.round(words / 265))
  return `${minutes} min read`
}

export function estimateReadingTimeFromBlocks(blocks: ContentBlock[]): string {
  const totalWords = blocks.reduce((count, block) => count + countWordsInBlock(block), 0)
  return formatReadingTimeFromWordCount(totalWords)
}

export function estimateReadingTimeFromText(text?: string): string | undefined {
  if (!text) return undefined
  return formatReadingTimeFromWordCount(countWords(text))
}

function normalizeReadingTime(value: unknown, fallback?: string): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.max(1, Math.round(value))} min read`
  }
  if (typeof value === 'string' && value.trim().length) {
    const trimmed = value.trim()
    if (/min read$/i.test(trimmed)) {
      return trimmed
    }
    if (/min$/i.test(trimmed)) {
      return `${trimmed} read`
    }
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return `${Math.max(1, Math.round(parsed))} min read`
    }
    return `${trimmed} min read`
  }
  return fallback
}

// Navigation
export function resolveNavigation(previewData: PreviewData, siteUrl: string): NavigationMenus {
  const primaryMenu = Array.isArray(previewData?.header?.navigation_bar?.menu)
    ? previewData.header.navigation_bar.menu
    : []
  const secondaryMenu = Array.isArray(previewData?.footer?.menu)
    ? previewData.footer.menu
    : []

  return {
    primary: mapMenu(primaryMenu, siteUrl),
    secondary: mapMenu(secondaryMenu, siteUrl)
  }
}

interface MenuItem {
  label?: string
  href?: string
  current?: boolean
  [key: string]: unknown
}

function mapMenu(menuItems: MenuItem[], siteUrl: string): NavigationItem[] {
  return menuItems
    .filter(Boolean)
    .map((item: MenuItem) => {
      const label = item.label ?? 'Menu item'
      return {
        label,
        href: toRelativeUrl(item.href, siteUrl),
        current: Boolean(item.current),
        slug: slugify(label)
      }
    })
}

// Site
export function resolveSite(previewData: PreviewData, siteUrl?: string) {
  const site = previewData?.site ?? {}
  const brand = previewData?.header?.navigation_bar?.brand ?? {}
  const hero = previewData?.header?.hero
  const baseUrl = siteUrl || brand.href || site.base_url || 'https://example.com/'
  const membersActions = previewData?.header?.navigation_bar?.actions?.members
  const footerSignup = previewData?.footer?.signup
  const iconFallback = (() => {
    try {
      return `${new URL(baseUrl).origin}/favicon.ico`
    } catch {
      return '/favicon.ico'
    }
  })()

  return {
    title: brand.text ?? site.name ?? 'Ghost Site',
    description: hero?.title ?? site.description ?? 'Theme preview',
    locale: site.locale ?? 'en',
    url: baseUrl,
    logo: brand.logo ?? site.logo,
    icon: site.icon ?? iconFallback,
    cover_image: site.cover_image ?? hero?.background_image,
    members_enabled: site.members_enabled ?? Boolean(membersActions || footerSignup),
    members_invite_only: Boolean(site.members_invite_only),
    paid_members_enabled: Boolean(site.paid_members_enabled),
    recommendations_enabled: Boolean(site.recommendations_enabled)
  }
}

export function resolveSiteUrl(previewData: PreviewData) {
  return (
    previewData?.site?.base_url ||
    previewData?.header?.navigation_bar?.brand?.href ||
    'https://source-newsletter.ghost.io/'
  )
}

// Config
export function resolveConfig(previewData: PreviewData) {
  const config = previewData?.config ?? {}
  return {
    posts_per_page: config.posts_per_page ?? 10
  }
}

// Custom settings
export function resolveCustom(
  previewData: PreviewData,
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal',
  navigationLayout: string,
  overrides: Record<string, unknown> = {}
) {
  const hero = previewData?.header?.hero
  const subheaderStyle = previewData?.header?.layout ?? 'Landing'
  const footerSignup = previewData?.footer?.signup

  const baseCustom = {
    site_background_color: backgroundColor,
    navigation_layout: navigationLayout,
    header_style: subheaderStyle,
    header_text: hero?.title,
    background_image: Boolean(hero?.background_image),
    show_featured_posts: false,
    post_feed_style: 'Grid',
    show_publication_info_sidebar: false,
    show_images_in_feed: true,
    show_author: true,
    show_publish_date: true,
    show_post_metadata: true,
    show_related_articles: true,
    enable_drop_caps_on_posts: false,
    title_font: 'Modern sans-serif',
    body_font: 'Modern sans-serif',
    accent_color: accentColor,
    page_layout: pageLayout,
    signup_heading: footerSignup?.heading,
    signup_subheading: footerSignup?.subhead,
    signup_placeholder: footerSignup?.subscribe_form?.placeholder ?? 'jamie@example.com',
    header_and_footer_color: 'Background color'
  }

  return {
    ...baseCustom,
    ...overrides,
  }
}

// Pagination
export function resolvePageNumber(currentPage: PageType): number {
  return currentPage === 'page2' ? 2 : 1
}

export function buildPagination(pageNumber: number, postsLength: number, postsPerPage: number): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(postsLength / Math.max(postsPerPage, 1)))

  return {
    page: pageNumber,
    pages: totalPages,
    total: postsLength,
    limit: postsPerPage,
    next: pageNumber < totalPages ? pageNumber + 1 : null,
    prev: pageNumber > 1 ? pageNumber - 1 : null
  }
}

// Posts
export function buildPreviewPosts(previewData: PreviewData, siteUrl: string): PreviewPost[] {
  if (Array.isArray(previewData?.posts)) {
    return previewData.posts as PreviewPost[]
  }

  const cards = collectCardsFromPreview(previewData)
  return cards.map((card: PreviewData, index: number) => {
    const authorSource = card.primary_author ? { author: card.primary_author } : card
    const authors = buildAuthors(authorSource, siteUrl, previewData?.site?.name)
    const normalizedUrl = toRelativeUrl((card.url as string | undefined) ?? (card.href as string | undefined), siteUrl)
    const slug = (card.slug as string | undefined) || extractSlugFromUrl(normalizedUrl)
    const description = (card.description as string | undefined) ?? (card.excerpt as string | undefined)
    const readingTime = normalizeReadingTime(card.reading_time, estimateReadingTimeFromText(description))
    const idValue = card.id
    const normalizedId = typeof idValue === 'string' || typeof idValue === 'number' ? idValue : index + 1

    const tag = card.tag
    const normalizedTag = tag && typeof tag === 'object'
      ? {
          name: tag.name ?? String(tag.slug ?? tag),
          slug: tag.slug ?? slugify(tag.name ?? String(tag)),
          href: typeof tag.href === 'string' ? tag.href : undefined
        }
      : tag
        ? {
            name: String(tag),
            slug: slugify(String(tag)),
            href: undefined
          }
        : null

    return {
      id: normalizedId,
      title: (card.title as string | undefined) ?? `Sample Post ${index + 1}`,
      slug,
      url: normalizedUrl,
      feature_image: (card.feature_image as string | undefined) || (card.image as string | undefined),
      feature_image_alt: (card.feature_image_alt as string | undefined) ?? (card.title as string | undefined),
      featured: Boolean(card.featured ?? index < 3),
      excerpt: description,
      custom_excerpt: card.custom_excerpt as string | undefined,
      published_at: (card.published_at as string | undefined) ?? (card.datetime as string | undefined) ?? (card.date as string | undefined) ?? '',
      reading_time: readingTime,
      primary_tag: normalizedTag
        ? {
            name: normalizedTag.name ?? 'Tag',
            slug: normalizedTag.slug ?? slugify(normalizedTag.name ?? 'tag'),
            url: toRelativeUrl(normalizedTag.href, siteUrl)
          }
        : (card.primary_tag as PreviewData | undefined)?.name
          ? {
              name: (card.primary_tag as PreviewData).name,
              slug: (card.primary_tag as PreviewData).slug ?? slugify((card.primary_tag as PreviewData).name),
              url: toRelativeUrl((card.primary_tag as PreviewData).url, siteUrl)
            }
          : null,
      authors,
      primary_author: authors[0] ?? null
    }
  })
}

// Pages (for Ghost Cards, Image with Text sections)
export function buildPreviewPages(previewData: PreviewData): PreviewPage[] {
  // Check if previewData has pages array directly from Ghost API
  if (Array.isArray(previewData?.pages)) {
    return previewData.pages as PreviewPage[]
  }
  // Return empty array - pages must come from Ghost API
  return []
}

function collectCardsFromPreview(previewData: PreviewData): PreviewData[] {
  if (!previewData) {
    return []
  }

  const cards: PreviewData[] = []
  const content = Array.isArray(previewData.content) ? previewData.content : []
  content.forEach((section: PreviewData) => {
    if (Array.isArray(section.cards)) {
      cards.push(...section.cards)
    }
    if (Array.isArray(section.articles)) {
      cards.push(...section.articles)
    }
  })

  if (Array.isArray(previewData.related?.cards)) {
    cards.push(...previewData.related.cards)
  }

  return cards
}

// Authors
export function buildAuthors(source: PreviewData | null | undefined, siteUrl: string, fallbackName?: string): PreviewAuthor[] {
  if (!source) {
    const name = fallbackName || 'Custom'
    return [{ name, url: toRelativeUrl('/', siteUrl) }]
  }

  const author = source.author ?? source.meta?.author
  if (!author) {
    const name = fallbackName || 'Custom'
    return [{ name, url: toRelativeUrl('/', siteUrl) }]
  }

  return [
    {
      name: author.name ?? 'Custom Team',
      profile_image: author.avatar?.src ?? author.profile_image,
      url: toRelativeUrl(author.href ?? author.url, siteUrl)
    }
  ]
}

// Article/Post rendering
export function renderArticleContent(blocks: ContentBlock[]): string {
  if (!Array.isArray(blocks)) {
    return ''
  }

  return blocks.map((block) => renderBlock(block)).join('\n')
}

function renderParagraphBlock(block: ContentBlock): string {
  if (block.html) {
    return block.html
  }
  return `<p>${escapeHtml(block.text ?? '')}</p>`
}

function renderHeadingBlock(block: ContentBlock): string {
  const level = Math.min(Math.max(block.level || 2, 2), 6)
  const idAttr = block.id ? ` id="${block.id}"` : ''
  return `<h${level}${idAttr}>${escapeHtml(block.text ?? '')}</h${level}>`
}

function renderImageBlock(block: ContentBlock): string {
  if (!block.src) {
    return ''
  }

  const caption = block.caption_html ?? (block.caption ? escapeHtml(block.caption) : '')
  const captionClass = caption ? ' kg-card-hascaption' : ''
  const widthModifier = typeof block.card_width === 'string'
    ? block.card_width
    : typeof block.layout === 'string'
      ? block.layout
      : typeof block.width === 'string'
        ? block.width
        : null
  const widthClass = widthModifier ? ` kg-width-${widthModifier}` : ''
  const figureClass = `kg-card kg-image-card${captionClass}${widthClass}`
  const imageWidth = typeof block.image_width === 'number'
    ? block.image_width
    : typeof block.width === 'number'
      ? block.width
      : undefined
  const imageHeight = typeof block.image_height === 'number'
    ? block.image_height
    : typeof block.height === 'number'
      ? block.height
      : undefined
  const widthAttr = imageWidth ? ` width="${imageWidth}"` : ''
  const heightAttr = imageHeight ? ` height="${imageHeight}"` : ''
  const srcsetAttr = Array.isArray(block.srcset) && block.srcset.length
    ? ` srcset="${block.srcset.map((value: string) => escapeHtml(value)).join(', ')}"`
    : typeof block.srcset === 'string' && block.srcset
      ? ` srcset="${escapeHtml(block.srcset)}"`
      : ''
  const sizesAttr = block.sizes ? ` sizes="${escapeHtml(block.sizes)}"` : ''
  const imgTag = `<img class="kg-image" src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt ?? '')}" loading="lazy"${widthAttr}${heightAttr}${srcsetAttr}${sizesAttr}>`
  const wrappedImg = block.href
    ? `<a href="${escapeHtml(block.href)}">${imgTag}</a>`
    : imgTag

  return `
    <figure class="${figureClass}">
      ${wrappedImg}
      ${caption ? `<figcaption>${caption}</figcaption>` : ''}
    </figure>
  `.trim()
}

function renderGalleryBlock(block: ContentBlock): string {
  if (!Array.isArray(block.images) || !block.images.length) {
    return ''
  }

  const widthModifier = typeof block.card_width === 'string'
    ? block.card_width
    : typeof block.layout === 'string'
      ? block.layout
      : typeof block.width === 'string'
        ? block.width
        : null
  const widthClass = widthModifier ? ` kg-width-${widthModifier}` : ''
  const rows = block.images.map((img: PreviewData) => {
    const styleAttr = img.style ? ` style="${escapeHtml(img.style)}"` : ''
    const imgWidthAttr = typeof img.width === 'number' ? ` width="${img.width}"` : ''
    const imgHeightAttr = typeof img.height === 'number' ? ` height="${img.height}"` : ''
    return `
      <div class="kg-gallery-image"${styleAttr}>
        <img class="kg-image" src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt ?? '')}" loading="lazy"${imgWidthAttr}${imgHeightAttr}>
      </div>
    `.trim()
  }).join('')

  return `
    <figure class="kg-card kg-gallery-card${widthClass}">
      <div class="kg-gallery-container">
        <div class="kg-gallery-row">
          ${rows}
        </div>
      </div>
    </figure>
  `.trim()
}

function renderHtmlBlock(block: ContentBlock): string {
  return block.html ?? ''
}

function renderQuoteBlock(block: ContentBlock): string {
  return `<blockquote>${escapeHtml(block.text ?? '')}</blockquote>`
}

function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'paragraph':
      return renderParagraphBlock(block)
    case 'heading':
      return renderHeadingBlock(block)
    case 'image':
      return renderImageBlock(block)
    case 'gallery':
      return renderGalleryBlock(block)
    case 'html':
      return renderHtmlBlock(block)
    case 'quote':
      return renderQuoteBlock(block)
    default:
      return ''
  }
}

export function buildPostFromArticle(article: PreviewData | null | undefined, siteUrl: string, fallbackName?: string) {
  if (!article) {
    return null
  }

  const authorSource = article.author ?? article.primary_author ?? article.meta?.author
  const authors = buildAuthors(authorSource ? { author: authorSource } : null, siteUrl, fallbackName)
  const hero = article.hero_image ?? {}
  const contentBlocks = Array.isArray(article.content_blocks)
    ? article.content_blocks
    : Array.isArray(article.content)
      ? article.content
      : Array.isArray(article.sections)
        ? article.sections
        : typeof article.html === 'string'
          ? [{ type: 'html', html: article.html }]
          : []
  const htmlContent = typeof article.html === 'string' && article.html.length
    ? article.html
    : renderArticleContent(contentBlocks)
  const safeHtml = new Handlebars.SafeString(htmlContent)
  const readingTime = normalizeReadingTime(
    article.reading_time ?? article.meta?.reading_time,
    estimateReadingTimeFromBlocks(contentBlocks)
  )
  const slug = article.slug || extractSlugFromUrl(article.href || article.url)
  const hrefOrSlug = article.url || article.href || slug
  const featureImage = typeof article.feature_image === 'string'
    ? article.feature_image
    : typeof hero.src === 'string'
      ? hero.src
      : undefined
  const featureImageAlt = typeof article.feature_image_alt === 'string'
    ? article.feature_image_alt
    : typeof hero.alt === 'string'
      ? hero.alt
      : typeof article.title === 'string'
        ? article.title
        : undefined
  const featureImageCaption = article.feature_image_caption ?? hero.caption
  const safeFeatureImageCaption = typeof featureImageCaption === 'string'
    ? new Handlebars.SafeString(featureImageCaption)
    : undefined

  return {
    id: article.id ?? slug ?? 1,
    title: article.title,
    slug,
    url: toRelativeUrl(hrefOrSlug, siteUrl),
    canonical_url: toRelativeUrl(article.canonical_url ?? hrefOrSlug, siteUrl),
    excerpt: article.excerpt ?? article.custom_excerpt,
    custom_excerpt: article.custom_excerpt ?? undefined,
    feature_image: featureImage,
    feature_image_alt: featureImageAlt,
    feature_image_caption: safeFeatureImageCaption,
    html: safeHtml,
    content: safeHtml,
    published_at: article.published_at || article.meta?.date?.datetime || article.meta?.published_at,
    reading_time: readingTime,
    primary_tag: (article.primary_tag as PreviewData | undefined)?.name
      ? {
          name: (article.primary_tag as PreviewData).name,
          slug: slugify((article.primary_tag as PreviewData).slug ?? (article.primary_tag as PreviewData).name),
          url: toRelativeUrl((article.primary_tag as PreviewData).url, siteUrl)
        }
      : article.tag
      ? {
          name: article.tag.name,
          slug: slugify(article.tag.name),
          url: toRelativeUrl(article.tag.href, siteUrl)
        }
      : null,
    authors,
    primary_author: authors[0] ?? null
  }
}

export function buildPageFromContent(previewData: PreviewData, siteUrl: string) {
  const contentBlocks = Array.isArray(previewData?.content) ? previewData.content : []
  const article = contentBlocks.find((section: ContentBlock) => section.type === 'article') ?? null
  const htmlBlock = contentBlocks.find((section: ContentBlock) => section.type === 'html') ?? null
  const pageInfo = (previewData as { page?: PreviewData }).page ?? null

  if (!article && !htmlBlock && !pageInfo) {
    return null
  }

  const sections = Array.isArray((article as ContentBlock | null)?.sections)
    ? (article as ContentBlock).sections as ContentBlock[]
    : []
  const nestedBlocks = Array.isArray((article as ContentBlock | null)?.content)
    ? (article as ContentBlock).content as ContentBlock[]
    : Array.isArray((htmlBlock as ContentBlock | null)?.content)
      ? (htmlBlock as ContentBlock).content as ContentBlock[]
      : Array.isArray((htmlBlock as ContentBlock | null)?.sections)
        ? (htmlBlock as ContentBlock).sections as ContentBlock[]
        : []

  let htmlContent = ''
  if (typeof (htmlBlock as ContentBlock | null)?.html === 'string') {
    htmlContent = (htmlBlock as ContentBlock).html as string
  } else if (sections.length) {
    htmlContent = renderArticleContent(sections as ContentBlock[])
  } else if (nestedBlocks.length) {
    htmlContent = renderArticleContent(nestedBlocks as ContentBlock[])
  } else if (typeof pageInfo?.html === 'string') {
    htmlContent = pageInfo.html as string
  } else if (typeof (article as ContentBlock | null)?.html === 'string') {
    htmlContent = (article as ContentBlock).html as string
  }

  const safeHtml = new Handlebars.SafeString(htmlContent)
  const authors = buildAuthors(
    pageInfo?.primary_author
      ? { author: pageInfo.primary_author }
      : article?.author
        ? { author: article.author }
        : null,
    siteUrl,
    previewData?.site?.name
  )
  const slug = (article?.slug as string | undefined)
    ?? (pageInfo?.slug as string | undefined)
    ?? extractSlugFromUrl((article?.href as string | undefined) ?? (article?.url as string | undefined) ?? (pageInfo?.url as string | undefined))
  const hrefOrSlug = (article?.href as string | undefined) ?? (article?.url as string | undefined) ?? (pageInfo?.url as string | undefined) ?? slug
  const heroSrc = (article?.hero_image as Record<string, unknown> | undefined)?.src
  const heroAlt = (article?.hero_image as Record<string, unknown> | undefined)?.alt
  const featureImage = typeof pageInfo?.feature_image === 'string'
    ? pageInfo.feature_image
    : typeof article?.feature_image === 'string'
      ? article.feature_image
      : typeof heroSrc === 'string'
        ? heroSrc
        : undefined
  const featureImageAlt = typeof pageInfo?.feature_image_alt === 'string'
    ? pageInfo.feature_image_alt
    : typeof article?.feature_image_alt === 'string'
      ? article.feature_image_alt
      : typeof heroAlt === 'string'
        ? heroAlt
        : undefined
  const featureImageCaption = (pageInfo?.feature_image_caption as string | undefined)
    ?? (article?.feature_image_caption as string | undefined)
    ?? (article?.hero_image as Record<string, unknown> | undefined)?.caption
  const safeFeatureImageCaption = typeof featureImageCaption === 'string'
    ? new Handlebars.SafeString(featureImageCaption)
    : undefined
  const customExcerpt = (pageInfo?.custom_excerpt as string | undefined)
    ?? (article?.custom_excerpt as string | undefined)
  const tags = Array.isArray(pageInfo?.tags) ? pageInfo.tags : (Array.isArray(article?.tags) ? article.tags : undefined)
  const primaryTagCandidate = (pageInfo as PreviewData | undefined)?.primary_tag ?? (Array.isArray(tags) ? tags[0] : undefined)

  return {
    id: slug ?? 1,
    title: (article?.title as string | undefined) ?? (pageInfo?.title as string | undefined) ?? (previewData?.site?.name as string | undefined) ?? 'Page',
    custom_excerpt: customExcerpt,
    html: safeHtml,
    content: safeHtml,
    feature_image: featureImage,
    feature_image_alt: featureImageAlt,
    feature_image_caption: safeFeatureImageCaption,
    tags,
    primary_tag: primaryTagCandidate
      ? {
          name: primaryTagCandidate.name ?? 'Tag',
          slug: primaryTagCandidate.slug ?? slugify(primaryTagCandidate.name ?? 'tag'),
          url: toRelativeUrl((primaryTagCandidate as PreviewData).url, siteUrl),
          visibility: (primaryTagCandidate as PreviewData).visibility
        }
      : null,
    page: true,
    no_image: Boolean(article?.no_image),
    authors,
    primary_author: authors[0] ?? null,
    slug,
    url: toRelativeUrl(hrefOrSlug, siteUrl)
  }
}

// Context builders
export function buildTemplateContext(
  previewData: PreviewData,
  currentPage: string,
  posts: PreviewPost[],
  siteUrl: string,
  pagination: PaginationInfo
) {
  const postEntry = currentPage === 'post'
    ? buildPostFromArticle(previewData.article, siteUrl, previewData?.site?.name)
    : null
  const pageEntry = currentPage === 'about'
    ? buildPageFromContent(previewData, siteUrl)
    : null

  const context: PreviewData & { posts: PreviewPost[], pagination: PaginationInfo, post?: PreviewPost | null } = {
    ...previewData,
    posts,
    pagination
  }

  if (postEntry) {
    context.post = postEntry
  } else if (pageEntry) {
    context.post = pageEntry
  }

  return context
}

export function buildDataFrame(
  previewData: PreviewData,
  _posts: PreviewPost[],
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal',
  navigationLayout: string,
  siteUrl: string,
  currentPage: string,
  overrides: Record<string, unknown> = {}
) {
  const site = resolveSite(previewData, siteUrl)
  const config = resolveConfig(previewData)
  const custom = resolveCustom(previewData, accentColor, backgroundColor, pageLayout, navigationLayout, overrides)

  return {
    site,
    config,
    custom,
    member: null,
    page: currentPage === 'about'
      ? {
          show_title_and_feature_image: true
        }
      : undefined
  }
}

// Meta
type MetaDocumentType = 'website' | 'article'

type MetaContext = {
  type: MetaDocumentType
  title: string
  description?: string
  canonical: string
  image?: string
  publishedAt?: string
  modifiedAt?: string
  primaryTag?: string
  authorName?: string
  siteMeta: ReturnType<typeof resolveSite>
  siteUrl: string
}

function createMetaContext(previewData: PreviewData, siteMeta: ReturnType<typeof resolveSite>, currentPage: PageType, siteUrl: string): MetaContext {
  const hero = previewData?.header?.hero
  const article = previewData?.article

  const baseContext: MetaContext = {
    type: 'website',
    title: siteMeta.title,
    description: hero?.title ?? siteMeta.description,
    canonical: toAbsoluteUrl(siteMeta.url, siteUrl),
    image: hero?.background_image || siteMeta.cover_image,
    siteMeta,
    siteUrl
  }

  if (currentPage !== 'post' || !article) {
    return baseContext
  }

  return {
    ...baseContext,
    type: 'article',
    title: article.title ?? baseContext.title,
    description: article.excerpt ?? baseContext.description,
    canonical: toAbsoluteUrl(article.href ?? siteMeta.url, siteUrl),
    image: article.hero_image?.src ?? baseContext.image,
    publishedAt: article.meta?.date?.datetime,
    modifiedAt: article.meta?.updated_at ?? article.meta?.date?.datetime,
    primaryTag: article.tag?.name,
    authorName: article.meta?.author?.name
  }
}

function buildStandardMetaTags(context: MetaContext): string[] {
  const tags: string[] = []
  if (context.description) {
    tags.push(`<meta name="description" content="${escapeHtml(context.description)}">`)
  }
  if (context.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(context.canonical)}">`)
  }
  return tags
}

function buildOpenGraphTags(context: MetaContext): string[] {
  const tags = [
    `<meta property="og:site_name" content="${escapeHtml(context.siteMeta.title)}">`,
    `<meta property="og:type" content="${context.type}">`,
    `<meta property="og:title" content="${escapeHtml(context.title)}">`
  ]

  if (context.description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(context.description)}">`)
  }
  if (context.canonical) {
    tags.push(`<meta property="og:url" content="${escapeHtml(context.canonical)}">`)
  }
  if (context.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(context.image)}">`)
  }
  if (context.publishedAt) {
    tags.push(`<meta property="article:published_time" content="${escapeHtml(context.publishedAt)}">`)
  }
  if (context.modifiedAt) {
    tags.push(`<meta property="article:modified_time" content="${escapeHtml(context.modifiedAt)}">`)
  }
  if (context.primaryTag) {
    tags.push(`<meta property="article:tag" content="${escapeHtml(context.primaryTag)}">`)
  }

  return tags
}

function buildTwitterTags(context: MetaContext): string[] {
  const tags = [
    `<meta name="twitter:card" content="${context.type === 'article' ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(context.title)}">`
  ]

  if (context.description) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(context.description)}">`)
  }
  if (context.canonical) {
    tags.push(`<meta name="twitter:url" content="${escapeHtml(context.canonical)}">`)
  }
  if (context.image) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(context.image)}">`)
  }
  if (context.authorName) {
    tags.push(`<meta name="twitter:label1" content="Written by">`)
    tags.push(`<meta name="twitter:data1" content="${escapeHtml(context.authorName)}">`)
  }
  if (context.primaryTag) {
    tags.push(`<meta name="twitter:label2" content="Filed under">`)
    tags.push(`<meta name="twitter:data2" content="${escapeHtml(context.primaryTag)}">`)
  }

  return tags
}

function buildLdJsonTag(context: MetaContext): string {
  if (context.type === 'article') {
    const ldJson = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      publisher: {
        '@type': 'Organization',
        name: context.siteMeta.title,
        url: toAbsoluteUrl(context.siteMeta.url, context.siteUrl),
        logo: {
          '@type': 'ImageObject',
          url: toAbsoluteUrl(context.siteMeta.icon, context.siteUrl),
          width: 48,
          height: 48
        }
      },
      author: context.authorName
        ? {
            '@type': 'Person',
            name: context.authorName,
            url: context.canonical
          }
        : undefined,
      headline: context.title,
      url: context.canonical,
      datePublished: context.publishedAt,
      dateModified: context.modifiedAt ?? context.publishedAt,
      image: context.image
    }

    return `<script type="application/ld+json">${safeJsonForScript(ldJson)}</script>`
  }

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: context.canonical,
    name: context.siteMeta.title,
    description: context.description,
    publisher: {
      '@type': 'Organization',
      name: context.siteMeta.title
    }
  }

  return `<script type="application/ld+json">${safeJsonForScript(ldJson)}</script>`
}

export function buildMeta(previewData: PreviewData, siteMeta: ReturnType<typeof resolveSite>, currentPage: PageType, siteUrl: string) {
  const context = createMetaContext(previewData, siteMeta, currentPage, siteUrl)
  const metaTags = [
    ...buildStandardMetaTags(context),
    ...buildOpenGraphTags(context),
    ...buildTwitterTags(context),
    buildLdJsonTag(context)
  ]

  return {
    metaTags: metaTags.join('\n')
  }
}
