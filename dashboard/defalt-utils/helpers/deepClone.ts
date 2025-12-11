/**
 * Deep Clone Utility
 *
 * Provides a consistent way to deep clone objects across the codebase.
 * Uses structuredClone when available, falls back to JSON for older environments.
 */

/**
 * Creates a deep clone of an object.
 *
 * @param value - The value to clone
 * @returns A deep clone of the value
 */
export function deepClone<T>(value: T): T {
  // Use structuredClone if available (modern browsers, Node 17+)
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  // Fallback for older environments
  return JSON.parse(JSON.stringify(value))
}
