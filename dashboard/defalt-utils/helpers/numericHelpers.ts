/**
 * Centralized numeric value sanitization and resolution utilities.
 * Used for padding, margin, and other numeric settings across the app.
 */

/**
 * Normalizes a boolean value, returning the default if not a boolean.
 *
 * @param value - The value to normalize
 * @param defaultValue - Value to return if input is not a boolean
 * @returns A boolean value
 */
export function normalizeBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  return defaultValue
}

/**
 * Normalizes a numeric value, ensuring it's a valid finite number.
 * Returns default value if input is undefined, null, NaN, or Infinity.
 *
 * @param value - The value to normalize
 * @param defaultValue - Value to return if input is invalid
 * @returns A finite number
 */
export function normalizeNumericValue(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return defaultValue
}

/**
 * Clamps a number between min and max values.
 * Returns min if value is not finite.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped number
 */
export function clampValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

/**
 * Rounds a value to a specific step increment.
 *
 * @param value - The value to round
 * @param step - The step increment (default: 1)
 * @returns Rounded value
 */
export function roundToStep(value: number, step = 1): number {
  if (!Number.isFinite(value) || step <= 0) {
    return value
  }
  return Math.round(value / step) * step
}

/**
 * Sanitizes a numeric value, ensuring it's a valid finite number.
 * Returns default value if input is undefined, null, NaN, or Infinity.
 *
 * @param value - The value to sanitize
 * @param defaultValue - Value to return if input is invalid (default: 0)
 * @param min - Optional minimum value to clamp to
 * @returns Sanitized number
 */
export function sanitizeNumericValue(
  value: unknown,
  defaultValue = 0,
  min?: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultValue
  }
  if (min !== undefined) {
    return Math.max(min, value)
  }
  return value
}

/**
 * Resolves a numeric value with an optional default.
 * Returns undefined if both value and default are invalid.
 *
 * @param value - Primary value to check
 * @param defaultValue - Default value if primary is invalid
 * @param min - Optional minimum value to clamp to
 * @returns Resolved number or undefined
 */
export function resolveNumericValue(
  value: unknown,
  defaultValue?: number,
  min?: number
): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return min !== undefined ? Math.max(min, value) : value
  }
  if (typeof defaultValue === 'number' && Number.isFinite(defaultValue)) {
    return min !== undefined ? Math.max(min, defaultValue) : defaultValue
  }
  return undefined
}

export type MarginPair = { top?: number; bottom?: number }

/**
 * Resolves a margin pair (top/bottom) from value and defaults.
 * Used for section margins that have optional top/bottom values.
 *
 * @param margin - Current margin settings
 * @param defaults - Default margin values
 * @returns Resolved margin pair with top/bottom values
 */
export function resolveMarginPair(
  margin: MarginPair | undefined,
  defaults: MarginPair | undefined
): { top: number | undefined; bottom: number | undefined } {
  return {
    top: resolveNumericValue(margin?.top, defaults?.top, 0),
    bottom: resolveNumericValue(margin?.bottom, defaults?.bottom, 0)
  }
}

export type PaddingPair = { top: number; bottom: number }

/**
 * Resolves a padding pair (top/bottom) from value and defaults.
 * Always returns numbers (uses 0 as final default).
 *
 * @param padding - Current padding settings
 * @param defaults - Default padding values
 * @returns Resolved padding pair with guaranteed top/bottom numbers
 */
export function resolvePaddingPair(
  padding: Partial<PaddingPair> | undefined,
  defaults: Partial<PaddingPair> | undefined
): PaddingPair {
  return {
    top: sanitizeNumericValue(padding?.top, sanitizeNumericValue(defaults?.top, 0), 0),
    bottom: sanitizeNumericValue(padding?.bottom, sanitizeNumericValue(defaults?.bottom, 0), 0)
  }
}
