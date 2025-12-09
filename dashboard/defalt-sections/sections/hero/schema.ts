/**
 * Hero Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// Zod config schema
export const heroConfigSchema = z.object({
  // Content
  heading: z.string().default(''),
  subheading: z.string().default(''),

  // Button
  showButton: z.boolean().default(true),
  buttonText: z.string().default(''),
  buttonLink: z.string().default(''),

  // Layout
  contentAlignment: z.enum(['left', 'center', 'right']).default('center'),
  contentWidth: z.enum(['regular', 'full']).default('full'),

  // Colors
  backgroundColor: z.string().default('#000000'),
  textColor: z.string().default('#ffffff'),
  buttonColor: z.string().default('#ffffff'),
  buttonTextColor: z.string().default('#000000'),

  // Padding
  paddingTop: z.number().min(0).max(200).default(64),
  paddingBottom: z.number().min(0).max(200).default(64)
})

export type HeroConfig = z.infer<typeof heroConfigSchema>

// UI settings schema
export const heroSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'content-header', label: 'Content' },
  { type: 'text', id: 'heading', label: 'Heading', default: '', placeholder: 'Enter heading' },
  { type: 'textarea', id: 'subheading', label: 'Subheading', default: '', placeholder: 'Enter subheading' },

  { type: 'header', id: 'button-header', label: 'Button' },
  { type: 'checkbox', id: 'showButton', label: 'Show button', default: true },
  { type: 'text', id: 'buttonText', label: 'Button text', default: '', placeholder: 'Learn more' },
  { type: 'url', id: 'buttonLink', label: 'Button link', default: '', placeholder: 'https://...' },

  { type: 'header', id: 'layout-header', label: 'Layout' },
  {
    type: 'radio',
    id: 'contentAlignment',
    label: 'Alignment',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' }
    ]
  },
  {
    type: 'radio',
    id: 'contentWidth',
    label: 'Width',
    default: 'full',
    options: [
      { label: 'Regular', value: 'regular' },
      { label: 'Full', value: 'full' }
    ]
  },

  { type: 'header', id: 'colors-header', label: 'Colors' },
  { type: 'color', id: 'backgroundColor', label: 'Background', default: '#000000' },
  { type: 'color', id: 'textColor', label: 'Text', default: '#ffffff' },
  { type: 'color', id: 'buttonColor', label: 'Button', default: '#ffffff' },
  { type: 'color', id: 'buttonTextColor', label: 'Button text', default: '#000000' },

  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 64, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 64, unit: 'px' }
]
