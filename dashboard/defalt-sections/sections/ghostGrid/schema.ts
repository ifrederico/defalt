/**
 * Ghost Grid Section Schema
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

export type GhostGridCard = z.infer<typeof cardSchema>

// Zod config schema
export const ghostGridConfigSchema = z.object({
  // Cards
  cards: z.array(cardSchema).default([]),

  // Ghost tags
  leftColumnTag: z.string().default('#ghost-grid-1'),
  rightColumnTag: z.string().default('#ghost-grid-2'),

  // Colors
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515'),

  // Padding
  paddingTop: z.number().min(0).max(200).default(48),
  paddingBottom: z.number().min(0).max(200).default(48)
})

export type GhostGridSectionConfig = z.infer<typeof ghostGridConfigSchema>

// UI settings schema
export const ghostGridSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'tags-header', label: 'Ghost Tags' },
  { type: 'text', id: 'leftColumnTag', label: 'Left column tag', default: '#ghost-grid-1', placeholder: '#ghost-grid-1' },
  { type: 'text', id: 'rightColumnTag', label: 'Right column tag', default: '#ghost-grid-2', placeholder: '#ghost-grid-2' },

  { type: 'header', id: 'colors-header', label: 'Colors' },
  { type: 'color', id: 'backgroundColor', label: 'Background', default: '#ffffff' },
  { type: 'color', id: 'textColor', label: 'Text', default: '#151515' },

  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' }
]

// Blocks schema
export const ghostGridBlocksSchema: BlockSchema[] = [
  {
    type: 'card',
    name: 'Card',
    limit: 2,
    settings: [
      { type: 'text', id: 'title', label: 'Title', default: '' },
      { type: 'textarea', id: 'description', label: 'Description', default: '' },
      { type: 'text', id: 'buttonText', label: 'Button text', default: '' },
      { type: 'url', id: 'buttonLink', label: 'Button link', default: '' }
    ]
  }
]
