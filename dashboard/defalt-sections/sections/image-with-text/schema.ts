/**
 * Image With Text Section Schema
 *
 * Display an image alongside text content with optional call-to-action.
 * Uses shared presets from the engine for common fields.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  alignmentSettings,
  ghostPageTagSettings
} from '../../engine/commonSettings.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const imageWithTextConfigSchema = z.object({
  // Ghost integration
  ghostPageTag: z.string().default('#image-with-text'),

  // Image settings
  imagePosition: z.enum(['left', 'right']).default('left'),
  aspectRatio: z.enum(['default', '1:1', '3:4', '4:3', '16:9', '2:3']).default('default'),
  imageBorderRadius: z.number().min(0).max(96).default(0),
  imageWidth: z.enum(['1/2', '2/3', '3/4']).default('1/2'),

  // Layout
  showHeader: z.boolean().default(true),
  headerAlignment: z.enum(['left', 'center', 'right']).default('center'),
  containerWidth: z.enum(['default', 'narrow', 'full']).default('default'),
  gap: z.number().min(0).max(100).default(32),
  textAlignment: z.enum(['top', 'middle', 'bottom']).default('middle'),
  headingSize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal')
})

export type ImageWithTextSectionConfig = z.infer<typeof imageWithTextConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

const imagePositionSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'imagePosition',
    label: 'Image position',
    default: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' }
    ]
  }
]

const aspectRatioSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'aspectRatio',
    label: 'Aspect ratio',
    default: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Square (1:1)', value: '1:1' },
      { label: 'Portrait (3:4)', value: '3:4' },
      { label: 'Landscape (4:3)', value: '4:3' },
      { label: 'Widescreen (16:9)', value: '16:9' },
      { label: 'Tall (2:3)', value: '2:3' }
    ]
  }
]

const imageWidthSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'imageWidth',
    label: 'Image width',
    default: '1/2',
    options: [
      { label: 'Half (1/2)', value: '1/2' },
      { label: 'Two thirds (2/3)', value: '2/3' },
      { label: 'Three quarters (3/4)', value: '3/4' }
    ]
  }
]

const containerWidthSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'containerWidth',
    label: 'Container width',
    default: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Narrow', value: 'narrow' },
      { label: 'Full', value: 'full' }
    ]
  }
]

const textAlignmentSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'textAlignment',
    label: 'Text vertical alignment',
    default: 'middle',
    options: [
      { label: 'Top', value: 'top' },
      { label: 'Middle', value: 'middle' },
      { label: 'Bottom', value: 'bottom' }
    ]
  }
]

const headingSizeSettings: SettingSchema[] = [
  {
    type: 'select',
    id: 'headingSize',
    label: 'Heading size',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' },
      { label: 'X-Large', value: 'x-large' }
    ]
  }
]

const gapSettings: SettingSchema[] = [
  {
    type: 'range',
    id: 'gap',
    label: 'Gap',
    min: 0,
    max: 100,
    step: 4,
    default: 32,
    unit: 'px'
  }
]

const showHeaderSettings: SettingSchema[] = [
  {
    type: 'checkbox',
    id: 'showHeader',
    label: 'Show heading',
    default: true
  }
]

const imageBorderRadiusSettings: SettingSchema[] = [
  {
    type: 'range',
    id: 'imageBorderRadius',
    label: 'Image corner radius',
    min: 0,
    max: 96,
    step: 1,
    default: 0,
    unit: 'px'
  }
]

/**
 * Combined UI settings for Image With Text
 * Order: Content → Layout (Image + Container) → Style (Heading)
 */
export const imageWithTextSettingsSchema: SettingSchema[] = [
  // Content
  {
    type: 'header',
    id: 'content-header',
    label: 'Content'
  },
  ...ghostPageTagSettings,

  // Layout - Image settings
  {
    type: 'header',
    id: 'image-header',
    label: 'Image'
  },
  ...imagePositionSettings,
  ...imageWidthSettings,
  ...aspectRatioSettings,
  ...imageBorderRadiusSettings,

  // Layout - Container settings
  {
    type: 'header',
    id: 'layout-header',
    label: 'Layout'
  },
  ...containerWidthSettings,
  ...gapSettings,
  ...textAlignmentSettings,

  // Style - Heading settings
  {
    type: 'header',
    id: 'heading-header',
    label: 'Heading'
  },
  ...showHeaderSettings,
  ...alignmentSettings.map(s => ({ ...s, id: 'headerAlignment', label: 'Heading alignment' })),
  ...headingSizeSettings
]
