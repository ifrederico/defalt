/**
 * Ghost Cards Section Schema
 */

import { z } from 'zod'
import type { SettingSchema, BlockSchema } from '../../engine/schemaTypes.js'

// Card schema
const cardSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  buttonText: z.string().default(''),
  buttonLink: z.string().default('')
})

export type GhostCardsCard = z.infer<typeof cardSchema>

// Zod config schema
export const ghostCardsConfigSchema = z.object({
  // Cards
  cards: z.array(cardSchema).default([]),

  // Colors
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515'),

  // Padding
  paddingTop: z.number().min(0).max(200).default(48),
  paddingBottom: z.number().min(0).max(200).default(48)
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// UI settings schema
export const ghostCardsSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'colors-header', label: 'Colors' },
  { type: 'color', id: 'backgroundColor', label: 'Background', default: '#ffffff' },
  { type: 'color', id: 'textColor', label: 'Text', default: '#151515' },

  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' }
]

// Blocks schema
export const ghostCardsBlocksSchema: BlockSchema[] = [
  {
    type: 'card',
    name: 'Card',
    settings: [
      { type: 'text', id: 'title', label: 'Title', default: '' },
      { type: 'textarea', id: 'description', label: 'Description', default: '' },
      { type: 'text', id: 'buttonText', label: 'Button text', default: '' },
      { type: 'url', id: 'buttonLink', label: 'Button link', default: '' }
    ]
  }
]
