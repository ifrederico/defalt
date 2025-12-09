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
  text: z.string().default('Tag #announcement-bar to a published Ghost page.'),
  size: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
  weight: z.enum(['light', 'default', 'bold']).default('default'),
  spacing: z.enum(['tight', 'regular', 'wide']).default('regular'),
  case: z.enum(['default', 'uppercase']).default('default')
})

export type AnnouncementSectionConfig = z.infer<typeof announcementConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

export const announcementSettingsSchema: SettingSchema[] = [
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  {
    type: 'textarea',
    id: 'text',
    label: 'Preview text',
    default: 'Tag #announcement-bar to a published Ghost page.'
  },
  {
    type: 'header',
    id: 'typography-header',
    label: 'Typography'
  },
  {
    type: 'select',
    id: 'size',
    label: 'Size',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' },
      { label: 'X-Large', value: 'x-large' }
    ]
  },
  {
    type: 'select',
    id: 'weight',
    label: 'Weight',
    default: 'default',
    options: [
      { label: 'Light', value: 'light' },
      { label: 'Default', value: 'default' },
      { label: 'Bold', value: 'bold' }
    ]
  },
  {
    type: 'select',
    id: 'spacing',
    label: 'Spacing',
    default: 'regular',
    options: [
      { label: 'Tight', value: 'tight' },
      { label: 'Regular', value: 'regular' },
      { label: 'Wide', value: 'wide' }
    ]
  },
  {
    type: 'radio',
    id: 'case',
    label: 'Case',
    default: 'default',
    iconOnly: true,
    options: [
      { label: 'Case sensitive', value: 'default', icon: 'CaseSensitive' },
      { label: 'Uppercase', value: 'uppercase', icon: 'CaseUpper' }
    ]
  }
]
