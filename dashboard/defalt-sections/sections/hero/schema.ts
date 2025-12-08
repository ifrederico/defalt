/**
 * Hero Section Schema
 *
 * Defines the Zod config schema and UI settings schema for the Hero section.
 * Uses shared presets from the engine for common fields.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  // Zod shapes for spreading
  darkBackgroundShape,
  alignmentShape,
  widthShape,
  heightModeShape,
  cardBorderRadiusShape,
  // UI Settings presets
  darkBackgroundSettings,
  alignmentSettings,
  widthSettings,
  heightModeSettings,
  cardBorderRadiusSettings,
  buttonToggleSettings
} from '../../engine/commonSettings.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

/**
 * Hero-specific placeholder content schema
 */
const placeholderSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  imageUrl: z.string().optional(),
  buttonText: z.string().default(''),
  buttonHref: z.string().default('')
})

/**
 * Full Hero config schema using shared presets
 */
export const heroConfigSchema = z.object({
  // Ghost integration
  ghostPageTag: z.string().default('hero-preview'),

  // Hero-specific content
  placeholder: placeholderSchema.default({}),

  // Image position (hero-specific)
  imagePosition: z.enum(['background', 'left', 'right']).default('background'),

  // Shared layout settings (spread from commonSettings)
  ...alignmentShape,
  ...widthShape,
  ...heightModeShape,

  // Shared color settings (dark theme for hero)
  ...darkBackgroundShape,

  // Shared button settings
  showButton: z.boolean().default(true),
  buttonColor: z.string().default('#ffffff'),
  buttonTextColor: z.string().default('#151515'),
  buttonBorderRadius: z.number().min(0).max(50).default(3),

  // Shared border radius (card)
  ...cardBorderRadiusShape
})

export type HeroConfig = z.infer<typeof heroConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

/**
 * Hero-specific content settings
 */
const heroContentSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  {
    type: 'text',
    id: 'placeholder.title',
    label: 'Heading',
    default: '',
    placeholder: 'Enter heading text'
  },
  {
    type: 'textarea',
    id: 'placeholder.description',
    label: 'Subheading',
    default: '',
    placeholder: 'Enter subheading text'
  }
]

/**
 * Hero-specific button content (text + link)
 */
const heroButtonContentSettings: SettingSchema[] = [
  {
    type: 'text',
    id: 'placeholder.buttonText',
    label: 'Button text',
    default: '',
    placeholder: 'Learn more'
  },
  {
    type: 'url',
    id: 'placeholder.buttonHref',
    label: 'Button link',
    default: '',
    placeholder: 'https://...'
  }
]

/**
 * Combined UI settings for the Hero section
 * Uses shared presets with hero-specific overrides
 */
export const heroSettingsSchema: SettingSchema[] = [
  // Content
  ...heroContentSettings,

  // Layout section
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  ...alignmentSettings,
  ...widthSettings,
  ...heightModeSettings,
  ...cardBorderRadiusSettings,

  // Colors section
  {
    type: 'header',
    id: 'colors-header',
    label: 'Colors'
  },
  ...darkBackgroundSettings,

  // Button section
  {
    type: 'header',
    id: 'button-header',
    label: 'Button'
  },
  ...buttonToggleSettings,
  ...heroButtonContentSettings,
  // Override button style defaults for hero (inverted colors)
  {
    type: 'color',
    id: 'buttonColor',
    label: 'Button color',
    default: '#ffffff'
  },
  {
    type: 'color',
    id: 'buttonTextColor',
    label: 'Button text color',
    default: '#151515'
  },
  {
    type: 'range',
    id: 'buttonBorderRadius',
    label: 'Button corner radius',
    min: 0,
    max: 50,
    step: 1,
    default: 3,
    unit: 'px'
  }
]
