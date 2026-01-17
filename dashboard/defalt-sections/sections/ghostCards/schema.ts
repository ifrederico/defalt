/**
 * Ghost Cards Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createPrimaryTagSchema,
  createTextAlignmentSetting,
  primaryCardsSettings,
  textAlignmentShape,
  titleSizeSetting,
  titleSizeShape,
  transparentBackgroundSetting,
  transparentBackgroundShape
} from '../../engine/commonSettings.js'

// Zod config schema
export const ghostCardsConfigSchema = z.object({
  ...createPrimaryTagSchema('#cards'),
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(false),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  ...titleSizeShape
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// UI settings schema
export const ghostCardsSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  contentWidthPxSetting,
  { type: 'checkbox', id: 'pageTitle', label: 'Page title' },
  createTextAlignmentSetting('Text alignment'),
  transparentBackgroundSetting,
  titleSizeSetting,
  ...primaryCardsSettings
]
