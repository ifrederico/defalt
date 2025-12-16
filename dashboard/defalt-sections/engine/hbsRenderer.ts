/**
 * HBS Renderer - Browser-side Handlebars template rendering for sections
 *
 * This module handles:
 * - Fetching .hbs templates from section folders
 * - Compiling templates with caching
 * - Rendering sections with config context
 * - CSS variable injection for dynamic styling
 */

import Handlebars, { type HelperOptions } from 'handlebars'
import type { SectionPadding, RenderOptions } from './schemaTypes.js'

// =============================================================================
// Types
// =============================================================================

export interface SectionRenderContext {
  /** Section configuration values */
  config: Record<string, unknown>
  /** Computed CSS style string for the section wrapper */
  sectionStyle?: string
  /** Computed CSS style string for inner elements */
  innerStyle?: string
  /** Computed CSS class names */
  classes?: string
  /** Padding values */
  padding?: SectionPadding
  /** Ghost pages data (for dynamic content sections) */
  pages?: RenderOptions['pages']
  /** Ghost posts data (for dynamic content sections) */
  posts?: RenderOptions['posts']
  /** Any additional context */
  [key: string]: unknown
}

export interface RenderSectionOptions extends RenderOptions {
  /** Base path for template fetching (default: '/sections/') */
  basePath?: string
}

// =============================================================================
// Template Cache
// =============================================================================

const templateCache = new Map<string, HandlebarsTemplateDelegate>()
const hbs = Handlebars.create()

// =============================================================================
// Helpers Registration
// =============================================================================

let helpersRegistered = false

/**
 * Register common Handlebars helpers for section templates
 */
