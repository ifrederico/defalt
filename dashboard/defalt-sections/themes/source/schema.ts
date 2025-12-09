/**
 * Source Theme Schema
 *
 * Defines the configuration schema and UI settings for the Ghost Source theme.
 * This is the primary theme supported by Defalt.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import type { ThemeSettingsGroup } from '../../engine/themeSchemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const sourceThemeConfigSchema = z.object({
  // Appearance Settings (Main section)
  postFeedStyle: z.enum(['List', 'Grid']).default('List'),
  showImagesInFeed: z.boolean().default(true),
  showAuthor: z.boolean().default(true),
  showPublishDate: z.boolean().default(true),
  showPublicationInfoSidebar: z.boolean().default(false),

  // Post Settings
  showPostMetadata: z.boolean().default(true),
  enableDropCapsOnPosts: z.boolean().default(false),
  showRelatedArticles: z.boolean().default(true),

  // Main area padding
  padding: z.object({
    top: z.number().default(0),
    bottom: z.number().default(0),
    left: z.number().optional(),
    right: z.number().optional()
  }).default({ top: 0, bottom: 0 }),

  // Main area margin
  margin: z.object({
    top: z.number().optional(),
    bottom: z.number().optional()
  }).optional()
})

export type SourceThemeConfig = z.infer<typeof sourceThemeConfigSchema>

// =============================================================================
// UI Settings Schema
// =============================================================================

const appearanceSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'appearance-header',
    label: 'Appearance'
  },
  {
    type: 'select',
    id: 'postFeedStyle',
    label: 'Post feed style',
    default: 'List',
    options: [
      { label: 'List', value: 'List' },
      { label: 'Grid', value: 'Grid' }
    ]
  },
  {
    type: 'checkbox',
    id: 'showImagesInFeed',
    label: 'Show images in feed',
    default: true
  },
  {
    type: 'checkbox',
    id: 'showAuthor',
    label: 'Show author',
    default: true
  },
  {
    type: 'checkbox',
    id: 'showPublishDate',
    label: 'Show publish date',
    default: true
  },
  {
    type: 'checkbox',
    id: 'showPublicationInfoSidebar',
    label: 'Show publication info sidebar',
    default: false
  }
]

const postSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'post-header',
    label: 'Post Settings'
  },
  {
    type: 'checkbox',
    id: 'showPostMetadata',
    label: 'Show post metadata',
    default: true
  },
  {
    type: 'checkbox',
    id: 'enableDropCapsOnPosts',
    label: 'Enable drop caps on posts',
    default: false
  },
  {
    type: 'checkbox',
    id: 'showRelatedArticles',
    label: 'Show related articles',
    default: true
  }
]

const spacingSettings: SettingSchema[] = [
  {
    type: 'header',
    id: 'spacing-header',
    label: 'Spacing'
  },
  {
    type: 'range',
    id: 'padding.top',
    label: 'Padding top',
    min: 0,
    max: 200,
    step: 1,
    default: 0,
    unit: 'px'
  },
  {
    type: 'range',
    id: 'padding.bottom',
    label: 'Padding bottom',
    min: 0,
    max: 200,
    step: 1,
    default: 0,
    unit: 'px'
  }
]

/**
 * All settings for the Source theme, organized by group
 */
export const sourceThemeSettingsGroups: ThemeSettingsGroup[] = [
  {
    id: 'appearance',
    title: 'Appearance',
    settings: appearanceSettings
  },
  {
    id: 'post',
    title: 'Post Settings',
    settings: postSettings
  },
  {
    id: 'spacing',
    title: 'Spacing',
    settings: spacingSettings
  }
]

/**
 * Flat list of all settings (for compatibility)
 */
export const sourceThemeSettingsSchema: SettingSchema[] = [
  ...appearanceSettings,
  ...postSettings,
  ...spacingSettings
]
