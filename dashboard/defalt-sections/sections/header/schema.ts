/**
 * Header Section Schema
 *
 * Defines the Zod config schema and UI settings schema for the Header section.
 * Controls navigation layout, sticky behavior, search, and typography.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const headerConfigSchema = z.object({
  // Navigation layout - matches Ghost Source theme options
  navigationLayout: z.enum(['Logo in the middle', 'Logo on the left', 'Stacked']).default('Logo in the middle'),

  // Sticky header behavior
  stickyHeader: z.enum(['Always', 'Scroll up', 'Never']).default('Scroll up'),

  // Search icon visibility
  searchEnabled: z.boolean().default(true),

  // Typography case
  typographyCase: z.enum(['default', 'uppercase']).default('default')
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
    default: 'Logo in the middle',
    options: [
      { label: 'Logo in the middle', value: 'Logo in the middle' },
      { label: 'Logo on the left', value: 'Logo on the left' },
      { label: 'Stacked', value: 'Stacked' }
    ],
    info: 'Choose how your logo and navigation items are arranged.'
  },
  {
    type: 'select',
    id: 'stickyHeader',
    label: 'Sticky header',
    default: 'Scroll up',
    options: [
      { label: 'Always', value: 'Always' },
      { label: 'Scroll up', value: 'Scroll up' },
      { label: 'Never', value: 'Never' }
    ]
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
    default: true
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
    default: 'default',
    iconOnly: true,
    options: [
      { label: 'Case sensitive', value: 'default', icon: 'CaseSensitive' },
      { label: 'Uppercase', value: 'uppercase', icon: 'CaseUpper' }
    ]
  }
]

export const headerSettingsSchema: SettingSchema[] = [
  ...appearanceSettings,
  ...searchSettings,
  ...typographySettings
]
