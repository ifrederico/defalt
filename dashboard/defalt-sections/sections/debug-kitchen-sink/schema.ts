/**
 * Kitchen Sink Debug Section Schema
 *
 * A comprehensive test section containing every primitive input type.
 * Used for UI standardization and quality testing.
 *
 * IMPORTANT: This section is for development/debugging only.
 * It should be hidden from production exports.
 */

import { z } from 'zod'
import type { SettingSchema } from '../../engine/schemaTypes.js'

// =============================================================================
// Zod Config Schema
// =============================================================================

export const kitchenSinkConfigSchema = z.object({
  // Text Inputs
  title: z.string().default('Page Title'),
  content: z.string().default('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  excerpt: z.string().default('A short summary of the content.'),
  linkUrl: z.string().default('https://ghost.org'),

  // Boolean Toggles
  toggleOn: z.boolean().default(true),
  toggleOff: z.boolean().default(false),

  // Range Sliders
  rangePadding: z.number().min(0).max(200).default(32),
  rangeOpacity: z.number().min(0).max(1).default(0.8),
  rangeBorderRadius: z.number().min(0).max(96).default(12),
  rangeSmallStep: z.number().min(0).max(10).default(2.5),
  rangeLongLabel: z.number().min(0).max(100).default(50),
  rangeAnotherLong: z.number().min(0).max(1200).default(800),

  // Select Dropdowns
  selectAlignment: z.enum(['left', 'center', 'right']).default('center'),
  selectSize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
  selectWidth: z.enum(['narrow', 'regular', 'wide', 'full']).default('regular'),

  // Radio Buttons
  radioLayout: z.enum(['grid', 'list', 'masonry']).default('grid'),

  // Image Picker
  heroImage: z.string().default(''),

  // Colors
  colorPrimary: z.string().default('#4F46E5'),
  colorSecondary: z.string().default('#10B981'),
  colorBackground: z.string().default('#FFFFFF'),
  colorText: z.string().default('#1F2937'),
  colorAccent: z.string().default('#F59E0B'),

})

export type KitchenSinkConfig = z.infer<typeof kitchenSinkConfigSchema>

// =============================================================================
// UI Settings Schema - Every Primitive Type
// =============================================================================

/**
 * Kitchen Sink settings schema - one of every input type
 * Organized by category for testing UI grouping
 */
export const kitchenSinkSettingsSchema: SettingSchema[] = [
  // =========================================================================
  // TEXT INPUTS
  // =========================================================================
  {
    type: 'header',
    id: 'text-header',
    label: 'Text Inputs'
  },
  {
    type: 'text',
    id: 'title',
    label: 'Title',
    default: 'Page Title',
    placeholder: 'Enter title...',
    info: 'Single-line text for page title'
  },
  {
    type: 'textarea',
    id: 'content',
    label: 'Content',
    default: 'Lorem ipsum dolor sit amet...',
    placeholder: 'Enter content...',
    info: 'Multi-line text pulled from content'
  },
  {
    type: 'textarea',
    id: 'excerpt',
    label: 'Excerpt',
    default: 'A short summary...',
    placeholder: 'Enter excerpt...',
    info: 'Multi-line text pulled from excerpt'
  },
  {
    type: 'url',
    id: 'linkUrl',
    label: 'Link URL',
    default: 'https://ghost.org',
    placeholder: 'https://...',
    info: 'URL input for links'
  },

  // =========================================================================
  // BOOLEAN TOGGLES
  // =========================================================================
  {
    type: 'header',
    id: 'toggle-header',
    label: 'Boolean Toggles'
  },
  {
    type: 'paragraph',
    id: 'toggle-info',
    content: 'Checkboxes render as toggle switches. Test both default states.'
  },
  {
    type: 'checkbox',
    id: 'toggleOn',
    label: 'Toggle (Default ON)',
    default: true,
    info: 'This toggle defaults to enabled'
  },
  {
    type: 'checkbox',
    id: 'toggleOff',
    label: 'Toggle (Default OFF)',
    default: false,
    info: 'This toggle defaults to disabled'
  },

  // =========================================================================
  // RANGE SLIDERS
  // =========================================================================
  {
    type: 'header',
    id: 'range-header',
    label: 'Range Sliders'
  },
  {
    type: 'paragraph',
    id: 'range-info',
    content: 'Test slider smoothness, value display, and unit formatting.'
  },
  {
    type: 'range',
    id: 'rangePadding',
    label: 'Padding',
    min: 0,
    max: 200,
    step: 4,
    default: 32,
    unit: 'px',
    info: 'Integer slider with pixel units'
  },
  {
    type: 'range',
    id: 'rangeOpacity',
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.8,
    info: 'Decimal slider without units'
  },
  {
    type: 'range',
    id: 'rangeBorderRadius',
    label: 'Radius',
    min: 0,
    max: 96,
    step: 1,
    default: 12,
    unit: 'px',
    info: 'Fine-grained integer slider'
  },
  {
    type: 'range',
    id: 'rangeSmallStep',
    label: 'Steps',
    min: 0,
    max: 10,
    step: 0.5,
    default: 2.5,
    info: 'Decimal slider with 0.5 step'
  },
  {
    type: 'range',
    id: 'rangeLongLabel',
    label: 'Border Radius Maximum',
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    unit: 'px',
    info: 'Long label to test truncation with ellipsis'
  },
  {
    type: 'range',
    id: 'rangeAnotherLong',
    label: 'Container Width',
    min: 0,
    max: 1200,
    step: 10,
    default: 800,
    unit: 'px',
    info: 'Another long label test'
  },

  // =========================================================================
  // SELECT DROPDOWNS
  // =========================================================================
  {
    type: 'header',
    id: 'select-header',
    label: 'Select Dropdowns'
  },
  {
    type: 'paragraph',
    id: 'select-info',
    content: 'Dropdowns should use Radix UI, not native browser selects.'
  },
  {
    type: 'select',
    id: 'selectAlignment',
    label: 'Alignment (3 options)',
    default: 'center',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' }
    ],
    info: 'Common 3-option alignment select'
  },
  {
    type: 'select',
    id: 'selectSize',
    label: 'Size (4 options)',
    default: 'normal',
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Normal', value: 'normal' },
      { label: 'Large', value: 'large' },
      { label: 'X-Large', value: 'x-large' }
    ],
    info: 'Size preset with 4 options'
  },
  {
    type: 'select',
    id: 'selectWidth',
    label: 'Width (4 options)',
    default: 'regular',
    options: [
      { label: 'Narrow', value: 'narrow' },
      { label: 'Regular', value: 'regular' },
      { label: 'Wide', value: 'wide' },
      { label: 'Full', value: 'full' }
    ],
    info: 'Width preset with semantic labels'
  },

  // =========================================================================
  // COLOR PICKERS
  // =========================================================================
  {
    type: 'header',
    id: 'color-header',
    label: 'Color Pickers'
  },
  {
    type: 'paragraph',
    id: 'color-info',
    content: 'Test color picker UI, hex input, and swatch display.'
  },
  {
    type: 'color',
    id: 'colorPrimary',
    label: 'Primary Color',
    default: '#4F46E5',
    info: 'Brand primary (Indigo)'
  },
  {
    type: 'color',
    id: 'colorSecondary',
    label: 'Secondary Color',
    default: '#10B981',
    info: 'Brand secondary (Emerald)'
  },
  {
    type: 'color',
    id: 'colorBackground',
    label: 'Background Color',
    default: '#FFFFFF',
    info: 'Light background'
  },
  {
    type: 'color',
    id: 'colorText',
    label: 'Text Color',
    default: '#1F2937',
    info: 'Dark text (Gray 800)'
  },
  {
    type: 'color',
    id: 'colorAccent',
    label: 'Accent Color',
    default: '#F59E0B',
    info: 'Highlight/accent (Amber)'
  },

  // =========================================================================
  // RADIO BUTTONS
  // =========================================================================
  {
    type: 'header',
    id: 'radio-header',
    label: 'Radio Buttons'
  },
  {
    type: 'paragraph',
    id: 'radio-info',
    content: 'Visual layout selection with button-style radio options.'
  },
  {
    type: 'radio',
    id: 'radioLayout',
    label: 'Layout Style',
    default: 'grid',
    options: [
      { label: 'Grid', value: 'grid' },
      { label: 'List', value: 'list' },
      { label: 'Masonry', value: 'masonry' }
    ],
    info: 'Choose a layout style for content display'
  },

  // =========================================================================
  // IMAGE PICKER
  // =========================================================================
  {
    type: 'header',
    id: 'image-header',
    label: 'Image Picker'
  },
  {
    type: 'paragraph',
    id: 'image-info',
    content: 'Upload images via drag-drop or paste URL.'
  },
  {
    type: 'image_picker',
    id: 'heroImage',
    label: 'Hero Image',
    info: 'Main hero/background image'
  },

]
