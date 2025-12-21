/**
 * Announcement Bar Section Schema
 *
 * Engine V2: Block Architecture
 * - Parent (Bar): Controls layout, colors, padding
 * - Child (Block): Controls content, link, and typography
 *
 * Content can be sourced from a Ghost page tagged with #announcement (or any custom tag)
 * or configured directly in the blocks.
 */

import { z } from 'zod'
import type { SettingSchema, BlockSchema } from '../../engine/schemaTypes.js'

export const ANNOUNCEMENT_BAR_PADDING_DEFAULTS = {
  top: 8,
  bottom: 8
} as const

const ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES = ['small', 'normal', 'large', 'x-large'] as const
const ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_VALUES = ['light', 'default', 'bold'] as const
const ANNOUNCEMENT_TYPOGRAPHY_SPACING_VALUES = ['tight', 'regular', 'wide'] as const
const ANNOUNCEMENT_TYPOGRAPHY_CASE_VALUES = ['default', 'uppercase'] as const

const ANNOUNCEMENT_TYPOGRAPHY_SIZE_OPTIONS = [
  { label: 'Small', value: ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES[0] },
  { label: 'Normal', value: ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES[1] },
  { label: 'Large', value: ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES[2] },
  { label: 'X-Large', value: ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES[3] }
] as const

const ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_OPTIONS = [
  { label: 'Light', value: ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_VALUES[0] },
  { label: 'Default', value: ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_VALUES[1] },
  { label: 'Bold', value: ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_VALUES[2] }
] as const

const ANNOUNCEMENT_TYPOGRAPHY_SPACING_OPTIONS = [
  { label: 'Tight', value: ANNOUNCEMENT_TYPOGRAPHY_SPACING_VALUES[0] },
  { label: 'Regular', value: ANNOUNCEMENT_TYPOGRAPHY_SPACING_VALUES[1] },
  { label: 'Wide', value: ANNOUNCEMENT_TYPOGRAPHY_SPACING_VALUES[2] }
] as const

const ANNOUNCEMENT_TYPOGRAPHY_CASE_OPTIONS = [
  { label: 'Case sensitive', value: ANNOUNCEMENT_TYPOGRAPHY_CASE_VALUES[0], icon: 'CaseSensitive' },
  { label: 'Uppercase', value: ANNOUNCEMENT_TYPOGRAPHY_CASE_VALUES[1], icon: 'CaseUpper' }
] as const

// =============================================================================
// Block Schema (Child - Announcement Item)
// =============================================================================

/**
 * Individual announcement block config
 * Content can come from Ghost page (via tag) or manual text entry
 */
export const announcementBlockConfigSchema = z.object({
  // Ghost tag for content - when set, fetches from Ghost page
  tag: z.string().default('#announcement'),
  // Manual text entry - used when no Ghost content
  text: z.string().default(''),
  link: z.string().default(''),
  // Typography settings
  typographySize: z.enum(ANNOUNCEMENT_TYPOGRAPHY_SIZE_VALUES).default('normal'),
  typographyWeight: z.enum(ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_VALUES).default('default'),
  typographySpacing: z.enum(ANNOUNCEMENT_TYPOGRAPHY_SPACING_VALUES).default('regular'),
  typographyCase: z.enum(ANNOUNCEMENT_TYPOGRAPHY_CASE_VALUES).default('default')
})

export type AnnouncementBlockConfig = z.infer<typeof announcementBlockConfigSchema>

/**
 * Block schema for UI generation
 */
export const announcementBarBlocksSchema: BlockSchema[] = [
  {
    type: 'announcement',
    name: 'Announcement',
    limit: 5,
    settings: [
      // Content - manual entry (greyed out when Ghost content available)
      {
        type: 'header',
        id: 'content-header',
        label: 'Content'
      },
      {
        type: 'text',
        id: 'tag',
        label: 'Tag',
        placeholder: '#announcement'
      },
      {
        type: 'textarea',
        id: 'text',
        label: 'Text'
      },
      {
        type: 'url',
        id: 'link',
        label: 'Link',
        placeholder: 'https://...'
      },
      // Typography
      {
        type: 'header',
        id: 'typography-header',
        label: 'Typography'
      },
      {
        type: 'select',
        id: 'typographySize',
        label: 'Size',
        options: [...ANNOUNCEMENT_TYPOGRAPHY_SIZE_OPTIONS]
      },
      {
        type: 'select',
        id: 'typographyWeight',
        label: 'Weight',
        options: [...ANNOUNCEMENT_TYPOGRAPHY_WEIGHT_OPTIONS]
      },
      {
        type: 'select',
        id: 'typographySpacing',
        label: 'Spacing',
        options: [...ANNOUNCEMENT_TYPOGRAPHY_SPACING_OPTIONS]
      },
      {
        type: 'radio',
        id: 'typographyCase',
        label: 'Case',
        iconOnly: true,
        options: [...ANNOUNCEMENT_TYPOGRAPHY_CASE_OPTIONS]
      }
    ]
  }
]

// =============================================================================
// Parent Config Schema (Bar Container)
// =============================================================================

export const announcementBarConfigSchema = z.object({
  // --- Container Settings ---
  width: z.enum(['default', 'narrow']).default('default'),
  backgroundColor: z.string().default('#AC1E3E'),
  textColor: z.string().default('#ffffff'),
  dividerThickness: z.number().min(0).max(5).default(0),
  dividerColor: z.string().default('#e5e7eb'),
  paddingTop: z.number().min(0).max(100).default(ANNOUNCEMENT_BAR_PADDING_DEFAULTS.top),
  paddingBottom: z.number().min(0).max(100).default(ANNOUNCEMENT_BAR_PADDING_DEFAULTS.bottom),

  // --- Blocks Array (Announcements) ---
  announcements: z.array(announcementBlockConfigSchema).default([])
})

export type AnnouncementBarSectionConfig = z.infer<typeof announcementBarConfigSchema>

// =============================================================================
// UI Settings Schema (Parent Settings Only)
// =============================================================================

export const announcementBarSettingsSchema: SettingSchema[] = [
  // --- Appearance Settings ---
  // Note: Typography settings are now per-block, not on parent
  {
    type: 'header',
    id: 'appearance-header',
    label: 'Appearance'
  },
  {
    type: 'radio',
    id: 'width',
    label: 'Width',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Narrow', value: 'narrow' }
    ]
  },
  {
    type: 'color',
    id: 'backgroundColor',
    label: 'Background color',
  },
  {
    type: 'color',
    id: 'textColor',
    label: 'Text color',
  },
  {
    type: 'range',
    id: 'dividerThickness',
    label: 'Divider',
    min: 0,
    max: 5,
    step: 1,
    unit: 'px'
  },
  {
    type: 'color',
    id: 'dividerColor',
    label: 'Divider color',
  },

  // --- Padding Settings ---
  {
    type: 'header',
    id: 'padding-header',
    label: 'Padding'
  },
  {
    type: 'range',
    id: 'paddingTop',
    label: 'Top',
    min: 0,
    max: 100,
    step: 1,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'paddingBottom',
    label: 'Bottom',
    min: 0,
    max: 100,
    step: 1,
    unit: 'px'
  }
]
