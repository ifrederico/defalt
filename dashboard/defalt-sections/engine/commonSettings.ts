/**
 * Common Settings - Reusable setting presets for sections
 *
 * Import shape exports and spread them into your configSchema.
 * Import setting exports and use them in your settingsSchema.
 *
 * @example
 * import { contentWidthPxShape, textAlignmentShape, contentWidthPxSetting } from '../../engine/commonSettings'
 *
 * export const myConfigSchema = z.object({
 *   ...contentWidthPxShape,
 *   ...textAlignmentShape,
 *   myCustomField: z.string()
 * })
 */

import { z } from 'zod'
import type { SettingSchema } from './schemaTypes.js'

// =============================================================================
// Content Width (pixel-based)
// =============================================================================

export const CONTENT_WIDTH_PX_OPTIONS = ['720px', '960px', '1120px', '1320px', 'none'] as const
export type ContentWidthPxOption = typeof CONTENT_WIDTH_PX_OPTIONS[number]

export const contentWidthPxConfigSchema = z.object({
  contentWidth: z.enum(CONTENT_WIDTH_PX_OPTIONS).default('1120px')
})

export const contentWidthPxShape = contentWidthPxConfigSchema.shape

export const contentWidthPxSetting: SettingSchema = {
  type: 'select',
  id: 'contentWidth',
  label: 'Width',
  options: [
    { label: 'Narrow', value: '720px' },
    { label: 'Medium', value: '960px' },
    { label: 'Default', value: '1120px' },
    { label: 'Wide', value: '1320px' },
    { label: 'Full', value: 'none' }
  ]
}

// =============================================================================
// Text Alignment
// =============================================================================

export const TEXT_ALIGNMENT_OPTIONS = ['left', 'center', 'right'] as const
export type TextAlignmentOption = typeof TEXT_ALIGNMENT_OPTIONS[number]

export const textAlignmentConfigSchema = z.object({
  textAlignment: z.enum(TEXT_ALIGNMENT_OPTIONS).default('left')
})

export const textAlignmentShape = textAlignmentConfigSchema.shape

export const createTextAlignmentSetting = (label: string): SettingSchema => ({
  type: 'radio',
  id: 'textAlignment',
  label,
  iconOnly: true,
  options: [
    { label: 'Left', value: 'left', icon: 'AlignLeft' },
    { label: 'Center', value: 'center', icon: 'AlignCenter' },
    { label: 'Right', value: 'right', icon: 'AlignRight' }
  ]
})

// =============================================================================
// Background (transparent default)
// =============================================================================

export const transparentBackgroundConfigSchema = z.object({
  backgroundColor: z.string().default('transparent')
})

export const transparentBackgroundShape = transparentBackgroundConfigSchema.shape

export const transparentBackgroundSetting: SettingSchema = {
  type: 'color',
  id: 'backgroundColor',
  label: 'Background',
  allowTransparent: true
}

// =============================================================================
// Ghost Page Tag
// =============================================================================

export const ghostPageTagConfigSchema = z.object({
  ghostPageTag: z.string().optional()
})

export const ghostPageTagShape = ghostPageTagConfigSchema.shape

// =============================================================================
// Image Appearance
// =============================================================================

export const IMAGE_ASPECT_OPTIONS = ['default', 'square', 'portrait', 'landscape', 'wide', 'tall'] as const
export type ImageAspectOption = typeof IMAGE_ASPECT_OPTIONS[number]

export const imageAppearanceConfigSchema = z.object({
  imageAspect: z.enum(IMAGE_ASPECT_OPTIONS).default('default'),
  imageBorderRadius: z.number().min(0).max(96).default(0)
})

export const imageAppearanceShape = imageAppearanceConfigSchema.shape

export const imageAspectSetting: SettingSchema = {
  type: 'select',
  id: 'imageAspect',
  label: 'Aspect',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Square', value: 'square' },
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
    { label: 'Wide', value: 'wide' },
    { label: 'Tall', value: 'tall' }
  ]
}

export const imageBorderRadiusSetting: SettingSchema = {
  type: 'range',
  id: 'imageBorderRadius',
  label: 'Radius',
  min: 0,
  max: 96,
  step: 1,
  unit: 'px'
}

// =============================================================================
// Image Layout
// =============================================================================

export const IMAGE_WIDTH_OPTIONS = ['1/2', '2/3', '3/4'] as const
export type ImageWidthOption = typeof IMAGE_WIDTH_OPTIONS[number]

export const IMAGE_POSITION_OPTIONS = ['left', 'right'] as const
export type ImagePositionOption = typeof IMAGE_POSITION_OPTIONS[number]

export const imageLayoutConfigSchema = z.object({
  invert: z.boolean().optional(),
  imageWidth: z.enum(IMAGE_WIDTH_OPTIONS).default('1/2'),
  imagePosition: z.enum(IMAGE_POSITION_OPTIONS).default('left')
})

export const imageLayoutShape = imageLayoutConfigSchema.shape

export const invertSetting: SettingSchema = {
  type: 'checkbox',
  id: 'invert',
  label: 'Invert',
}

export const imageWidthSetting: SettingSchema = {
  type: 'select',
  id: 'imageWidth',
  label: 'Image width',
  options: [
    { label: 'Half', value: '1/2' },
    { label: 'Two thirds', value: '2/3' },
    { label: 'Three quarters', value: '3/4' }
  ]
}
