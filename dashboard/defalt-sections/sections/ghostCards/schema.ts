/**
 * Ghost Cards Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'
import {
  contentWidthPxShape,
  contentWidthPxSetting,
  createTextAlignmentSetting,
  textAlignmentShape,
  transparentBackgroundSetting,
  transparentBackgroundShape
} from '../../engine/commonSettings.js'

const TITLE_SIZE_VALUES = ['small', 'normal', 'large'] as const
const TITLE_SIZE_OPTIONS = [
  { label: 'Small', value: TITLE_SIZE_VALUES[0] },
  { label: 'Normal', value: TITLE_SIZE_VALUES[1] },
  { label: 'Large', value: TITLE_SIZE_VALUES[2] }
] as const

// Zod config schema
export const ghostCardsConfigSchema = z.object({
  tags: z.object({
    primary: z.string().default('#cards')
  }).default({ primary: '#cards' }),
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(false),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  titleSize: z.enum(TITLE_SIZE_VALUES).default('normal')
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// UI settings schema
export const ghostCardsSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  contentWidthPxSetting,
  { type: 'checkbox', id: 'pageTitle', label: 'Page title' },
  createTextAlignmentSetting('Text alignment'),
  transparentBackgroundSetting,
  {
    type: 'select',
    id: 'titleSize',
    label: 'Title size',
    options: [...TITLE_SIZE_OPTIONS]
  },
  { type: 'header', id: 'primary-cards-header', label: 'Primary Cards', helpUrl: 'https://ghost.org/help/cards/' },
  {
    type: 'paragraph',
    id: 'primary-cards-help',
    content: 'Launch the dynamic card menu by clicking the + button, or type / on a new line.'
  },
  {
    type: 'cardList',
    id: 'primary-cards-list',
    items: [
      { label: 'Image', suffix: '/image', icon: 'Image' },
      { label: 'Divider', suffix: '/hr', icon: 'Minus' },
      { label: 'Button', suffix: '/button', icon: 'RectangleEllipsis' },
      { label: 'Bookmark', suffix: '/url', icon: 'Bookmark' },
      { label: 'Gallery', suffix: '/gallery', icon: 'Images' },
      { label: 'Public preview', suffix: '/paywall', icon: 'Eye' },
      { label: 'Call to action', suffix: '/cta', icon: 'MousePointer' },
      { label: 'Callout', suffix: '/callout', icon: 'MessageSquareWarning' },
      { label: 'Signup', suffix: '/signup', icon: 'UserPlus' },
      { label: 'Header', suffix: '/header', icon: 'GalleryVertical' },
      { label: 'Toggle', suffix: '/toggle', icon: 'ChevronDown' },
      { label: 'Video', suffix: '/video', icon: 'Play' },
      { label: 'Audio', suffix: '/audio', icon: 'Music4' },
      { label: 'File', suffix: '/file', icon: 'Paperclip' },
      { label: 'Product', suffix: '/product', icon: 'Star' },
      { label: 'HTML', suffix: '/html', icon: 'Code' },
      { label: 'Markdown', suffix: '/md', icon: 'BookOpen' }
    ]
  }
]