function registerSectionHelpers(): void {
  if (helpersRegistered) return
  helpersRegistered = true

  // Conditional helpers
  hbs.registerHelper('eq', (a, b) => a === b)
  hbs.registerHelper('neq', (a, b) => a !== b)
  hbs.registerHelper('gt', (a, b) => a > b)
  hbs.registerHelper('gte', (a, b) => a >= b)
  hbs.registerHelper('lt', (a, b) => a < b)
  hbs.registerHelper('lte', (a, b) => a <= b)
  hbs.registerHelper('and', (a, b) => a && b)
  hbs.registerHelper('or', (a, b) => a || b)
  hbs.registerHelper('not', (a) => !a)

  // String helpers
  hbs.registerHelper('lowercase', (str) =>
    typeof str === 'string' ? str.toLowerCase() : ''
  )
  hbs.registerHelper('uppercase', (str) =>
    typeof str === 'string' ? str.toUpperCase() : ''
  )
  hbs.registerHelper('truncate', (str, len) => {
    if (typeof str !== 'string') return ''
    const length = typeof len === 'number' ? len : 100
    return str.length > length ? str.substring(0, length) + '...' : str
  })

  // CSS helpers
  hbs.registerHelper('cssVar', (name, value) => {
    if (!name || value === undefined || value === null) return ''
    return `--${name}: ${value}`
  })

  hbs.registerHelper('cssVars', function (this: Record<string, unknown>, options) {
    const vars: string[] = []
    const hash = options?.hash || {}
    for (const [key, value] of Object.entries(hash)) {
      if (value !== undefined && value !== null) {
        vars.push(`--${key}: ${value}`)
      }
    }
    return vars.join('; ')
  })

  // Style builder helper
  hbs.registerHelper('buildStyle', function (this: Record<string, unknown>, options) {
    const styles: string[] = []
    const hash = options?.hash || {}
    for (const [key, value] of Object.entries(hash)) {
      if (value !== undefined && value !== null && value !== '') {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        styles.push(`${cssKey}: ${value}`)
      }
    }
    return styles.join('; ')
  })

  // Class builder helper
  hbs.registerHelper('buildClass', function (...args) {
    const classes: string[] = []
    // Last argument is the options object
    for (let i = 0; i < args.length - 1; i++) {
      const arg = args[i]
      if (typeof arg === 'string' && arg.trim()) {
        classes.push(arg.trim())
      }
    }
    return classes.join(' ')
  })

  // Conditional class helper
  hbs.registerHelper('classIf', (condition, className, fallback) => {
    if (condition) {
      return typeof className === 'string' ? className : ''
    }
    return typeof fallback === 'string' ? fallback : ''
  })

  // Default value helper
  hbs.registerHelper('default', (value, defaultValue) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }
    return value
  })

  // JSON helper (for debugging)
  hbs.registerHelper('json', (context) => {
    return JSON.stringify(context, null, 2)
  })

  // Math helpers
  hbs.registerHelper('add', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA + numB
  })

  hbs.registerHelper('subtract', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA - numB
  })

  hbs.registerHelper('multiply', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA * numB
  })

  // Clamp helper
  hbs.registerHelper('clamp', (value, min, max) => {
    const num = typeof value === 'number' ? value : 0
    const minVal = typeof min === 'number' ? min : 0
    const maxVal = typeof max === 'number' ? max : 100
    return Math.max(minVal, Math.min(maxVal, num))
  })

  // Unit helper (adds px, em, etc.)
  hbs.registerHelper('unit', (value, unit) => {
    if (value === undefined || value === null) return ''
    const unitStr = typeof unit === 'string' ? unit : 'px'
    return `${value}${unitStr}`
  })

  // Let helper - allows defining local variables in a block
  // Usage: {{#let varName=value anotherVar=otherValue}} ... {{/let}}
  hbs.registerHelper('let', function (this: Record<string, unknown>, options) {
    const hash = options?.hash || {}
    // Create a new context with the hash values merged in
    const context = { ...this, ...hash }
    return options.fn(context)
  })

  // Array helpers
  hbs.registerHelper('length', (arr) => {
    if (Array.isArray(arr)) return arr.length
    return 0
  })

  // Check if any item in array has truthy value for specified keys
  // Usage: {{#if (hasContent cards "title" "description" "buttonText")}}
  hbs.registerHelper('hasContent', (arr, ...keys) => {
    if (!Array.isArray(arr)) return false
    // Remove the options object from keys
    const checkKeys = keys.slice(0, -1)
    return arr.some((item) => {
      if (typeof item !== 'object' || item === null) return false
      return checkKeys.some((key) => {
        const val = item[key as string]
        return val !== undefined && val !== null && val !== ''
      })
    })
  })

  // isEmpty helper - check if value is empty (null, undefined, empty string, empty array)
  hbs.registerHelper('isEmpty', (value) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  })

  // isNotEmpty helper
  hbs.registerHelper('isNotEmpty', (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    return true
  })

  // =============================================================================
  // Ghost-like Helpers (subset)
  // =============================================================================

  type TagFilterClause = { required: string[]; excluded: string[] }

  const hasTag = (item: { tags?: Array<{ slug?: string }> }, tagSlug: string): boolean => {
    if (!item.tags || !Array.isArray(item.tags)) return false
    return item.tags.some((tag) => tag.slug === tagSlug)
  }

  const parseTagFilter = (filter: string): TagFilterClause[] => {
    const normalized = filter.replace(/[()]/g, '')
    const clauses = normalized
      .split(',')
      .map((clause) => clause.trim())
      .filter(Boolean)

    return clauses.map((clause) => {
      const required: string[] = []
      const excluded: string[] = []
      const conditions = clause
        .split('+')
        .map((condition) => condition.trim())
        .filter(Boolean)

      for (const condition of conditions) {
        const tagMatch = condition.match(/^tag:(.+)$/)
        if (tagMatch) {
          required.push(tagMatch[1])
          continue
        }
        const excludeTagMatch = condition.match(/^-tag:(.+)$/)
        if (excludeTagMatch) {
          excluded.push(excludeTagMatch[1])
        }
      }

      return { required, excluded }
    })
  }

	// get helper (supports pages/posts with basic tag filtering)
	hbs.registerHelper('get', function (this: SectionRenderContext, resource: string, options: HelperOptions) {
	  const baseContext =
	    typeof this === 'object' && this !== null
	      ? { ...(this as Record<string, unknown>) }
	      : {}
	  const hash = (options.hash ?? {}) as Record<string, unknown>
	  const filter = typeof hash.filter === 'string' ? hash.filter : undefined
	  const parsedLimit = Number(hash.limit)
    const rootContext = (() => {
      const root = (options.data as unknown as { root?: unknown } | undefined)?.root
      if (typeof root === 'object' && root !== null) {
        return root as Record<string, unknown>
      }
      return null
    })()

	  if (resource !== 'pages' && resource !== 'posts') {
	    const frame = hbs.createFrame(options.data || {})
	    const invocationOptions = { data: frame } as HelperOptions & { blockParams?: unknown[] }
	    invocationOptions.blockParams = [[]]
	    return options.fn?.({ ...baseContext, [resource]: [] } as unknown, invocationOptions)
	  }

    const pagesFromContext = Array.isArray(this.pages)
      ? this.pages
      : (Array.isArray(rootContext?.pages) ? (rootContext.pages as unknown[]) : [])
    const postsFromContext = Array.isArray((this as unknown as { posts?: unknown }).posts)
      ? ((this as unknown as { posts?: unknown[] }).posts as unknown[])
      : (Array.isArray(rootContext?.posts) ? (rootContext.posts as unknown[]) : [])
    const source = resource === 'pages' ? [...pagesFromContext] : [...postsFromContext]

    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : source.length

    let items = source as Array<{ tags?: Array<{ slug?: string }> }>

    if (filter && filter.includes('tag:')) {
      const clauses = parseTagFilter(filter)
      items = items.filter((item) =>
        clauses.some(({ required, excluded }) => {
          const hasRequired = required.every((tagSlug) => hasTag(item, tagSlug))
          const hasExcluded = excluded.some((tagSlug) => hasTag(item, tagSlug))
          return hasRequired && !hasExcluded
        })
      )
    }

	  const resultSet = items.slice(0, limit)

	  const frame = hbs.createFrame(options.data || {})
	  const invocationOptions = { data: frame } as HelperOptions & { blockParams?: unknown[] }
	  invocationOptions.blockParams = [resultSet]
	  return options.fn?.({ ...baseContext, [resource]: resultSet } as unknown, invocationOptions)
	})

  // foreach helper (Ghost-compatible alias)
  hbs.registerHelper('foreach', function (this: unknown, context: unknown, options: HelperOptions) {
    if (
      typeof context === 'object' &&
      context !== null &&
      'posts' in context &&
      Array.isArray((context as { posts: unknown[] }).posts)
    ) {
      context = (context as { posts: unknown[] }).posts
    }
    if (
      typeof context === 'object' &&
      context !== null &&
      'pages' in context &&
      Array.isArray((context as { pages: unknown[] }).pages)
    ) {
      context = (context as { pages: unknown[] }).pages
    }
    if (!Array.isArray(context)) {
      return options.inverse?.(this)
    }

    const hash = (options.hash ?? {}) as Record<string, unknown>
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
      const data = hbs.createFrame(options.data || {})
      ;(data as Record<string, unknown>).index = originalIndex
      ;(data as Record<string, unknown>).number = originalIndex + 1
      ;(data as Record<string, unknown>).first = originalIndex === 0
      ;(data as Record<string, unknown>).last = originalIndex === context.length - 1
      result += options.fn?.(slice[i], { data }) || ''
    }
    return result
  })

  // img_url helper (preview passthrough)
  hbs.registerHelper('img_url', function (image: string) {
    if (!image) return ''
    return image
  })
}

