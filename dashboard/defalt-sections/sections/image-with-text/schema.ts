/**
 * Image With Text Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import { createPaddingConfigSchema, createPaddingSettings } from '../../engine/commonSettings.js'

// Reusable schemas from commonSettings
const paddingSchema = createPaddingConfigSchema({ defaultTop: 48, defaultBottom: 48 })

// Zod config schema
export const imageWithTextConfigSchema = z.object({
  // Ghost tag for content filtering
  tag: z.string().default('#image-text'),

  // Image settings
  imagePosition: z.enum(['left', 'right']).default('left'),

  // Colors
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515')
}).merge(paddingSchema)

export type ImageWithTextSectionConfig = z.infer<typeof imageWithTextConfigSchema>

// UI settings schema
export const imageWithTextSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'layout-header', label: 'Layout' },
  {
    type: 'select',
    id: 'imagePosition',
    label: 'Image position',
    default: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' }
    ]
  },

  { type: 'header', id: 'colors-header', label: 'Colors' },
  { type: 'color', id: 'backgroundColor', label: 'Background', default: '#ffffff' },
  { type: 'color', id: 'textColor', label: 'Text', default: '#151515' },

  // Padding settings from commonSettings
  ...createPaddingSettings({ defaultTop: 48, defaultBottom: 48 })
]
