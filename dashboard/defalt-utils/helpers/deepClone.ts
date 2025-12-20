/**
 * Deep Clone Utility
 *
 * Provides a consistent way to deep clone objects across the codebase.
 * Uses structuredClone for deep cloning.
 */

/**
 * Creates a deep clone of an object.
 *
 * @param value - The value to clone
 * @returns A deep clone of the value
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone !== 'function') {
    throw new Error('structuredClone is required for deepClone')
  }
  return structuredClone(value)
}
