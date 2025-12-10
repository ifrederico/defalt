/**
 * Announcement Bar Section Schema
 *
 * A notification bar displayed at the top of the page.
 * Content is sourced from a Ghost page tagged with #announcement-bar.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const announcementBarConfigSchema = z.object({
  width: z.enum(['default', 'narrow']).default('default'),
  backgroundColor: z.string().default('#AC1E3E'),
  textColor: z.string().default('#ffffff'),
  dividerThickness: z.number().min(0).max(5).default(0),
  dividerColor: z.string().default('#e5e7eb'),
  paddingTop: z.number().min(0).max(100).default(8),
  paddingBottom: z.number().min(0).max(100).default(8)
})

export type AnnouncementBarSectionConfig = z.infer<typeof announcementBarConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

export const announcementBarSettingsSchema: SettingSchema[] = [
  {
    type: 'header',
    id: 'appearance-header',
    label: 'Appearance'
  },
  {
    type: 'radio',
    id: 'width',
    label: 'Width',
    default: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Narrow', value: 'narrow' }
    ]
  },
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background color',
    default: '#AC1E3E'
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
    default: '#ffffff'
  },
  {
    type: 'range',
    id: 'dividerThickness',
    label: 'Divider',
    min: 0,
    max: 5,
    step: 1,
    default: 0,
    unit: 'px'
  },
  {
    type: 'color',
    id: 'dividerColor',
    label: 'Divider color',
    default: '#e5e7eb'
  },
  {
    type: 'header',
    id: 'padding-header',
    label: 'Padding'
  },
  {
    type: 'range',
    id: 'paddingTop',
    label: 'Top',
    min: 0,
    max: 100,
    step: 1,
    default: 8,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'paddingBottom',
    label: 'Bottom',
    min: 0,
    max: 100,
    step: 1,
    default: 8,
    unit: 'px'
  }
]
