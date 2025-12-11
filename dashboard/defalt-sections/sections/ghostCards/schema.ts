/**
 * Ghost Cards Section Schema
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// Zod config schema
export const ghostCardsConfigSchema = z.object({
  tag: z.string().default('#cards'),
  contentWidth: z.enum(['720px', '960px', '1120px', '1320px', 'none']).default('1120px'),
  pageTitle: z.boolean().default(false),
  textAlignment: z.enum(['left', 'center', 'right']).default('left'),
  titleSize: z.enum(['small', 'normal', 'large']).default('normal'),
  paddingTop: z.number().min(0).max(200).default(48),
  paddingBottom: z.number().min(0).max(200).default(48)
})

export type GhostCardsSectionConfig = z.infer<typeof ghostCardsConfigSchema>

// UI settings schema
export const ghostCardsSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'appearance-header', label: 'Appearance' },
  {
    type: 'select',
    id: 'contentWidth',
    label: 'Width',
    default: '1120px',
    options: [
      { label: 'Narrow', value: '720px' },
      { label: 'Medium', value: '960px' },
      { label: 'Default', value: '1120px' },
      { label: 'Wide', value: '1320px' },
      { label: 'Full', value: 'none' }
    ]
  },
  { type: 'checkbox', id: 'pageTitle', label: 'Page title', default: false },
  {
    type: 'radio',
    id: 'textAlignment',
    label: 'Text alignment',
    default: 'left',
    iconOnly: true,
    options: [
      { label: 'Left', value: 'left', icon: 'AlignLeft' },
      { label: 'Center', value: 'center', icon: 'AlignCenter' },
      { label: 'Right', value: 'right', icon: 'AlignRight' }
    ]
  },
  {
    type: 'select',
    id: 'titleSize',
    label: 'Title size',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' }
    ]
  },
  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 48, unit: 'px' },
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
