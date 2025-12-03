/**
 * Throttle utility (Puck pattern)
 * Limits function execution to once per time limit, with trailing edge execution
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastRan = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: Parameters<T>) {
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
  }
}

/**
 * Debounce utility
 * Delays function execution until after wait ms have passed since last call
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * Scroll end detection (Puck pattern)
 * Calls callback after scroll activity stops (50ms debounce)
 */
export function onScrollEnd(
  element: Document | Element | null | undefined,
  callback: () => void
): () => void {
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined

  const handleScroll = () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    scrollTimeout = setTimeout(() => {
      callback()
      element?.removeEventListener('scroll', handleScroll)
    }, 50)
  }

  element?.addEventListener('scroll', handleScroll, { passive: true })

  // Fallback if no scroll happens
  setTimeout(() => {
    if (!scrollTimeout) {
      callback()
    }
  }, 50)

  return () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    element?.removeEventListener('scroll', handleScroll)
  }
}
