/**
 * Image With Text Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// Zod config schema
export const imageWithTextConfigSchema = z.object({
  // Ghost integration
  ghostPageTag: z.string().default('#image-with-text'),

  // Image settings
  imagePosition: z.enum(['left', 'right']).default('left'),

  // Colors
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515'),

  // Padding
  paddingTop: z.number().min(0).max(200).default(48),
  paddingBottom: z.number().min(0).max(200).default(48)
})

export type ImageWithTextSectionConfig = z.infer<typeof imageWithTextConfigSchema>

// UI settings schema
export const imageWithTextSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'content-header', label: 'Content' },
  { type: 'text', id: 'ghostPageTag', label: 'Ghost page tag', default: '#image-with-text', placeholder: '#image-with-text' },

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

  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' }
]
