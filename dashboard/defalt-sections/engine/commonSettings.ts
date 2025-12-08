/**
 * Common Settings - Reusable setting presets for sections
 *
 * Instead of defining padding, background, etc. in every section,
 * import these presets and spread them into your settingsSchema:
 *
 * @example
 * import { paddingSettings, backgroundSettings } from '../../engine/commonSettings'
 *
 * export const heroSettingsSchema = [
 *   ...backgroundSettings,
 *   ...paddingSettings,
 *   { type: 'text', id: 'heading', label: 'Heading' }
 * ]
 */

import { z } from 'zod'
import type { SettingSchema } from './schemaTypes.js'

// =============================================================================
// Zod Schema Fragments (for config validation)
// =============================================================================

/**
 * Standard padding config schema
 */
export const paddingConfigSchema = z.object({
  paddingTop: z.number().min(0).max(200).default(32),
  paddingBottom: z.number().min(0).max(200).default(32)
})

/**
 * Extended padding with left/right
 */
export const fullPaddingConfigSchema = z.object({
  paddingTop: z.number().min(0).max(200).default(32),
  paddingBottom: z.number().min(0).max(200).default(32),
  paddingLeft: z.number().min(0).max(200).default(0),
  paddingRight: z.number().min(0).max(200).default(0)
})

/**
 * Standard background config schema
 */
export const backgroundConfigSchema = z.object({
  backgroundColor: z.string().default('#ffffff')
})

/**
 * Text colors config schema
 */
export const textColorsConfigSchema = z.object({
  textColor: z.string().default('#000000'),
  headingColor: z.string().default('#000000')
})

/**
 * Border radius config schema
 */
export const borderRadiusConfigSchema = z.object({
  borderRadius: z.number().min(0).max(96).default(0)
})

/**
 * Button styling config schema
 */
export const buttonConfigSchema = z.object({
  showButton: z.boolean().default(true),
  buttonText: z.string().default(''),
  buttonHref: z.string().default(''),
  buttonColor: z.string().default('#000000'),
  buttonTextColor: z.string().default('#ffffff'),
  buttonBorderRadius: z.number().min(0).max(50).default(3)
})

/**
 * Content alignment config schema
 */
export const alignmentConfigSchema = z.object({
  contentAlignment: z.enum(['left', 'center', 'right']).default('center')
})

/**
 * Width mode config schema
 */
export const widthConfigSchema = z.object({
  contentWidth: z.enum(['narrow', 'regular', 'wide', 'full']).default('regular')
})

// =============================================================================
// UI Settings Presets (for settings panel generation)
// =============================================================================

/**
 * Standard padding settings (top/bottom)
 * Injects two range sliders for section padding control
 */
export const paddingSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'padding-header',
    label: 'Spacing'
  },
  {
    type: 'range',
    id: 'paddingTop',
    label: 'Top padding',
    min: 0,
    max: 200,
    step: 4,
    default: 32,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'paddingBottom',
    label: 'Bottom padding',
    min: 0,
    max: 200,
    step: 4,
    default: 32,
    unit: 'px'
  }
]

/**
 * Unified padding setting (single control for all sides)
 */
export const unifiedPaddingSettings: SettingSchema[] = [
  {
    type: 'range',
    id: 'padding',
    label: 'Padding',
    min: 0,
    max: 200,
    step: 4,
    default: 32,
    unit: 'px'
  }
]

/**
 * Background color setting
 */
export const backgroundSettings: SettingSchema[] = [
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background',
    default: '#ffffff'
  }
]

/**
 * Dark background preset (for sections with light text)
 */
export const darkBackgroundSettings: SettingSchema[] = [
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background',
    default: '#000000'
  }
]

/**
 * Text color settings
 */
export const textColorSettings: SettingSchema[] = [
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
    default: '#000000'
  }
]

/**
 * Full text colors (heading + body)
 */
export const fullTextColorSettings: SettingSchema[] = [
  {
    type: 'color',
    id: 'headingColor',
    label: 'Heading color',
    default: '#000000'
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
    default: '#000000'
  }
]

/**
 * Border radius setting
 */
export const borderRadiusSettings: SettingSchema[] = [
  {
    type: 'range',
    id: 'borderRadius',
    label: 'Corner radius',
    min: 0,
    max: 96,
    step: 1,
    default: 0,
    unit: 'px'
  }
]

/**
 * Card border radius setting (larger default)
 */
export const cardBorderRadiusSettings: SettingSchema[] = [
  {
    type: 'range',
    id: 'cardBorderRadius',
    label: 'Card corner radius',
    min: 0,
    max: 96,
    step: 1,
    default: 24,
    unit: 'px'
  }
]

/**
 * Button visibility toggle
 */
export const buttonToggleSettings: SettingSchema[] = [
  {
    type: 'checkbox',
    id: 'showButton',
    label: 'Show button',
    default: true
  }
]

/**
 * Button content settings (text + link)
 */
