/**
 * Announcement Bar Section Defaults
 */

import type { AnnouncementBarSectionConfig } from './schema.js'

export const announcementBarDefaults: AnnouncementBarSectionConfig = {
  // Layout
  width: 'default',

  // Colors
  backgroundColor: '#AC1E3E',
  textColor: '#ffffff',

  // Spacing
  paddingTop: 8,
  paddingBottom: 8,
  dividerThickness: 0,

  // Typography
  typographySize: 'normal',
  typographyWeight: 'normal',
  typographySpacing: 'normal',
  typographyCase: 'default',
  underlineLinks: false,

  // Preview content
  previewText: 'Tag #announcement-bar to a published Ghost page.'
}
