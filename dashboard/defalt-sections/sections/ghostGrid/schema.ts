/**
 * Ghost Grid Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createDualTagSchema,
  createTextAlignmentSetting,
  primaryCardsSettings,
  textAlignmentShape,
  titleSizeSetting,
  titleSizeShape,
  transparentBackgroundSetting,
  transparentBackgroundShape
} from '../../engine/commonSettings.js'

// Zod config schema
export const ghostGridConfigSchema = z.object({
  ...createDualTagSchema('#grid-left', '#grid-right'),
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(false),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  ...titleSizeShape,
  stackOnMobile: z.boolean().default(true),
  gap: z.number().min(0).max(100).default(40)
})

export type GhostGridSectionConfig = z.infer<typeof ghostGridConfigSchema>

// UI settings schema
export const ghostGridSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  contentWidthPxSetting,
  { type: 'checkbox', id: 'pageTitle', label: 'Page title' },
  createTextAlignmentSetting('Text alignment'),
  transparentBackgroundSetting,
  titleSizeSetting,
  { type: 'header', id: 'layout-header', label: 'Layout' },
  { type: 'checkbox', id: 'stackOnMobile', label: 'Stack on mobile' },
  { type: 'range', id: 'gap', label: 'Gap', min: 0, max: 100, step: 4, unit: 'px' },
  ...primaryCardsSettings
]
