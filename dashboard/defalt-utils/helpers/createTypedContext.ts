/**
 * Typed Context Factory
 *
 * Creates a React context with a typed hook that throws if used outside provider.
 * Eliminates boilerplate of creating separate ContextBase.ts and useContext.ts files.
 *
 * @example
 * // Before: 2 files, 15 lines
 * // ThemeContextBase.ts + useThemeContext.ts
 *
 * // After: 1 line
 * export const [ThemeContext, useThemeContext] = createTypedContext<ThemeContextValue>('Theme')
 */

import { createContext, useContext } from 'react'

/**
 * Creates a typed React context and its corresponding hook.
 *
 * @param name - Context name for error messages (e.g., 'Theme', 'Workspace')
 * @returns Tuple of [Context, useContextHook]
 */
export function createTypedContext<T>(name: string) {
  const Context = createContext<T | null>(null)
  Context.displayName = `${name}Context`

  function useTypedContext(): T {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`use${name}Context must be used within a ${name}Provider`)
    }
    return context
  }

  return [Context, useTypedContext] as const
}
