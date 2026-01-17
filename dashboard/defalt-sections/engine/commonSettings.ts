/**
 * Common Settings - Reusable setting presets for sections
 *
 * Import shape exports and spread them into your configSchema.
 * Import setting exports and use them in your settingsSchema.
 *
 * @example
 * import { contentWidthPxShape, textAlignmentShape, contentWidthPxSetting } from '../../engine/commonSettings'
 *
 * export const myConfigSchema = z.object({
 *   ...contentWidthPxShape,
 *   ...textAlignmentShape,
 *   myCustomField: z.string()
 * })
 */

import { z } from 'zod'
import type { SettingSchema } from './schemaTypes.js'

// =============================================================================
// Content Width (pixel-based)
// =============================================================================

export const CONTENT_WIDTH_PX_OPTIONS = ['720px', '960px', '1120px', '1320px', 'none'] as const
export type ContentWidthPxOption = typeof CONTENT_WIDTH_PX_OPTIONS[number]

export const contentWidthPxConfigSchema = z.object({
  contentWidth: z.enum(CONTENT_WIDTH_PX_OPTIONS).default('1120px')
})

export const contentWidthPxShape = contentWidthPxConfigSchema.shape

export const contentWidthPxSetting: SettingSchema = {
  type: 'select',
  id: 'contentWidth',
  label: 'Width',
  options: [
    { label: 'Narrow', value: '720px' },
    { label: 'Medium', value: '960px' },
    { label: 'Default', value: '1120px' },
    { label: 'Wide', value: '1320px' },
    { label: 'Full', value: 'none' }
  ]
}

// =============================================================================
// Text Alignment
// =============================================================================

export const TEXT_ALIGNMENT_OPTIONS = ['left', 'center', 'right'] as const
export type TextAlignmentOption = typeof TEXT_ALIGNMENT_OPTIONS[number]

export const textAlignmentConfigSchema = z.object({
  textAlignment: z.enum(TEXT_ALIGNMENT_OPTIONS).default('left')
})

export const textAlignmentShape = textAlignmentConfigSchema.shape

export const createTextAlignmentSetting = (label: string): SettingSchema => ({
  type: 'radio',
  id: 'textAlignment',
  label,
  iconOnly: true,
  options: [
    { label: 'Left', value: 'left', icon: 'AlignLeft' },
    { label: 'Center', value: 'center', icon: 'AlignCenter' },
    { label: 'Right', value: 'right', icon: 'AlignRight' }
  ]
})

// =============================================================================
// Background (transparent default)
// =============================================================================

export const transparentBackgroundConfigSchema = z.object({
  backgroundColor: z.string().default('transparent')
})

export const transparentBackgroundShape = transparentBackgroundConfigSchema.shape

export const transparentBackgroundSetting: SettingSchema = {
  type: 'color',
  id: 'backgroundColor',
  label: 'Background',
  allowTransparent: true
}

// =============================================================================
// Image Appearance
// =============================================================================

export const IMAGE_ASPECT_OPTIONS = ['default', 'square', 'portrait', 'landscape', 'wide', 'tall'] as const
export type ImageAspectOption = typeof IMAGE_ASPECT_OPTIONS[number]

export const imageAppearanceConfigSchema = z.object({
  imageAspect: z.enum(IMAGE_ASPECT_OPTIONS).default('default'),
  imageBorderRadius: z.number().min(0).max(96).default(0)
})

export const imageAppearanceShape = imageAppearanceConfigSchema.shape

export const imageAspectSetting: SettingSchema = {
  type: 'select',
  id: 'imageAspect',
  label: 'Aspect',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Square', value: 'square' },
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
    { label: 'Wide', value: 'wide' },
    { label: 'Tall', value: 'tall' }
  ]
}

export const imageBorderRadiusSetting: SettingSchema = {
  type: 'range',
  id: 'imageBorderRadius',
  label: 'Radius',
  min: 0,
  max: 96,
  step: 1,
  unit: 'px'
}

// =============================================================================
// Image Layout
// =============================================================================

export const IMAGE_WIDTH_OPTIONS = ['1/2', '2/3', '3/4'] as const
export type ImageWidthOption = typeof IMAGE_WIDTH_OPTIONS[number]

