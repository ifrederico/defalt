/**
 * Announcement Bar Section Schema
 *
 * A notification bar displayed at the top of the page.
 * Content is sourced from a Ghost page tagged with #announcement-bar.
 *
 * This unified schema includes both container styling and typography settings.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const announcementBarConfigSchema = z.object({
  // Container settings
  width: z.enum(['default', 'narrow']).default('default'),
  backgroundColor: z.string().default('#AC1E3E'),
  textColor: z.string().default('#ffffff'),
  dividerThickness: z.number().min(0).max(5).default(0),
  dividerColor: z.string().default('#e5e7eb'),
  paddingTop: z.number().min(0).max(100).default(8),
  paddingBottom: z.number().min(0).max(100).default(8),

  // Content/Typography settings (merged from announcement section)
  previewText: z.string().default('Tag #announcement-bar to a published Ghost page.'),
  typographySize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
  typographyWeight: z.enum(['light', 'default', 'bold']).default('default'),
  typographySpacing: z.enum(['tight', 'regular', 'wide']).default('regular'),
  typographyCase: z.enum(['default', 'uppercase']).default('default'),
  underlineLinks: z.boolean().default(true)
})

export type AnnouncementBarSectionConfig = z.infer<typeof announcementBarConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

export const announcementBarSettingsSchema: SettingSchema[] = [
  // --- Content Settings ---
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  {
    type: 'textarea',
    id: 'previewText',
    label: 'Preview text',
    default: 'Tag #announcement-bar to a published Ghost page.'
  },

  // --- Typography Settings ---
  {
    type: 'header',
    id: 'typography-header',
    label: 'Typography'
  },
  {
    type: 'select',
    id: 'typographySize',
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
    id: 'typographyWeight',
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
    id: 'typographySpacing',
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
    id: 'typographyCase',
    label: 'Case',
    default: 'default',
    iconOnly: true,
    options: [
      { label: 'Case sensitive', value: 'default', icon: 'CaseSensitive' },
      { label: 'Uppercase', value: 'uppercase', icon: 'CaseUpper' }
    ]
  },

  // --- Container Settings ---
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
    type: 'checkbox',
    id: 'underlineLinks',
    label: 'Underline links',
    default: true
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

  // --- Padding Settings ---
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
