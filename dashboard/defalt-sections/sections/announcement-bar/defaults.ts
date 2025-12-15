/**
 * Announcement Bar Section Defaults
 *
 * Engine V2: Block Architecture
 * Includes default announcement block for immediate usability.
 */

import {
  announcementBarConfigSchema,
  announcementBlockConfigSchema,
  type AnnouncementBarSectionConfig
} from './schema.js'

const baseDefaults = announcementBarConfigSchema.parse({})

export const announcementBarDefaults: AnnouncementBarSectionConfig = {
  ...baseDefaults,
  announcements: [
    {
      ...announcementBlockConfigSchema.parse({}),
      tag: '#announcement',
      text: '',
      link: ''
    }
  ]
}
