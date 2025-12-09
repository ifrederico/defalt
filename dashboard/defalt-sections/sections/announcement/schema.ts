/**
 * Announcement Section Schema
 *
 * The text content for the announcement bar.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const announcementConfigSchema = z.object({
  text: z.string().default('Tag #announcement-bar to a published Ghost page.')
})

export type AnnouncementSectionConfig = z.infer<typeof announcementConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

export const announcementSettingsSchema: SettingSchema[] = [
  {
    type: 'text',
    id: 'text',
    label: 'Text',
    default: 'Tag #announcement-bar to a published Ghost page.'
  }
]
