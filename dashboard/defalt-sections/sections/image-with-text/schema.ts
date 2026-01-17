/**
 * Image With Text Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createPrimaryTagSchema,
  createTextAlignmentSetting,
  imageAppearanceShape,
  imageAspectSetting,
  imageBorderRadiusSetting,
  imageLayoutShape,
  imagePositionSetting,
  imageWidthSetting,
  textAlignmentShape,
  transparentBackgroundSetting,
  transparentBackgroundShape
} from '../../engine/commonSettings.js'

// Zod config schema
export const imageWithTextConfigSchema = z.object({
  // Ghost tag for content filtering
  ...createPrimaryTagSchema('#image-text'),

  // Appearance
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(true),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  innerBackgroundColor: z.string().default('transparent'),
  innerBackgroundPadding: z.number().min(0).max(120).default(0),
  innerBackgroundRadius: z.number().min(0).max(96).default(0),
  ...imageAppearanceShape,

  // Layout
  ...imageLayoutShape,
})

export type ImageWithTextSectionConfig = z.infer<typeof imageWithTextConfigSchema>

// UI settings schema
export const imageWithTextSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  contentWidthPxSetting,
  { type: 'checkbox', id: 'pageTitle', label: 'Page title' },
  createTextAlignmentSetting('Title alignment'),
  transparentBackgroundSetting,

  { type: 'header', id: 'content-card-header', label: 'Content card' },
  { type: 'color', id: 'innerBackgroundColor', label: 'Background', allowTransparent: true },
  { type: 'range', id: 'innerBackgroundPadding', label: 'Padding', min: 0, max: 120, step: 1, unit: 'px' },
  { type: 'range', id: 'innerBackgroundRadius', label: 'Radius', min: 0, max: 96, step: 1, unit: 'px' },

  { type: 'header', id: 'layout-header', label: 'Layout' },
  imagePositionSetting,
  imageWidthSetting,
  imageAspectSetting,
  imageBorderRadiusSetting,
]