export const buttonContentSettings: SettingSchema[] = [
  {
    type: 'text',
    id: 'buttonText',
    label: 'Button text',
    default: '',
    placeholder: 'Learn more'
  },
  {
    type: 'url',
    id: 'buttonHref',
    label: 'Button link',
    default: '',
    placeholder: 'https://...'
  }
]

/**
 * Button styling settings (colors + radius)
 */
export const buttonStyleSettings: SettingSchema[] = [
  {
    type: 'color',
    id: 'buttonColor',
    label: 'Button color',
    default: '#000000'
  },
  {
    type: 'color',
    id: 'buttonTextColor',
    label: 'Button text color',
    default: '#ffffff'
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

/**
 * Complete button settings (toggle + content + style)
 */
export const fullButtonSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'button-header',
    label: 'Button'
  },
  ...buttonToggleSettings,
  ...buttonContentSettings,
  ...buttonStyleSettings
]

/**
 * Content alignment setting
 */
export const alignmentSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'contentAlignment',
    label: 'Alignment',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' }
    ]
  }
]

/**
 * Content width setting
 */
export const widthSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'contentWidth',
    label: 'Content width',
    default: 'regular',
    options: [
      { label: 'Narrow', value: 'narrow' },
      { label: 'Regular', value: 'regular' },
      { label: 'Wide', value: 'wide' },
      { label: 'Full', value: 'full' }
    ]
  }
]

/**
 * Layout settings (alignment + width)
 */
export const layoutSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  ...alignmentSettings,
  ...widthSettings
]

// =============================================================================
// Section Header Presets
// =============================================================================

/**
 * Standard section header (heading + subheading)
 */
export const sectionHeaderSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  {
    type: 'text',
    id: 'heading',
    label: 'Heading',
    default: ''
  },
  {
    type: 'textarea',
    id: 'subheading',
    label: 'Subheading',
    default: ''
  }
]

/**
 * Section header with toggle visibility
 */
export const toggleableSectionHeaderSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  {
    type: 'checkbox',
    id: 'showHeader',
    label: 'Show heading',
    default: true
  },
  {
    type: 'text',
    id: 'heading',
    label: 'Heading',
    default: ''
  },
  {
    type: 'textarea',
    id: 'subheading',
    label: 'Subheading',
    default: ''
  }
]

// =============================================================================
// Color Scheme Presets
// =============================================================================

/**
 * Light color scheme settings
 */
export const lightSchemeSettings: SettingSchema[] = [
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
    label: 'Text',
    default: '#151515'
  }
]

/**
 * Dark color scheme settings
 */
export const darkSchemeSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'colors-header',
    label: 'Colors'
  },
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background',
    default: '#000000'
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text',
    default: '#ffffff'
  }
]

// =============================================================================
// Ghost Integration Settings
// =============================================================================

/**
 * Ghost page tag setting (for fetching dynamic content)
 */
export const ghostPageTagSettings: SettingSchema[] = [
  {
    type: 'text',
    id: 'ghostPageTag',
    label: 'Ghost tag',
    default: '',
    info: 'Tag to filter Ghost pages by',
    placeholder: '#section-name'
  }
]

// =============================================================================
// Zod Shape Exports (for spreading into section schemas)
// =============================================================================

/**
 * Export .shape from each schema for easy spreading
 *
 * @example
 * const myConfigSchema = z.object({
 *   ...backgroundShape,
 *   ...alignmentShape,
 *   myCustomField: z.string()
 * })
 */
export const paddingShape = paddingConfigSchema.shape
export const fullPaddingShape = fullPaddingConfigSchema.shape
export const backgroundShape = backgroundConfigSchema.shape
export const textColorsShape = textColorsConfigSchema.shape
export const borderRadiusShape = borderRadiusConfigSchema.shape
export const buttonShape = buttonConfigSchema.shape
export const alignmentShape = alignmentConfigSchema.shape
export const widthShape = widthConfigSchema.shape

/**
 * Dark background variant
 */
export const darkBackgroundConfigSchema = z.object({
  backgroundColor: z.string().default('#000000')
})
export const darkBackgroundShape = darkBackgroundConfigSchema.shape

/**
 * Card border radius variant (larger default)
 */
export const cardBorderRadiusConfigSchema = z.object({
  cardBorderRadius: z.number().min(0).max(96).default(24)
})
export const cardBorderRadiusShape = cardBorderRadiusConfigSchema.shape

/**
 * Height mode for expandable sections
 */
export const heightModeConfigSchema = z.object({
  heightMode: z.enum(['regular', 'expand']).default('regular')
})
export const heightModeShape = heightModeConfigSchema.shape

/**
 * Height mode UI settings
 */
export const heightModeSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'heightMode',
    label: 'Height',
    default: 'regular',
    options: [
      { label: 'Regular', value: 'regular' },
      { label: 'Expand', value: 'expand' }
    ]
  }
]
