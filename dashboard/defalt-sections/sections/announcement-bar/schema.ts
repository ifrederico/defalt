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
  // Layout
  width: z.enum(['default', 'narrow']).default('default'),

  // Colors
  backgroundColor: z.string().default('#AC1E3E'),
  textColor: z.string().default('#ffffff'),

  // Spacing
  paddingTop: z.number().min(0).max(100).default(8),
  paddingBottom: z.number().min(0).max(100).default(8),
  dividerThickness: z.number().min(0).max(5).default(0),

  // Typography
  typographySize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
  typographyWeight: z.enum(['light', 'normal', 'bold']).default('normal'),
  typographySpacing: z.enum(['tight', 'normal', 'wide']).default('normal'),
  typographyCase: z.enum(['default', 'uppercase']).default('default'),
  underlineLinks: z.boolean().default(false),

  // Preview content (used in editor only)
  previewText: z.string().default('Tag #announcement-bar to a published Ghost page.')
})

export type AnnouncementBarSectionConfig = z.infer<typeof announcementBarConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

const layoutSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  {
    type: 'select',
    id: 'width',
    label: 'Width',
    default: 'default',
    options: [
      { label: 'Full width', value: 'default' },
      { label: 'Narrow', value: 'narrow' }
    ]
  }
]

const spacingSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'spacing-header',
    label: 'Spacing'
  },
  {
    type: 'range',
    id: 'paddingTop',
    label: 'Padding top',
    min: 0,
    max: 100,
    step: 1,
    default: 8,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'paddingBottom',
    label: 'Padding bottom',
    min: 0,
    max: 100,
    step: 1,
    default: 8,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'dividerThickness',
    label: 'Divider thickness',
    min: 0,
    max: 5,
    step: 1,
    default: 0,
    unit: 'px'
  }
]

const colorSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'colors-header',
    label: 'Colors'
  },
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background',
    default: '#AC1E3E'
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
    default: '#ffffff'
  }
]

const typographySettings: SettingSchema[] = [
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
    default: 'normal',
    options: [
      { label: 'Light', value: 'light' },
      { label: 'Normal', value: 'normal' },
      { label: 'Bold', value: 'bold' }
    ]
  },
  {
    type: 'select',
    id: 'typographySpacing',
    label: 'Spacing',
    default: 'normal',
    options: [
      { label: 'Tight', value: 'tight' },
      { label: 'Normal', value: 'normal' },
      { label: 'Wide', value: 'wide' }
    ]
  },
  {
    type: 'select',
    id: 'typographyCase',
    label: 'Case',
    default: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Uppercase', value: 'uppercase' }
    ]
  },
  {
    type: 'checkbox',
    id: 'underlineLinks',
    label: 'Underline links',
    default: false
  }
]

const contentSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'content-header',
    label: 'Preview Content'
  },
  {
    type: 'paragraph',
    id: 'content-info',
    content: 'Tag #announcement-bar to a published Ghost page. The preview text below is shown only in the editor.'
  },
  {
    type: 'textarea',
    id: 'previewText',
    label: 'Preview text',
    default: 'Tag #announcement-bar to a published Ghost page.'
  }
]

export const announcementBarSettingsSchema: SettingSchema[] = [
  ...layoutSettings,
  ...spacingSettings,
  ...colorSettings,
  ...typographySettings,
  ...contentSettings
]
