/**
 * Announcement Bar Section Definition
 *
 * A notification bar displayed at the top of the page.
 * Content is sourced from a Ghost page tagged with #announcement-bar.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { announcementBarConfigSchema, announcementBarSettingsSchema, type AnnouncementBarSectionConfig } from './schema.js'
import { announcementBarDefaults } from './defaults.js'

/**
 * Announcement bar section definition
 */
export const definition: SectionDefinition<typeof announcementBarConfigSchema> = {
  id: 'announcement-bar',
  label: 'Announcement Bar',
  description: 'A notification bar at the top of the page with customizable styling',
  category: 'header',
  defaultVisibility: true,
  defaultPadding: { top: 8, bottom: 8 },
  usesUnifiedPadding: true,

  // Zod schema for config validation
  configSchema: announcementBarConfigSchema,

  // UI settings schema for panel generation
  settingsSchema: announcementBarSettingsSchema,

  // No blocks for announcement bar
  blocksSchema: undefined,

  // Factory for default config
  createConfig: () => announcementBarDefaults,

  // Path to Handlebars template (relative to sections/)
  templatePath: 'announcement-bar/announcement-bar.hbs'
}

// Re-export types for consumers
export type { AnnouncementBarSectionConfig }
export { announcementBarConfigSchema, announcementBarSettingsSchema, announcementBarDefaults }
