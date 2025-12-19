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
  // Manual text entry - used as fallback when no Ghost content
  text: z.string().default(''),
  link: z.string().default(''),
  // Typography settings
  typographySize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
  typographyWeight: z.enum(['light', 'default', 'bold']).default('default'),
  typographySpacing: z.enum(['tight', 'regular', 'wide']).default('regular'),
  typographyCase: z.enum(['default', 'uppercase']).default('default')
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
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
          { label: 'X-Large', value: 'x-large' }
        ]
      },
      {
        type: 'select',
        id: 'typographyWeight',
        label: 'Weight',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Default', value: 'default' },
          { label: 'Bold', value: 'bold' }
        ]
      },
      {
        type: 'select',
        id: 'typographySpacing',
        label: 'Spacing',
        options: [
          { label: 'Tight', value: 'tight' },
          { label: 'Regular', value: 'regular' },
          { label: 'Wide', value: 'wide' }
        ]
      },
      {
        type: 'radio',
        id: 'typographyCase',
        label: 'Case',
        iconOnly: true,
        options: [
          { label: 'Case sensitive', value: 'default', icon: 'CaseSensitive' },
          { label: 'Uppercase', value: 'uppercase', icon: 'CaseUpper' }
        ]
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
  paddingTop: z.number().min(0).max(100).default(8),
  paddingBottom: z.number().min(0).max(100).default(8),

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
