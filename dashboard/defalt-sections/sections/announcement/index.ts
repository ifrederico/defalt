/**
 * Announcement Section
 *
 * The text content for the announcement bar.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { announcementConfigSchema, announcementSettingsSchema, type AnnouncementSectionConfig } from './schema.js'
import { announcementDefaults } from './defaults.js'

/**
 * Announcement section definition
 */
export const definition: SectionDefinition<typeof announcementConfigSchema> = {
  id: 'announcement',
  label: 'Announcement',
  description: 'The text content for the announcement bar',
  category: 'header',
  defaultVisibility: true,
  defaultPadding: { top: 0, bottom: 0 },

  // Zod schema for config validation
  configSchema: announcementConfigSchema,

  // UI settings schema for panel generation
  settingsSchema: announcementSettingsSchema,

  // No blocks
  blocksSchema: undefined,

  // Factory for default config
  createConfig: () => announcementDefaults

  // Note: Announcement text is rendered by announcement-bar template
}

// Re-export types for consumers
export type { AnnouncementSectionConfig }
export { announcementConfigSchema, announcementSettingsSchema, announcementDefaults }
