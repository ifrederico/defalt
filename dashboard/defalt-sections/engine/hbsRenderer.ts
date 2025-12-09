/**
 * HBS Renderer - Browser-side Handlebars template rendering for sections
 *
 * This module handles:
 * - Fetching .hbs templates from section folders
 * - Compiling templates with caching
 * - Rendering sections with config context
 * - CSS variable injection for dynamic styling
 */

import Handlebars from 'handlebars'
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
const templateSourceCache = new Map<string, string>()

/**
 * Clear all cached templates (useful for hot reload)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
  templateSourceCache.clear()
}

/**
 * Clear a specific template from cache
 */
export function invalidateTemplate(sectionId: string): void {
  templateCache.delete(sectionId)
  templateSourceCache.delete(sectionId)
}

// =============================================================================
// Helpers Registration
// =============================================================================

let helpersRegistered = false

/**
 * Register common Handlebars helpers for section templates
 */
export function registerSectionHelpers(): void {
  if (helpersRegistered) return
  helpersRegistered = true

  // Conditional helpers
  Handlebars.registerHelper('eq', (a, b) => a === b)
  Handlebars.registerHelper('neq', (a, b) => a !== b)
  Handlebars.registerHelper('gt', (a, b) => a > b)
  Handlebars.registerHelper('gte', (a, b) => a >= b)
  Handlebars.registerHelper('lt', (a, b) => a < b)
  Handlebars.registerHelper('lte', (a, b) => a <= b)
  Handlebars.registerHelper('and', (a, b) => a && b)
  Handlebars.registerHelper('or', (a, b) => a || b)
  Handlebars.registerHelper('not', (a) => !a)

  // String helpers
  Handlebars.registerHelper('lowercase', (str) =>
    typeof str === 'string' ? str.toLowerCase() : ''
  )
  Handlebars.registerHelper('uppercase', (str) =>
    typeof str === 'string' ? str.toUpperCase() : ''
  )
  Handlebars.registerHelper('truncate', (str, len) => {
    if (typeof str !== 'string') return ''
    const length = typeof len === 'number' ? len : 100
    return str.length > length ? str.substring(0, length) + '...' : str
  })

  // CSS helpers
  Handlebars.registerHelper('cssVar', (name, value) => {
    if (!name || value === undefined || value === null) return ''
    return `--${name}: ${value}`
  })

  Handlebars.registerHelper('cssVars', function (this: Record<string, unknown>, options) {
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
  Handlebars.registerHelper('buildStyle', function (this: Record<string, unknown>, options) {
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
  Handlebars.registerHelper('buildClass', function (...args) {
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
  Handlebars.registerHelper('classIf', (condition, className, fallback) => {
    if (condition) {
      return typeof className === 'string' ? className : ''
    }
    return typeof fallback === 'string' ? fallback : ''
  })

  // Default value helper
  Handlebars.registerHelper('default', (value, defaultValue) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }
    return value
  })

  // JSON helper (for debugging)
  Handlebars.registerHelper('json', (context) => {
    return JSON.stringify(context, null, 2)
  })

  // Math helpers
  Handlebars.registerHelper('add', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA + numB
  })

  Handlebars.registerHelper('subtract', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA - numB
  })

  Handlebars.registerHelper('multiply', (a, b) => {
    const numA = typeof a === 'number' ? a : 0
    const numB = typeof b === 'number' ? b : 0
    return numA * numB
  })

  // Clamp helper
  Handlebars.registerHelper('clamp', (value, min, max) => {
    const num = typeof value === 'number' ? value : 0
    const minVal = typeof min === 'number' ? min : 0
    const maxVal = typeof max === 'number' ? max : 100
    return Math.max(minVal, Math.min(maxVal, num))
  })

  // Unit helper (adds px, em, etc.)
  Handlebars.registerHelper('unit', (value, unit) => {
    if (value === undefined || value === null) return ''
    const unitStr = typeof unit === 'string' ? unit : 'px'
    return `${value}${unitStr}`
  })

  // Let helper - allows defining local variables in a block
  // Usage: {{#let varName=value anotherVar=otherValue}} ... {{/let}}
  Handlebars.registerHelper('let', function (this: Record<string, unknown>, options) {
    const hash = options?.hash || {}
    // Create a new context with the hash values merged in
    const context = { ...this, ...hash }
    return options.fn(context)
  })

  // Array helpers
  Handlebars.registerHelper('length', (arr) => {
    if (Array.isArray(arr)) return arr.length
    return 0
  })

  // Check if any item in array has truthy value for specified keys
  // Usage: {{#if (hasContent cards "title" "description" "buttonText")}}
  Handlebars.registerHelper('hasContent', (arr, ...keys) => {
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
  Handlebars.registerHelper('isEmpty', (value) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  })

  // isNotEmpty helper
  Handlebars.registerHelper('isNotEmpty', (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    return true
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
    templateSourceCache.set(sectionId, source)

    // Compile template
    const compiled = Handlebars.compile(source)
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
      top: typeof config.paddingTop === 'number' ? config.paddingTop : undefined,
      bottom: typeof config.paddingBottom === 'number' ? config.paddingBottom : undefined,
      left: typeof config.paddingLeft === 'number' ? config.paddingLeft : undefined,
      right: typeof config.paddingRight === 'number' ? config.paddingRight : undefined
    }

    // Build render context
    const context: SectionRenderContext = {
      config,
      padding,
      pages: options.pages,
      // Spread config to top-level for easier access in templates
      ...config
    }

    // Add computed styles from resolved padding
    const hasPadding = padding.top !== undefined || padding.bottom !== undefined ||
                       padding.left !== undefined || padding.right !== undefined
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
export function renderSectionSync(
  sectionId: string,
  config: Record<string, unknown>,
  options: RenderOptions = {}
): string | null {
  const template = templateCache.get(sectionId)
  if (!template) {
    return null
  }

  registerSectionHelpers()

  // Resolve padding: prefer explicit options, fallback to config values
  const padding: SectionPadding = options.padding ?? {
    top: typeof config.paddingTop === 'number' ? config.paddingTop : undefined,
    bottom: typeof config.paddingBottom === 'number' ? config.paddingBottom : undefined,
    left: typeof config.paddingLeft === 'number' ? config.paddingLeft : undefined,
    right: typeof config.paddingRight === 'number' ? config.paddingRight : undefined
  }

  const context: SectionRenderContext = {
    config,
    padding,
    pages: options.pages,
    ...config
  }

  const hasPadding = padding.top !== undefined || padding.bottom !== undefined ||
                     padding.left !== undefined || padding.right !== undefined
  if (hasPadding) {
    context.sectionStyle = buildPaddingStyle(padding)
  }

  return template(context)
}

/**
 * Preload a template into cache
 */
export async function preloadTemplate(
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
export function buildPaddingStyle(padding: SectionPadding): string {
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

/**
 * Build CSS custom properties string from config
 */
export function buildCssVariables(
  config: Record<string, unknown>,
  prefix = 'gd'
): string {
  const vars: string[] = []

  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null) continue

    // Convert camelCase to kebab-case
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()

    if (typeof value === 'string') {
      vars.push(`--${prefix}-${cssKey}: ${value}`)
    } else if (typeof value === 'number') {
      // Add px unit for numeric values that look like dimensions
      const needsUnit = cssKey.includes('padding') ||
        cssKey.includes('margin') ||
        cssKey.includes('radius') ||
        cssKey.includes('width') ||
        cssKey.includes('height')
      vars.push(`--${prefix}-${cssKey}: ${value}${needsUnit ? 'px' : ''}`)
    } else if (typeof value === 'boolean') {
      vars.push(`--${prefix}-${cssKey}: ${value ? '1' : '0'}`)
    }
  }

  return vars.join('; ')
}

/**
 * Sanitize a hex color value
 */
export function sanitizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'transparent') {
    return normalized
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(normalized)) {
    // Expand shorthand (#abc -> #aabbcc)
    if (normalized.length === 4) {
      const r = normalized[1]
      const g = normalized[2]
      const b = normalized[3]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return normalized
  }

  return fallback
}

/**
 * Sanitize a URL/href value
 */
export function sanitizeHref(value: unknown): string {
  if (typeof value !== 'string') {
    return '#'
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return '#'
  }

  // Block javascript: URLs
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:')) {
    return '#'
  }

  return trimmed
}

/**
 * Escape HTML entities
 */
export function escapeHtml(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// =============================================================================
// Template Source Access
// =============================================================================

/**
 * Get the raw template source (for export/debugging)
 */
export function getTemplateSource(sectionId: string): string | null {
  return templateSourceCache.get(sectionId) ?? null
}

/**
 * Check if a template is cached
 */
export function isTemplateCached(sectionId: string): boolean {
  return templateCache.has(sectionId)
}
