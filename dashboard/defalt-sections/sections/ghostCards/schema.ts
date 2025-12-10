/**
 * Ghost Cards Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// Zod config schema
export const ghostCardsConfigSchema = z.object({
  pageTitle: z.boolean().default(false),
  textAlignment: z.enum(['left', 'center', 'right']).default('left'),
  titleSize: z.enum(['small', 'normal', 'large']).default('normal'),
  paddingTop: z.number().min(0).max(200).default(48),
  paddingBottom: z.number().min(0).max(200).default(48)
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// UI settings schema
export const ghostCardsSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  { type: 'checkbox', id: 'pageTitle', label: 'Page title', default: false },
  {
    type: 'radio',
    id: 'textAlignment',
    label: 'Text alignment',
    default: 'left',
    iconOnly: true,
    options: [
      { label: 'Left', value: 'left', icon: 'AlignLeft' },
      { label: 'Center', value: 'center', icon: 'AlignCenter' },
      { label: 'Right', value: 'right', icon: 'AlignRight' }
    ]
  },
  {
    type: 'select',
    id: 'titleSize',
    label: 'Title size',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' }
    ]
  },
  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' }
]