export const IMAGE_POSITION_OPTIONS = ['left', 'right'] as const
export type ImagePositionOption = typeof IMAGE_POSITION_OPTIONS[number]

export const imageLayoutConfigSchema = z.object({
  imageWidth: z.enum(IMAGE_WIDTH_OPTIONS).default('1/2'),
  imagePosition: z.enum(IMAGE_POSITION_OPTIONS).default('left')
})

export const imageLayoutShape = imageLayoutConfigSchema.shape

export const imageWidthSetting: SettingSchema = {
  type: 'select',
  id: 'imageWidth',
  label: 'Image width',
  options: [
    { label: 'Half', value: '1/2' },
    { label: 'Two thirds', value: '2/3' },
    { label: 'Three quarters', value: '3/4' }
  ]
}

export const imagePositionSetting: SettingSchema = {
  type: 'radio',
  id: 'imagePosition',
  label: 'Image position',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' }
  ]
}

// =============================================================================
// Tags Configuration Factories
// =============================================================================

/**
 * Creates a tags schema with a single primary tag.
 * Use this for sections that filter content by one Ghost tag.
 *
 * @param defaultTag - The default tag value (e.g., '#hero', '#cards')
 * @returns A Zod schema shape for single-tag configuration
 *
 * @example
 * export const heroConfigSchema = z.object({
 *   ...createPrimaryTagSchema('#hero'),
 *   // other fields...
 * })
 */
export const createPrimaryTagSchema = (defaultTag: string) => ({
  tags: z.object({
    primary: z.string().default(defaultTag)
  }).default({ primary: defaultTag })
})

/**
 * Creates a tags schema with left and right tags for dual-column layouts.
 * Use this for grid sections that display content from two different tags.
 *
 * @param leftDefault - The default tag for the left column
 * @param rightDefault - The default tag for the right column
 * @returns A Zod schema shape for dual-tag configuration
 *
 * @example
 * export const ghostGridConfigSchema = z.object({
 *   ...createDualTagSchema('#grid-left', '#grid-right'),
 *   // other fields...
 * })
 */
export const createDualTagSchema = (leftDefault: string, rightDefault: string) => ({
  tags: z.object({
    left: z.string().default(leftDefault),
    right: z.string().default(rightDefault)
  }).default({ left: leftDefault, right: rightDefault })
})

// =============================================================================
// Title Size
// =============================================================================

export const TITLE_SIZE_VALUES = ['small', 'normal', 'large'] as const
export type TitleSizeOption = typeof TITLE_SIZE_VALUES[number]

export const TITLE_SIZE_OPTIONS = [
  { label: 'Small', value: TITLE_SIZE_VALUES[0] },
  { label: 'Normal', value: TITLE_SIZE_VALUES[1] },
  { label: 'Large', value: TITLE_SIZE_VALUES[2] }
] as const

export const titleSizeConfigSchema = z.object({
  titleSize: z.enum(TITLE_SIZE_VALUES).default('normal')
})

export const titleSizeShape = titleSizeConfigSchema.shape

export const titleSizeSetting: SettingSchema = {
  type: 'select',
  id: 'titleSize',
  label: 'Title size',
  options: [...TITLE_SIZE_OPTIONS]
}

// =============================================================================
// Primary Cards (Ghost Editor Card List)
// =============================================================================

const primaryCardsHeaderSetting: SettingSchema = {
  type: 'header',
  id: 'primary-cards-header',
  label: 'Primary Cards',
  helpUrl: 'https://ghost.org/help/cards/'
}

const primaryCardsHelpSetting: SettingSchema = {
  type: 'paragraph',
  id: 'primary-cards-help',
  content: 'Launch the dynamic card menu by clicking the + button, or type / on a new line.'
}

const primaryCardsListSetting: SettingSchema = {
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

/**
 * Primary Cards Settings Group
 * Complete settings for displaying the Ghost Editor card list.
 * Use this when you need the header, help text, and card list together.
 */
export const primaryCardsSettings: SettingSchema[] = [
  primaryCardsHeaderSetting,
  primaryCardsHelpSetting,
  primaryCardsListSetting
]
