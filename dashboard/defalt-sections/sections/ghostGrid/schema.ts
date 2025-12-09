/**
 * Ghost Grid Section Schema
 *
 * A two-column grid for displaying Ghost pages side-by-side.
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
  paddingSettings
} from '../../engine/commonSettings.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

const cardConfigSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  buttonText: z.string().default(''),
  buttonHref: z.string().default('')
})

export type GhostGridCardConfig = z.infer<typeof cardConfigSchema>

export const ghostGridConfigSchema = z.object({
  // Section header
  heading: z.string().default(''),
  subheading: z.string().default(''),
  showHeader: z.boolean().default(true),

  // Ghost column tags
  leftColumnTag: z.string().default('#ghost-grid-1'),
  rightColumnTag: z.string().default('#ghost-grid-2'),

  // Cards for manual content
  cards: z.array(cardConfigSchema).default([]),

  // Header styling
  headerAlignment: z.enum(['left', 'center', 'right']).default('center'),
  titleSize: z.enum(['small', 'normal', 'large']).default('normal'),

  // Layout
  stackOnMobile: z.boolean().default(true),
  columnGap: z.number().min(0).max(100).default(20),

  // Colors
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#151515'),
  cardBackgroundColor: z.string().default('#ffffff'),
  cardBorderColor: z.string().default('#e6e6e6'),
  buttonColor: z.string().default('#151515'),

  // Shared padding
  ...paddingShape
})

export type GhostGridSectionConfig = z.infer<typeof ghostGridConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

const columnTagSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'columns-header',
    label: 'Columns'
  },
  {
    type: 'text',
    id: 'leftColumnTag',
    label: 'Left column tag',
    default: '#ghost-grid-1',
    info: 'Tag for left column page',
    placeholder: '#ghost-grid-1'
  },
  {
    type: 'text',
    id: 'rightColumnTag',
    label: 'Right column tag',
    default: '#ghost-grid-2',
    info: 'Tag for right column page',
    placeholder: '#ghost-grid-2'
  }
]

const layoutSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  {
    type: 'range',
    id: 'columnGap',
    label: 'Column gap',
    min: 0,
    max: 100,
    step: 1,
    default: 20,
    unit: 'px'
  },
  {
    type: 'checkbox',
    id: 'stackOnMobile',
    label: 'Stack on mobile',
    default: true
  }
]

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

const ghostGridColorSettings: SettingSchema[] = [
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
 * Combined UI settings for Ghost Grid
 * Order: Content → Layout → Style (Colors)
 */
export const ghostGridSettingsSchema: SettingSchema[] = [
  // Content (header settings + column tags)
  ...toggleableSectionHeaderSettings,
  ...columnTagSettings,

  // Layout (spacing, alignment, typography)
  ...layoutSettings,
  ...alignmentSettings.map(s => ({ ...s, id: 'headerAlignment', label: 'Heading alignment' })),
  ...titleSizeSettings,

  // Spacing
  ...paddingSettings,

  // Style (Colors)
  ...ghostGridColorSettings
]

// =============================================================================
// Blocks Schema
// =============================================================================

export const ghostGridBlocksSchema: BlockSchema[] = [
  {
    type: 'card',
    name: 'Card',
    limit: 2,
    settings: [
      { type: 'text', id: 'title', label: 'Title', default: '' },
      { type: 'textarea', id: 'description', label: 'Description', default: '' },
      { type: 'text', id: 'buttonText', label: 'Button label', default: '' },
      { type: 'url', id: 'buttonHref', label: 'Button link', default: '' }
    ]
  }
]
