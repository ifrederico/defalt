/**
 * Announcement Bar Section Definition
 *
 * Engine V2: Block Architecture
 * Uses blocksSchema for repeatable announcement items.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import {
  announcementBarConfigSchema,
  announcementBarSettingsSchema,
  announcementBarBlocksSchema,
  type AnnouncementBarSectionConfig,
  type AnnouncementBlockConfig
} from './schema.js'
import { announcementBarDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof announcementBarConfigSchema> = {
  id: 'announcement-bar',
  label: 'Announcement Bar',
  description: 'A notification bar at the top of the page',
  tag: '#announcement',
  category: 'header',
  defaultVisibility: true,
  defaultPadding: { top: 8, bottom: 8 },
  configSchema: announcementBarConfigSchema,
  settingsSchema: announcementBarSettingsSchema,
  // Note: blocksSchema omitted - announcements are handled custom in sidebar tree
  createConfig: () => announcementBarDefaults,
  templatePath: 'announcement-bar/announcement-bar.hbs'
}

export type { AnnouncementBarSectionConfig, AnnouncementBlockConfig }
export { announcementBarConfigSchema, announcementBarSettingsSchema, announcementBarBlocksSchema, announcementBarDefaults }
