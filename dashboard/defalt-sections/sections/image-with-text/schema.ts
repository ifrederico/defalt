/**
 * Image With Text Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createTextAlignmentSetting,
  ghostPageTagShape,
  imageAppearanceShape,
  imageAspectSetting,
  imageBorderRadiusSetting,
  imageLayoutShape,
  imageWidthSetting,
  invertSetting,
  textAlignmentShape,
  transparentBackgroundSetting,
  transparentBackgroundShape
} from '../../engine/commonSettings.js'

// Zod config schema
export const imageWithTextConfigSchema = z.object({
  // Ghost tag for content filtering
  tag: z.string().default('#image-text'),
  ...ghostPageTagShape,

  // Appearance
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(true),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
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

  { type: 'header', id: 'layout-header', label: 'Layout' },
  invertSetting,
  imageWidthSetting,
  imageAspectSetting,
  imageBorderRadiusSetting,
]
