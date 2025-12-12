/**
 * Image With Text Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import { createPaddingConfigSchema } from '../../engine/commonSettings.js'

// Reusable schemas from commonSettings
const paddingSchema = createPaddingConfigSchema({ defaultTop: 48, defaultBottom: 48 })

// Zod config schema
export const imageWithTextConfigSchema = z.object({
  // Ghost tag for content filtering
  tag: z.string().default('#image-text'),

  // Appearance
  contentWidth: z.enum(['720px', '960px', '1120px', '1320px', 'none']).default('1120px'),
  pageTitle: z.boolean().default(true),
  textAlignment: z.enum(['left', 'center', 'right']).default('left'),
  imageAspect: z.enum(['default', 'square', 'portrait', 'landscape', 'wide', 'tall']).default('default'),
  imageBorderRadius: z.number().min(0).max(96).default(0),

  // Layout
  invert: z.boolean().optional(),
  imageWidth: z.enum(['1/2', '2/3', '3/4']).default('1/2'),

  // Backward compatibility
  imagePosition: z.enum(['left', 'right']).default('left'),
}).merge(paddingSchema)

export type ImageWithTextSectionConfig = z.infer<typeof imageWithTextConfigSchema>

// UI settings schema
export const imageWithTextSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  {
    type: 'select',
    id: 'contentWidth',
    label: 'Width',
    default: '1120px',
    options: [
      { label: 'Narrow', value: '720px' },
      { label: 'Medium', value: '960px' },
      { label: 'Default', value: '1120px' },
      { label: 'Wide', value: '1320px' },
      { label: 'Full', value: 'none' }
    ]
  },
  { type: 'checkbox', id: 'pageTitle', label: 'Page title', default: true },
  {
    type: 'radio',
    id: 'textAlignment',
    label: 'Title alignment',
    default: 'left',
    iconOnly: true,
    options: [
      { label: 'Left', value: 'left', icon: 'AlignLeft' },
      { label: 'Center', value: 'center', icon: 'AlignCenter' },
      { label: 'Right', value: 'right', icon: 'AlignRight' }
    ]
  },

  { type: 'header', id: 'layout-header', label: 'Layout' },
  { type: 'checkbox', id: 'invert', label: 'Invert', default: false },
  {
    type: 'select',
    id: 'imageWidth',
    label: 'Image width',
    default: '1/2',
    options: [
      { label: 'Half', value: '1/2' },
      { label: 'Two thirds', value: '2/3' },
      { label: 'Three quarters', value: '3/4' }
    ]
  },
  {
    type: 'select',
    id: 'imageAspect',
    label: 'Aspect',
    default: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Square', value: 'square' },
      { label: 'Portrait', value: 'portrait' },
      { label: 'Landscape', value: 'landscape' },
      { label: 'Wide', value: 'wide' },
      { label: 'Tall', value: 'tall' }
    ]
  },
  { type: 'range', id: 'imageBorderRadius', label: 'Radius', min: 0, max: 96, step: 1, default: 0, unit: 'px' },

  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
]