// =============================================================================
// Template Fetching & Compilation
// =============================================================================

/**
 * Fetch and compile a section template
 */
async function fetchAndCompileTemplate(
  sectionId: string,
  templatePath: string,
  basePath: string
): Promise<HandlebarsTemplateDelegate> {
  // Check cache first
  const cached = templateCache.get(sectionId)
  if (cached) {
    return cached
  }

  // Construct full path
  const fullPath = `${basePath}${templatePath}`

  try {
    const response = await fetch(fullPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`)
    }

    const source = await response.text()

    // Compile template
    const compiled = hbs.compile(source)
    templateCache.set(sectionId, compiled)

    return compiled
  } catch (error) {
    console.error(`[hbsRenderer] Error loading template for section "${sectionId}":`, error)
    throw error
  }
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Render a section with its config
 *
 * @param sectionId - The section identifier
 * @param templatePath - Path to the .hbs file (relative to basePath)
 * @param config - Section configuration object
 * @param options - Additional render options (padding, pages, etc.)
 * @returns Rendered HTML string
 *
 * @example
 * const html = await renderSection('hero', 'hero/hero.hbs', heroConfig, {
 *   padding: { top: 32, bottom: 32 },
 *   pages: ghostPages
 * })
 */
export async function renderSection(
  sectionId: string,
  templatePath: string,
  config: Record<string, unknown>,
  options: RenderSectionOptions = {}
): Promise<string> {
  // Ensure helpers are registered
  registerSectionHelpers()

  const basePath = options.basePath ?? '/sections/'

  try {
    const template = await fetchAndCompileTemplate(sectionId, templatePath, basePath)

    // Resolve padding: prefer explicit options, fallback to config values
    const padding: SectionPadding = options.padding ?? {
      top: typeof config.paddingTop === 'number' ? config.paddingTop : 0,
      bottom: typeof config.paddingBottom === 'number' ? config.paddingBottom : 0,
      left: typeof config.paddingLeft === 'number' ? config.paddingLeft : undefined,
      right: typeof config.paddingRight === 'number' ? config.paddingRight : undefined
    }

    // Build render context
    const context: SectionRenderContext = {
      config,
      padding,
      pages: options.pages,
      posts: options.posts,
      // Spread config to top-level for easier access in templates
      ...config
    }

    // Add computed styles from resolved padding
    const hasPadding =
      padding.top > 0 ||
      padding.bottom > 0 ||
      (padding.left ?? 0) > 0 ||
      (padding.right ?? 0) > 0
    if (hasPadding) {
      context.sectionStyle = buildPaddingStyle(padding)
    }

    return template(context)
  } catch (error) {
    console.error(`[hbsRenderer] Error rendering section "${sectionId}":`, error)
    // Return error placeholder
    return `<section class="gd-section-error" data-section-id="${sectionId}">
      <p>Error loading section: ${sectionId}</p>
    </section>`
  }
}

/**
 * Synchronously render a section if template is already cached
 * Returns null if template is not cached
 */
/**
 * Preload a template into cache
 */
async function preloadTemplate(
  sectionId: string,
  templatePath: string,
  basePath = '/sections/'
): Promise<void> {
  await fetchAndCompileTemplate(sectionId, templatePath, basePath)
}

/**
 * Preload multiple templates in parallel
 */
export async function preloadTemplates(
  templates: Array<{ sectionId: string; templatePath: string }>,
  basePath = '/sections/'
): Promise<void> {
  await Promise.all(
    templates.map(({ sectionId, templatePath }) =>
      preloadTemplate(sectionId, templatePath, basePath)
    )
  )
}

// =============================================================================
// Style Helpers
// =============================================================================

/**
 * Build CSS padding style string from padding config
 */
function buildPaddingStyle(padding: SectionPadding): string {
  const styles: string[] = []

  if (typeof padding.top === 'number') {
    styles.push(`padding-top: ${padding.top}px`)
  }
  if (typeof padding.bottom === 'number') {
    styles.push(`padding-bottom: ${padding.bottom}px`)
  }
  if (typeof padding.left === 'number') {
    styles.push(`padding-left: ${padding.left}px`)
  }
  if (typeof padding.right === 'number') {
    styles.push(`padding-right: ${padding.right}px`)
  }

  return styles.join('; ')
}
