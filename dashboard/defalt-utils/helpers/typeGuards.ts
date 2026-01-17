export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Alias for backward compatibility
export const isPlainRecord = isPlainObject
