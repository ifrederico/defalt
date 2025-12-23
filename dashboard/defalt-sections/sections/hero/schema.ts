/**
 * Hero Section Schema
 *
 * Split hero with image on one side and text/CTAs on the other.
 * Content pulled from Ghost page tagged with the configured tag.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createTextAlignmentSetting,
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
export const heroConfigSchema = z.object({
  // Ghost tag for content filtering
  tags: z.object({
    primary: z.string().default('#hero')
  }).default({ primary: '#hero' }),

  // Appearance
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(true),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  ...imageAppearanceShape,

  // Layout
  ...imageLayoutShape,
})

export type HeroConfig = z.infer<typeof heroConfigSchema>

// UI settings schema
export const heroSettingsSchema: SettingSchema[] = [
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
