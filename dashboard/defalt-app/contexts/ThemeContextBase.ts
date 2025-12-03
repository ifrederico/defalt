import { createContext } from 'react'
import type { ThemeContextValue } from './ThemeContext.types'

export const ThemeContext = createContext<ThemeContextValue | null>(null)
