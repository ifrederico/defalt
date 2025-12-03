import { useContext } from 'react'
import { ThemeContext } from './ThemeContextBase'
import type { ThemeContextValue } from './ThemeContext.types'

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
