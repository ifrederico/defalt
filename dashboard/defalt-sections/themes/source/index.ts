/**
 * Source Theme Definition
 *
 * The Ghost Source theme - the primary theme supported by Defalt.
 * This theme features a clean, minimalist design focused on content.
 */

import type { ThemeDefinition } from '../../engine/themeSchemaTypes.js'
import { sourceThemeConfigSchema, sourceThemeSettingsGroups, type SourceThemeConfig } from './schema.js'
import { sourceThemeDefaults } from './defaults.js'

/**
 * Source theme definition
 */
export const definition: ThemeDefinition<typeof sourceThemeConfigSchema> = {
  id: 'source',
  label: 'Source',
  description: 'A clean, minimalist theme focused on content. The default Ghost theme.',
  version: '1.0.0',

  // Zod schema for config validation
  configSchema: sourceThemeConfigSchema,

  // UI settings schema organized by groups
  settingsSchema: sourceThemeSettingsGroups,

  // Factory for default config
  createConfig: () => sourceThemeDefaults
}

// Re-export types for consumers
export type { SourceThemeConfig }
export { sourceThemeConfigSchema, sourceThemeSettingsGroups, sourceThemeDefaults }
