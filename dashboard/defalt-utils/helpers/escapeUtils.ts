/**
 * Shared escape utilities for HTML, Handlebars, and RegExp string escaping.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts &, <, >, ", and ' to their HTML entity equivalents.
 *
 * @param value - The string to escape
 * @returns The escaped string, or empty string if input is falsy
 */
export function escapeHtml(value?: string): string {
  if (!value) return ''
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escapes a string for safe inclusion in Handlebars templates.
 * Extends HTML escaping with additional characters that have special meaning
 * in Handlebars: backticks, curly braces.
 *
 * @param value - The string to escape
 * @returns The escaped string, or empty string if input is not a string
 */
export function escapeHandlebarsString(value: string): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * Converts characters that have special meaning in RegExp to their escaped equivalents.
 *
 * @param value - The string to escape
 * @returns The escaped string safe for use in RegExp constructor
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
