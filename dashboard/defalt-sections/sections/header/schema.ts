/**
 * Header Section Schema
 *
 * Defines the Zod config schema and UI settings schema for the Header section.
 * Controls navigation layout, sticky behavior, search, and typography.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

export const NAVIGATION_LAYOUT_VALUES = ['Logo in the middle', 'Logo on the left', 'Stacked'] as const
const STICKY_HEADER_VALUES = ['Always', 'Scroll up', 'Never'] as const
const HEADER_TYPOGRAPHY_CASE_VALUES = ['default', 'uppercase'] as const

export const NAVIGATION_LAYOUT_OPTIONS = NAVIGATION_LAYOUT_VALUES.map((value) => ({
  label: value,
  value
}))

const STICKY_HEADER_OPTIONS = STICKY_HEADER_VALUES.map((value) => ({
  label: value,
  value
}))

const HEADER_TYPOGRAPHY_CASE_OPTIONS = [
  { label: 'Case sensitive', value: HEADER_TYPOGRAPHY_CASE_VALUES[0], icon: 'CaseSensitive' },
  { label: 'Uppercase', value: HEADER_TYPOGRAPHY_CASE_VALUES[1], icon: 'CaseUpper' }
] as const

// =============================================================================
// Zod Config Schema
// =============================================================================

export const headerConfigSchema = z.object({
  // Navigation layout - matches Ghost Source theme options
  navigationLayout: z.enum(NAVIGATION_LAYOUT_VALUES).default('Logo in the middle'),

  // Sticky header behavior
  stickyHeader: z.enum(STICKY_HEADER_VALUES).default('Scroll up'),

  // Search icon visibility
  searchEnabled: z.boolean().default(true),

  // Typography case
  typographyCase: z.enum(HEADER_TYPOGRAPHY_CASE_VALUES).default('default')
})

export type HeaderSectionConfig = z.infer<typeof headerConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

const appearanceSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'appearance-header',
    label: 'Navigation'
  },
  {
    type: 'select',
    id: 'navigationLayout',
    label: 'Layout',
    options: [...NAVIGATION_LAYOUT_OPTIONS],
    info: 'Choose how your logo and navigation items are arranged.'
  },
  {
    type: 'select',
    id: 'stickyHeader',
    label: 'Sticky header',
    options: [...STICKY_HEADER_OPTIONS]
  }
]

const searchSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'search-header',
    label: 'Search'
  },
  {
    type: 'checkbox',
    id: 'searchEnabled',
    label: 'Show search icon',
  }
]

const typographySettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'typography-header',
    label: 'Typography'
  },
  {
    type: 'radio',
    id: 'typographyCase',
    label: 'Case',
    iconOnly: true,
    options: [...HEADER_TYPOGRAPHY_CASE_OPTIONS]
  }
]

export const headerSettingsSchema: SettingSchema[] = [
  ...appearanceSettings,
  ...searchSettings,
  ...typographySettings
]
