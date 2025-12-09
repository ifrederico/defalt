/**
 * Ghost Cards Section Schema
 *
 * A three-card grid for displaying Ghost pages or manual content.
 * Uses shared presets from the engine for common fields.
 */

import { z } from 'zod'
import type { SettingSchema, BlockSchema } from '../../engine/schemaTypes.js'
import {
  // Zod shapes
  paddingShape,
  // UI presets
  alignmentSettings,
  toggleableSectionHeaderSettings,
  ghostPageTagSettings,
  paddingSettings
} from '../../engine/commonSettings.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

/**
 * Individual card config
 */
const cardConfigSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  buttonText: z.string().default(''),
  buttonHref: z.string().default('')
})

export type GhostCardsCardConfig = z.infer<typeof cardConfigSchema>

/**
 * Full Ghost Cards config schema
 */
export const ghostCardsConfigSchema = z.object({
  // Ghost integration
  ghostPageTag: z.string().default('#ghost-card'),

  // Section header
  heading: z.string().default(''),
  subheading: z.string().default(''),
  showHeader: z.boolean().default(true),

  // Header styling
  headerAlignment: z.enum(['left', 'center', 'right']).default('center'),
  titleSize: z.enum(['small', 'normal', 'large']).default('normal'),

  // Cards array (for manual content)
  cards: z.array(cardConfigSchema).default([]),

  // Colors (section-specific, not using shared because of custom fields)
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515'),
  cardBackgroundColor: z.string().default('#ffffff'),
  cardBorderColor: z.string().default('#e6e6e6'),
  buttonColor: z.string().default('#151515'),

  // Shared padding
  ...paddingShape
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

/**
 * Title size setting
 */
const titleSizeSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'titleSize',
    label: 'Heading size',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' }
    ]
  }
]

/**
 * Ghost Cards specific color settings
 */
const ghostCardsColorSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'colors-header',
    label: 'Colors'
  },
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background',
    default: '#ffffff'
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
    default: '#151515'
  },
  {
    type: 'color',
    id: 'cardBackgroundColor',
    label: 'Card background',
    default: '#ffffff'
  },
  {
    type: 'color',
    id: 'cardBorderColor',
    label: 'Card border',
    default: '#e6e6e6'
  },
  {
    type: 'color',
    id: 'buttonColor',
    label: 'Button color',
    default: '#151515'
  }
]

/**
 * Combined UI settings for Ghost Cards
 * Order: Content → Layout → Style (Colors)
 */
export const ghostCardsSettingsSchema: SettingSchema[] = [
  // Content (header with toggle + Ghost tag)
  ...toggleableSectionHeaderSettings,
  ...ghostPageTagSettings,

  // Layout
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  ...alignmentSettings.map(s => ({ ...s, id: 'headerAlignment', label: 'Heading alignment' })),
  ...titleSizeSettings,

  // Spacing
  ...paddingSettings,

  // Style (Colors)
  ...ghostCardsColorSettings
]

// =============================================================================
// Blocks Schema
// =============================================================================

/**
 * Card block for manual content
 */
export const ghostCardsBlocksSchema: BlockSchema[] = [
  {
    type: 'card',
    name: 'Card',
    settings: [
      { type: 'text', id: 'title', label: 'Title', default: '' },
      { type: 'textarea', id: 'description', label: 'Description', default: '' },
      { type: 'text', id: 'buttonText', label: 'Button label', default: '' },
      { type: 'url', id: 'buttonHref', label: 'Button link', default: '' }
    ]
  }
]
