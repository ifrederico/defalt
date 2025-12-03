import * as csstree from 'css-tree'
import type { CssNode, List, ListItem } from 'css-tree'
import { logError } from '../logging/errorLogger.js'

const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_COLOR_REGEX = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
const HSL_COLOR_REGEX = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i
const CSS_VAR_REGEX = /^var\(\s*--[a-z0-9-_]+\s*(?:,\s*[^)]+)?\)$/i
const NAMED_COLORS = new Set([
  'transparent', 'currentcolor', 'inherit', 'initial', 'unset',
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'aqua', 'maroon', 'olive', 'silver', 'fuchsia'
])

const ALLOWED_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'background-size',
  'background-position',
  'background-repeat',
  'font',
  'font-family',
  'font-weight',
  'font-size',
  'font-style',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-align',
  'text-decoration',
  'text-indent',
  'text-shadow',
  'display',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'gap',
  'column-gap',
  'row-gap',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column',
  'grid-row',
  'grid-auto-flow',
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'order',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-color',
  'border-width',
  'border-style',
  'border-radius',
  'box-shadow',
  'outline',
  'outline-color',
  'outline-width',
  'outline-style',
  'opacity',
  'transform',
  'transform-origin',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'overflow',
  'overflow-x',
  'overflow-y',
  'max-width',
  'min-width',
  'width',
  'height',
  'max-height',
  'min-height',
  'cursor',
  'filter',
  'backdrop-filter',
  'clip-path',
  'object-fit',
  'object-position'
])

const ALLOWED_AT_RULES = new Set(['media', 'supports', 'font-face', 'keyframes', 'page'])
const PROHIBITED_SELECTOR_PATTERNS = [/\[/, /:has\s*\(/i]
const DANGEROUS_VALUE_PATTERNS = [/url\s*\(/i, /expression\s*\(/i, /@import/i, /behavior\s*:/i, /-moz-binding\s*:/i, /javascript:/i]

export function sanitizeHexColor(value: string | undefined | null, fallback: string): string {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    // Check for named colors
    if (NAMED_COLORS.has(normalized)) {
      return normalized
    }

    // Check for hex colors
    if (HEX_COLOR_REGEX.test(normalized)) {
      return normalized
    }

    // Check for rgb/rgba colors
    const rgbMatch = normalized.match(RGB_COLOR_REGEX)
    if (rgbMatch) {
      const [, r, g, b, a] = rgbMatch
      const rNum = parseInt(r, 10)
      const gNum = parseInt(g, 10)
      const bNum = parseInt(b, 10)

      // Validate RGB values are in range 0-255
      if (rNum >= 0 && rNum <= 255 && gNum >= 0 && gNum <= 255 && bNum >= 0 && bNum <= 255) {
        if (a !== undefined) {
          const aNum = parseFloat(a)
          // Validate alpha is in range 0-1
          if (aNum >= 0 && aNum <= 1) {
            return `rgba(${rNum}, ${gNum}, ${bNum}, ${aNum})`
          }
        } else {
          return `rgb(${rNum}, ${gNum}, ${bNum})`
        }
      }
    }

    // Check for hsl/hsla colors
    const hslMatch = normalized.match(HSL_COLOR_REGEX)
    if (hslMatch) {
      const [, h, s, l, a] = hslMatch
      const hNum = parseInt(h, 10)
      const sNum = parseInt(s, 10)
      const lNum = parseInt(l, 10)

      // Validate HSL values
      if (hNum >= 0 && hNum <= 360 && sNum >= 0 && sNum <= 100 && lNum >= 0 && lNum <= 100) {
        if (a !== undefined) {
          const aNum = parseFloat(a)
          if (aNum >= 0 && aNum <= 1) {
            return `hsla(${hNum}, ${sNum}%, ${lNum}%, ${aNum})`
          }
        } else {
          return `hsl(${hNum}, ${sNum}%, ${lNum}%)`
        }
      }
    }

    // Check for CSS variables
    if (CSS_VAR_REGEX.test(normalized)) {
      return normalized
    }
  }
  return fallback
}

export function sanitizeToken(value: string | undefined | null): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.replace(/[<>]/g, '').trim()
}

const isPropertyAllowed = (property: string): boolean => {
  const normalized = property.trim().toLowerCase()
  if (normalized.startsWith('--')) {
    return true
  }
  return ALLOWED_PROPERTIES.has(normalized)
}

const hasDangerousValue = (value: string): boolean =>
  DANGEROUS_VALUE_PATTERNS.some((pattern) => pattern.test(value))

export function sanitizeCustomCss(css: string | undefined | null): string {
  if (typeof css !== 'string') {
    return ''
  }

  try {
    const ast = csstree.parse(css, {
      parseValue: true,
      parseRulePrelude: true,
      parseAtrulePrelude: true,
      positions: false
    })

    csstree.walk(ast, (node: CssNode, item?: ListItem<CssNode> | null, list?: List<CssNode> | null) => {
      if (node.type === 'Atrule') {
        const name = node.name.toLowerCase()
        if (!ALLOWED_AT_RULES.has(name)) {
          if (list && item) {
            list.remove(item)
          }
          return
        }
        if (name === 'import') {
          if (list && item) {
            list.remove(item)
          }
          return
        }
      } else if (node.type === 'Rule') {
        const selector = node.prelude ? csstree.generate(node.prelude) : ''
        if (PROHIBITED_SELECTOR_PATTERNS.some((pattern) => pattern.test(selector))) {
          if (list && item) {
            list.remove(item)
          }
          return
        }

        if (!node.block || !node.block.children) {
          if (list && item) {
            list.remove(item)
          }
          return
        }

        let hasAllowedDeclarations = false
        node.block.children.forEach((declNode: CssNode, declItem, declList) => {
          if (!declList) {
            return
          }
          if (declNode.type !== 'Declaration') {
            if (declItem) {
              declList.remove(declItem)
            }
            return
          }
          if (!isPropertyAllowed(declNode.property)) {
            if (declItem) {
              declList.remove(declItem)
            }
            return
          }
          const value = declNode.value ? csstree.generate(declNode.value) : ''
          if (hasDangerousValue(value)) {
            if (declItem) {
              declList.remove(declItem)
            }
            return
          }
          hasAllowedDeclarations = true
        })

        if (!hasAllowedDeclarations && list && item) {
          list.remove(item)
        }
      }
    })

    return csstree.generate(ast).trim()
  } catch (error) {
    logError(error, { scope: 'sanitizeCustomCss' })
    return ''
  }
}

export function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--')
}

/**
 * Escape HTML special characters for safe embedding in HTML contexts.
 * Use for text content that should NOT render as HTML (titles, excerpts, etc.).
 */
export function escapeHtml(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    return ''
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
