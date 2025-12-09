/**
 * Announcement Bar Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { announcementBarConfigSchema, announcementBarSettingsSchema, type AnnouncementBarSectionConfig } from './schema.js'
import { announcementBarDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof announcementBarConfigSchema> = {
  id: 'announcement-bar',
  label: 'Announcement Bar',
  description: 'A notification bar at the top of the page',
  category: 'header',
  defaultVisibility: true,
  defaultPadding: { top: 8, bottom: 8 },
  configSchema: announcementBarConfigSchema,
  settingsSchema: announcementBarSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => announcementBarDefaults,
  templatePath: 'announcement-bar/announcement-bar.hbs'
}

export type { AnnouncementBarSectionConfig }
export { announcementBarConfigSchema, announcementBarSettingsSchema, announcementBarDefaults }
