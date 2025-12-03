import Handlebars, { type HelperOptions } from 'handlebars'
import type { PreviewPost } from '../HandlebarsRenderer.js'
import type { PreviewData } from './dataResolvers.js'

interface NavigationMenus {
  primary: Array<{ label: string; href: string; slug?: string; current?: boolean }>
  secondary: Array<{ label: string; href: string; slug?: string; current?: boolean }>
}

type HelperHash = Record<string, unknown>

interface SiteMeta extends Record<string, unknown> {
  title: string
  description?: string
}

interface Meta extends Record<string, unknown> {
  metaTags: string
}

const isHelperOptions = (value: unknown): value is HelperOptions =>
  typeof value === 'object' && value !== null && 'hash' in value

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

const coerceString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return null
}

const looseEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true
  }
  const leftNumber = coerceNumber(left)
  const rightNumber = coerceNumber(right)
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber === rightNumber
  }
  const leftString = coerceString(left)
  const rightString = coerceString(right)
  if (leftString !== null && rightString !== null) {
    return leftString === rightString
  }
  return false
}

const compareValues = (
  left: unknown,
  right: unknown,
  comparator: '>' | '>=' | '<' | '<='
): boolean => {
  const leftNumber = coerceNumber(left)
  const rightNumber = coerceNumber(right)
  if (leftNumber !== null && rightNumber !== null) {
    switch (comparator) {
      case '>':
        return leftNumber > rightNumber
      case '>=':
        return leftNumber >= rightNumber
      case '<':
        return leftNumber < rightNumber
      case '<=':
        return leftNumber <= rightNumber
      default:
        return false
    }
  }

  const leftString = coerceString(left)
  const rightString = coerceString(right)
  if (leftString !== null && rightString !== null) {
    switch (comparator) {
      case '>':
        return leftString > rightString
      case '>=':
        return leftString >= rightString
      case '<':
        return leftString < rightString
      case '<=':
        return leftString <= rightString
      default:
        return false
    }
  }

  return false
}

function formatDate(dateValue: string, format: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthShort = monthNames[date.getMonth()]?.slice(0, 3) ?? ''

  if (format === 'MMMM DD, YYYY') {
    return `${monthNames[date.getMonth()]} ${day}, ${year}`
  }

  if (format === 'DD MMM YYYY') {
    return `${day} ${monthShort} ${year}`
  }

  if (format === 'MMM DD, YYYY') {
    return `${monthShort} ${day}, ${year}`
  }

  if (format === 'DD MMMM YYYY') {
    return `${day} ${monthNames[date.getMonth()]} ${year}`
  }

  if (format === 'YYYY') {
    return String(year)
  }

  return `${year}-${month}-${day}`
}

// buildHiddenSectionClasses() removed - sections are now conditionally rendered during export
// instead of using CSS to hide them
export interface PreviewPage {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  html?: string
  excerpt?: string
  custom_excerpt?: string
  tags?: Array<{ name?: string; slug?: string; visibility?: string }>
}

