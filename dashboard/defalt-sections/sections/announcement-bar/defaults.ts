/**
 * Announcement Bar Section Defaults
 *
 * Engine V2: Block Architecture
 * Includes default announcement block for immediate usability.
 */

import type { AnnouncementBarSectionConfig } from './schema.js'

export const announcementBarDefaults: AnnouncementBarSectionConfig = {
  // Container settings
  width: 'default',
  backgroundColor: '#AC1E3E',
  textColor: '#ffffff',
  dividerThickness: 0,
  dividerColor: '#e5e7eb',
  paddingTop: 8,
  paddingBottom: 8,

  // Global typography
  typographySize: 'normal',
  typographySpacing: 'regular',
  typographyCase: 'default',
  underlineLinks: true,

  // Default announcement block
  announcements: [
    {
      text: 'Tag #announcement-bar to a published Ghost page.',
      link: '',
      typographySize: 'normal',
      typographyWeight: 'default',
      typographySpacing: 'regular',
      typographyCase: 'default'
    }
  ]
}
