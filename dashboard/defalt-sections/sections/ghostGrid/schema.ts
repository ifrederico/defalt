/**
 * Ghost Grid Section Schema
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

// Zod config schema
export const ghostGridConfigSchema = z.object({
  tagLeft: z.string().default('#grid-left'),
  tagRight: z.string().default('#grid-right'),
  ...contentWidthPxShape,
  pageTitle: z.boolean().default(false),
  ...textAlignmentShape,
  ...transparentBackgroundShape,
  titleSize: z.enum(['small', 'normal', 'large']).default('normal'),
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
  {
    type: 'select',
    id: 'titleSize',
    label: 'Title size',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' }
    ]
  },
  { type: 'header', id: 'layout-header', label: 'Layout' },
  { type: 'checkbox', id: 'stackOnMobile', label: 'Stack on mobile' },
  { type: 'range', id: 'gap', label: 'Gap', min: 0, max: 100, step: 4, unit: 'px' },
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