export function registerGhostHelpers(
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal',
  previewPosts: PreviewPost[],
  previewPages: PreviewPage[],
  navigationMenus: NavigationMenus,
  siteMeta: SiteMeta,
  meta: Meta,
  baseBodyClass: string
) {
  const layoutWidth = pageLayout === 'narrow' ? '720px' : '1120px'

  // asset helper - use base path for Railway/production
  const basePath = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')
  const assetBase = `${basePath}/themes/source-complete/assets`

  Handlebars.registerHelper('asset', function (path: string) {
    return `${assetBase}/${path}`
  })

  Handlebars.registerHelper('navigation', function (options: HelperOptions) {
    const hash = (options.hash ?? {}) as HelperHash
    const type = hash.type === 'secondary' ? 'secondary' : 'primary'
    const menu = navigationMenus[type]

    if (!menu.length) {
      return ''
    }

    const listItems = menu
      .map((item) => {
        const classes = ['nav-item']
        if (item.slug) classes.push(`nav-${item.slug}`)
        if (item.current) classes.push('nav-current')
        const classAttr = classes.join(' ')
        const label = Handlebars.Utils.escapeExpression(item.label)
        const url = Handlebars.Utils.escapeExpression(item.href)
        return `<li class="${classAttr}"><a href="${url}">${label}</a></li>`
      })
      .join('')

    return new Handlebars.SafeString(`<ul class="nav">${listItems}</ul>`)
  })

  // ghost_head helper (outputs meta tags)
  // Note: kg-card styles (CTA, etc.) are embedded in PREVIEW_INLINE_STYLES in domManipulation.ts
  Handlebars.registerHelper('ghost_head', function () {
    return new Handlebars.SafeString(`
      <style>
        :root {
          --ghost-accent-color: ${accentColor};
          --background-color: ${backgroundColor};
          --container-width: ${layoutWidth};
        }
      </style>
      ${meta.metaTags}
    `)
  })

  // ghost_foot helper
  Handlebars.registerHelper('ghost_foot', function () {
    return new Handlebars.SafeString('')
  })

  // meta_title helper
  Handlebars.registerHelper('meta_title', function (this: PreviewData) {
    return this.title || this.post?.title || siteMeta.title
  })

  // body_class helper
  Handlebars.registerHelper('body_class', function () {
    return baseBodyClass
  })

  // match helper (conditional)
  Handlebars.registerHelper('match', function (this: PreviewData, ...helperArgs: unknown[]) {
    const potentialOptions = helperArgs.pop()
    if (!isHelperOptions(potentialOptions)) {
      throw new Error('match helper requires Handlebars options object')
    }
    const options = potentialOptions

    if (!options || helperArgs.length === 0) {
      throw new Error('match helper requires at least one argument')
    }

    const left = helperArgs[0]
    let operator: string = 'truthy'
    let right: unknown

    if (helperArgs.length === 2) {
      operator = '==='
      right = helperArgs[1]
    } else if (helperArgs.length >= 3) {
      operator = String(helperArgs[1])
      right = helperArgs[2]
    }

    const result = (() => {
      switch (operator) {
        case 'truthy':
          return Boolean(left)
        case '==':
          return looseEqual(left, right)
        case '===':
          return Object.is(left, right)
        case '!=':
          return !looseEqual(left, right)
        case '!==':
          return !Object.is(left, right)
        case '>':
          return compareValues(left, right, '>')
        case '>=':
          return compareValues(left, right, '>=')
        case '<':
          return compareValues(left, right, '<')
        case '<=':
          return compareValues(left, right, '<=')
        default:
          console.warn(`Unknown operator passed to match helper: ${operator}`)
          return false
      }
    })()

    return result ? options.fn?.(this) : options.inverse?.(this)
  })

  // Helper to check if an item has a specific tag
  const hasTag = (item: { tags?: Array<{ slug?: string }> }, tagSlug: string): boolean => {
    if (!item.tags || !Array.isArray(item.tags)) return false
    return item.tags.some((tag) => tag.slug === tagSlug)
  }

  // Parse filter string for tag conditions (e.g., "tag:hash-ghost-card" or "tag:hash-cards-hide+tag:hash-ghost-card")
  const parseTagFilter = (filter: string): { required: string[]; excluded: string[] } => {
    const required: string[] = []
    const excluded: string[] = []

    // Split by + for AND conditions
    const conditions = filter.split('+')
    for (const condition of conditions) {
      const tagMatch = condition.match(/^tag:(.+)$/)
      if (tagMatch) {
        required.push(tagMatch[1])
      }
      const excludeTagMatch = condition.match(/^-tag:(.+)$/)
      if (excludeTagMatch) {
        excluded.push(excludeTagMatch[1])
      }
    }
    return { required, excluded }
  }

  // get helper (supports posts and pages with tag filtering)
  Handlebars.registerHelper('get', function (this: PreviewData, resource: string, options: HelperOptions) {
    const hash = (options.hash ?? {}) as HelperHash
    const filter = typeof hash.filter === 'string' ? hash.filter : undefined
    const parsedLimit = Number(hash.limit)

    if (resource === 'pages') {
      let pages = [...previewPages]
      const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : pages.length

      // Handle tag filtering for pages
      if (filter && filter.includes('tag:')) {
        const { required, excluded } = parseTagFilter(filter)

        if (required.length > 0) {
          pages = pages.filter((page) => required.every((tagSlug) => hasTag(page, tagSlug)))
        }
        if (excluded.length > 0) {
          pages = pages.filter((page) => !excluded.some((tagSlug) => hasTag(page, tagSlug)))
        }
      }

      const resultSet = pages.slice(0, limit)
      if (!resultSet.length) {
        return options.inverse?.(this)
      }

      const frame = Handlebars.createFrame(options.data || {})
      const invocationOptions = { data: frame } as HelperOptions & { blockParams?: unknown[] }
      invocationOptions.blockParams = [resultSet]
      return options.fn?.({ pages: resultSet } as PreviewData, invocationOptions)
    }

    if (resource !== 'posts') {
      return options.inverse?.(this)
    }

    let posts = [...previewPosts]
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : posts.length

    if (filter === 'featured:true') {
      posts = posts.filter((post) => post.featured)
    }
    if (typeof filter === 'string' && filter.startsWith('id:-')) {
      const excluded = filter.replace('id:-', '').replace(/['"]/g, '').trim()
      if (excluded) {
        posts = posts.filter((post) => {
          const slug = typeof post.slug === 'string' ? post.slug : ''
          return (
            String(post.id) !== excluded &&
            slug !== excluded &&
            !post.url?.endsWith(`/${excluded}`) &&
            post.url !== excluded
          )
        })
      }
    }
    // Handle tag filtering for posts
    if (filter && filter.includes('tag:')) {
      const { required, excluded } = parseTagFilter(filter)

      if (required.length > 0) {
        posts = posts.filter((post) => required.every((tagSlug) => hasTag(post as unknown as { tags?: Array<{ slug?: string }> }, tagSlug)))
      }
      if (excluded.length > 0) {
        posts = posts.filter((post) => !excluded.some((tagSlug) => hasTag(post as unknown as { tags?: Array<{ slug?: string }> }, tagSlug)))
      }
    }

    const resultSet = posts.slice(0, limit)
    if (!resultSet.length) {
      return options.inverse?.(this)
    }

    const frame = Handlebars.createFrame(options.data || {})
    const invocationOptions = { data: frame } as HelperOptions & { blockParams?: unknown[] }
    invocationOptions.blockParams = [resultSet]
    return options.fn?.({ posts: resultSet } as PreviewData, invocationOptions)
  })

  Handlebars.registerHelper('post_class', function (this: PreviewData) {
    const classes = ['post']
    if (this.featured) {
      classes.push('featured')
    }
    if (this.primary_tag?.slug) {
      classes.push(`tag-${this.primary_tag.slug}`)
    }
    if (!this.feature_image || this.no_image) {
      classes.push('no-image')
    }
    return classes.join(' ')
  })

  // is helper (context checking)
  Handlebars.registerHelper('is', function (this: PreviewData, ...args: unknown[]) {
    const optionsCandidate = args[args.length - 1]
    if (!isHelperOptions(optionsCandidate)) {
      return ''
    }
    const options = optionsCandidate

    // For now, return false since we're always on home page
    return options.inverse?.(this)
  })

  // foreach helper
  Handlebars.registerHelper('foreach', function (this: PreviewData, context: unknown, options: HelperOptions) {
    // Handle block parameters - when template uses {{#get "posts" as |recent|}}{{#foreach recent}}
    // Handlebars passes the block parameter as the first argument
    // But we also need to handle when context is {posts: [...]} from the get helper
    if (
      typeof context === 'object' &&
      context !== null &&
      'posts' in context &&
      Array.isArray((context as { posts: unknown[] }).posts)
    ) {
      // If we received {posts: [...]} object, extract the posts array
      context = (context as { posts: unknown[] }).posts
    }

    if (!Array.isArray(context)) {
      return options.inverse?.(this)
    }

    const hash = (options.hash ?? {}) as HelperHash
    const startIndexRaw = Number(hash.from)
    const limitRaw = Number(hash.limit)
    const toRaw = Number(hash.to)

    const startIndex = Number.isFinite(startIndexRaw) && startIndexRaw > 0 ? Math.max(0, startIndexRaw - 1) : 0
    let endIndex = context.length

    if (Number.isFinite(limitRaw) && limitRaw > 0) {
      endIndex = Math.min(endIndex, startIndex + limitRaw)
    }
    if (Number.isFinite(toRaw) && toRaw > 0) {
      endIndex = Math.min(endIndex, toRaw)
    }

    const slice = context.slice(startIndex, endIndex)

    let result = ''
    for (let i = 0; i < slice.length; i++) {
      const originalIndex = startIndex + i
      const data = Handlebars.createFrame(options.data || {})
      data.index = originalIndex
      data.number = originalIndex + 1  // 1-based index for {{@number}}
      data.first = originalIndex === 0
      data.last = originalIndex === context.length - 1
      result += options.fn?.(slice[i], { data }) || ''
    }
    return result
  })

  // post helper (single resource context)
  Handlebars.registerHelper('post', function (this: PreviewData, options: HelperOptions) {
    const hash = (options.hash ?? {}) as HelperHash
    const post = this.post || hash.post
    if (!post) {
      return options.inverse?.(this)
    }
    return options.fn?.(post as PreviewData)
  })

  Handlebars.registerHelper('img_url', function (image: string) {
    if (!image) return ''
    // For now, just return the image URL as-is since our preview images are already sized
    // In a real implementation, you'd process size and format parameters from _options.hash
    return image
  })

  Handlebars.registerHelper('date', function (this: PreviewData, options: HelperOptions) {
    const hash = (options.hash ?? {}) as HelperHash
    const dateValue = typeof this?.published_at === 'string'
      ? this.published_at
      : typeof hash.date === 'string'
        ? hash.date
        : undefined
    if (!dateValue || typeof dateValue !== 'string') {
      return ''
    }
    const format = typeof hash.format === 'string' ? hash.format : 'YYYY-MM-DD'
    return formatDate(dateValue, format)
  })

  Handlebars.registerHelper('authors', function (this: PreviewData) {
    const authors = Array.isArray(this?.authors) ? this.authors : []
    const html = authors
      .map((author) => {
        const name = typeof author?.name === 'string' ? Handlebars.Utils.escapeExpression(author.name) : ''
        if (!name) return ''
        const href = typeof author?.url === 'string' && author.url
          ? Handlebars.Utils.escapeExpression(author.url)
          : ''
        if (href) {
          return `<a href="${href}">${name}</a>`
        }
        return name
      })
      .filter(Boolean)
      .join(', ')
    return new Handlebars.SafeString(html)
  })
}
