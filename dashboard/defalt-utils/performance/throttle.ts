export type ThrottledFunction<T extends (...args: unknown[]) => unknown> = {
  (...args: Parameters<T>): void
  cancel: () => void
}

/**
 * Throttle utility (Puck pattern)
 * Limits function execution to once per time limit, with trailing edge execution
 * Returns a function with a `.cancel()` method to clear pending trailing calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ThrottledFunction<T> {
  let lastRan = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = performance.now()

    if (now - lastRan >= limit) {
      func.apply(this, args)
      lastRan = now
    } else {
      // Schedule trailing edge execution
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        lastRan = performance.now()
      }, limit - (now - lastRan))
    }
  } as ThrottledFunction<T>

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return throttled
}
