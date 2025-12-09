/**
 * Header Section Definition
 *
 * The main navigation header for the site.
 * Controls layout, sticky behavior, search visibility, and typography.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { headerConfigSchema, headerSettingsSchema, type HeaderSectionConfig } from './schema.js'
import { headerDefaults } from './defaults.js'

/**
 * Header section definition
 */
export const definition: SectionDefinition<typeof headerConfigSchema> = {
  id: 'header',
  label: 'Header',
  description: 'Main navigation header with logo, menu, and search',
  category: 'header',
  defaultVisibility: true,
  defaultPadding: { top: 0, bottom: 0 },

  // Zod schema for config validation
  configSchema: headerConfigSchema,

  // UI settings schema for panel generation
  settingsSchema: headerSettingsSchema,

  // No blocks for header
  blocksSchema: undefined,

  // Factory for default config
  createConfig: () => headerDefaults

  // Note: Header uses theme's navigation.hbs partial, not our custom HBS renderer
}

// Re-export types for consumers
export type { HeaderSectionConfig }
export { headerConfigSchema, headerSettingsSchema, headerDefaults }
