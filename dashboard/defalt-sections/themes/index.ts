/**
 * Theme Registry
 *
 * Central export for all supported themes.
 * Add new themes here as they are implemented.
 */

export * from './source/index.js'
export { definition as sourceThemeDefinition } from './source/index.js'

// Theme types
export type { ThemeDefinition, ThemeSettingsGroup, ThemePadding, ThemeMargin } from '../engine/themeSchemaTypes.js'
