/**
 * Schema Types - Zod primitives for section settings validation
 *
 * This module defines the building blocks for section schemas:
 * - Setting schemas (text, color, range, select, etc.)
 * - Block schemas (for repeatable items)
 * - Section definition types
 */

import { z } from 'zod'

// =============================================================================
// Setting Type Definitions
// =============================================================================

/**
 * All supported setting input types
 */
export const SettingInputType = z.enum([
  'text',
  'textarea',
  'richtext',
  'url',
  'color',
  'checkbox',
  'range',
  'select',
  'radio',
  'image_picker',
  'header',
  'paragraph'
])

export type SettingInputType = z.infer<typeof SettingInputType>

// =============================================================================
// Individual Setting Schemas
// =============================================================================

/**
 * Text input setting
 */
export const textSettingSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  info: z.string().optional(),
  placeholder: z.string().optional()
})

/**
 * Textarea setting (multi-line text)
 */
export const textareaSettingSchema = z.object({
  type: z.literal('textarea'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  info: z.string().optional(),
  placeholder: z.string().optional()
})

/**
 * Rich text editor setting
 */
export const richtextSettingSchema = z.object({
  type: z.literal('richtext'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  info: z.string().optional()
})

/**
 * URL input setting
 */
export const urlSettingSchema = z.object({
  type: z.literal('url'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  info: z.string().optional(),
  placeholder: z.string().optional()
})

/**
 * Color picker setting
 */
export const colorSettingSchema = z.object({
  type: z.literal('color'),
  id: z.string(),
  label: z.string(),
  default: z.string().default('#000000'),
  info: z.string().optional()
})

/**
 * Checkbox/toggle setting
 */
export const checkboxSettingSchema = z.object({
  type: z.literal('checkbox'),
  id: z.string(),
  label: z.string(),
  default: z.boolean().default(false),
  info: z.string().optional()
})

/**
 * Range slider setting
 */
export const rangeSettingSchema = z.object({
  type: z.literal('range'),
  id: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().default(1),
  default: z.number(),
  unit: z.string().optional(),
  info: z.string().optional()
})

/**
 * Select dropdown setting
 */
export const selectSettingSchema = z.object({
  type: z.literal('select'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.string()
    })
  ),
  info: z.string().optional()
})

/**
 * Radio button group setting (visual layout selection)
 */
export const radioSettingSchema = z.object({
  type: z.literal('radio'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.string()
    })
  ),
  info: z.string().optional()
})

/**
 * Image picker setting (with drag-drop upload)
 */
export const imagePickerSettingSchema = z.object({
  type: z.literal('image_picker'),
  id: z.string(),
  label: z.string(),
  default: z.string().optional(),
  info: z.string().optional()
})

/**
 * Header (display only, for grouping settings)
 */
export const headerSettingSchema = z.object({
  type: z.literal('header'),
  id: z.string(),
  label: z.string()
})

/**
 * Paragraph (display only, for help text)
 */
export const paragraphSettingSchema = z.object({
  type: z.literal('paragraph'),
  id: z.string(),
  content: z.string()
})

// =============================================================================
// Combined Setting Schema (Discriminated Union)
// =============================================================================

/**
 * Union of all possible setting types
 * Uses discriminated union on 'type' field for type narrowing
 */
export const settingSchema = z.discriminatedUnion('type', [
  textSettingSchema,
  textareaSettingSchema,
  richtextSettingSchema,
  urlSettingSchema,
  colorSettingSchema,
  checkboxSettingSchema,
  rangeSettingSchema,
  selectSettingSchema,
  radioSettingSchema,
  imagePickerSettingSchema,
  headerSettingSchema,
  paragraphSettingSchema
])

export type SettingSchema = z.infer<typeof settingSchema>

// =============================================================================
// Block Schema (for repeatable items)
// =============================================================================

/**
 * Schema for repeatable block items within a section
 */
export const blockSchema = z.object({
  type: z.string(),
  name: z.string(),
  limit: z.number().optional(),
  settings: z.array(settingSchema)
})

export type BlockSchema = z.infer<typeof blockSchema>

// =============================================================================
// Section Definition Types
// =============================================================================

export type SectionCategory = 'template' | 'header'

/**
 * Padding configuration for sections
 */
export const sectionPaddingSchema = z.object({
  top: z.number(),
  bottom: z.number(),
  left: z.number().optional(),
  right: z.number().optional()
})

export type SectionPadding = z.infer<typeof sectionPaddingSchema>

/**
 * Options passed to template rendering
 */
export interface RenderOptions {
  padding?: SectionPadding
  pages?: Array<{
    title?: string
    excerpt?: string
    feature_image?: string
    url?: string
    html?: string
  }>
}

/**
 * Section definition interface
 * TConfig is the Zod schema type for the section's configuration
 */
export interface SectionDefinition<TConfig extends z.ZodType = z.ZodType> {
  /** Unique identifier for the section */
  id: string
  /** Display label in the editor */
  label: string
  /** Optional description */
  description?: string
  /** Section category */
  category: SectionCategory
  /** Whether section is premium */
  premium?: boolean
  /** Default visibility state */
  defaultVisibility: boolean
  /** Default padding values */
  defaultPadding: SectionPadding
  /** If true, all padding values are unified */
  usesUnifiedPadding?: boolean
  /** Zod schema for config validation */
  configSchema: TConfig
  /** Settings schema for UI generation */
  settingsSchema: SettingSchema[]
  /** Block schemas for repeatable items */
  blocksSchema?: BlockSchema[]
  /** Factory function for default config */
  createConfig: () => z.infer<TConfig>
  /** Path to Handlebars template (relative to sections/) */
  templatePath: string
}

/**
 * Instance of a section with its config
 */
export interface SectionInstance<TConfig = unknown> {
  id: string
  definitionId: string
  label: string
  category: SectionCategory
  config: TConfig
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a text setting with type safety
 */
export function createTextSetting(
  config: Omit<z.infer<typeof textSettingSchema>, 'type'>
): z.infer<typeof textSettingSchema> {
  return { type: 'text', ...config }
}

/**
 * Create a color setting with type safety
 */
export function createColorSetting(
  config: Omit<z.infer<typeof colorSettingSchema>, 'type'>
): z.infer<typeof colorSettingSchema> {
  return { type: 'color', ...config }
}

/**
 * Create a range setting with type safety
 */
export function createRangeSetting(
  config: Omit<z.infer<typeof rangeSettingSchema>, 'type'>
): z.infer<typeof rangeSettingSchema> {
  return { type: 'range', ...config }
}

/**
 * Create a select setting with type safety
 */
export function createSelectSetting(
  config: Omit<z.infer<typeof selectSettingSchema>, 'type'>
): z.infer<typeof selectSettingSchema> {
  return { type: 'select', ...config }
}

/**
 * Create a checkbox setting with type safety
 */
export function createCheckboxSetting(
  config: Omit<z.infer<typeof checkboxSettingSchema>, 'type'>
): z.infer<typeof checkboxSettingSchema> {
  return { type: 'checkbox', ...config }
}

/**
 * Create a header setting with type safety
 */
export function createHeaderSetting(
  config: Omit<z.infer<typeof headerSettingSchema>, 'type'>
): z.infer<typeof headerSettingSchema> {
  return { type: 'header', ...config }
}
