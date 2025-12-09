/**
 * Theme Schema Types - Zod primitives for theme-level settings validation
 *
 * This module defines the building blocks for theme schemas:
 * - Theme settings schemas (appearance, typography, feed display, etc.)
 * - Theme definition types
 *
 * Unlike section schemas which define per-section settings,
 * theme schemas define global theme behavior and appearance.
 */

import { z } from 'zod'
import type { SettingSchema } from './schemaTypes.js'

// =============================================================================
// Theme Definition Types
// =============================================================================

/**
 * Padding configuration for theme main area
 */
export const themePaddingSchema = z.object({
  top: z.number(),
  bottom: z.number(),
  left: z.number().optional(),
  right: z.number().optional()
})

export type ThemePadding = z.infer<typeof themePaddingSchema>

/**
 * Margin configuration for theme main area
 */
export const themeMarginSchema = z.object({
  top: z.number().optional(),
  bottom: z.number().optional()
})

export type ThemeMargin = z.infer<typeof themeMarginSchema>

/**
 * Theme definition interface
 * TConfig is the Zod schema type for the theme's configuration
 */
export interface ThemeDefinition<TConfig extends z.ZodType = z.ZodType> {
  /** Unique identifier for the theme (e.g., 'source', 'casper') */
  id: string
  /** Display label in the editor */
  label: string
  /** Optional description */
  description?: string
  /** Theme version */
  version: string
  /** Zod schema for config validation */
  configSchema: TConfig
  /** Settings schema for UI generation (grouped by section) */
  settingsSchema: ThemeSettingsGroup[]
  /** Factory function for default config */
  createConfig: () => z.infer<TConfig>
}

/**
 * Group of settings (for organizing theme settings into sections)
 */
export interface ThemeSettingsGroup {
  /** Group identifier */
  id: string
  /** Group display title */
  title: string
  /** Settings in this group */
  settings: SettingSchema[]
}

/**
 * Instance of a theme with its config
 */
export interface ThemeInstance<TConfig = unknown> {
  id: string
  definitionId: string
  label: string
  config: TConfig
}
