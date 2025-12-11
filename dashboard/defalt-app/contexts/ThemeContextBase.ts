import { createTypedContext } from '@defalt/utils/helpers/createTypedContext'
import type { ThemeContextValue } from './ThemeContext.types'

// Use factory to create context and hook together
export const [ThemeContext, useThemeContextInternal] = createTypedContext<ThemeContextValue>('Theme')
