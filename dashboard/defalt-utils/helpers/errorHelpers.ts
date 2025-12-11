/**
 * Shared error handling utilities
 */

/**
 * Creates an AbortError for cancellation scenarios.
 * Uses DOMException when available, falls back to plain Error.
 */
export function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError')
  }
  const error = new Error('Aborted')
  error.name = 'AbortError'
  return error
}

/**
 * Type guard to check if an error is an AbortError.
 */
export function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  return (error as { name?: unknown }).name === 'AbortError'
}

/**
 * Throws an AbortError if the signal is already aborted.
 */
export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw createAbortError()
  }
}
