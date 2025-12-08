/**
 * Image With Text Section Definition
 *
 * Display an image alongside text content with optional call-to-action.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import {
  imageWithTextConfigSchema,
  imageWithTextSettingsSchema,
  type ImageWithTextSectionConfig
} from './schema.js'
import { imageWithTextDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof imageWithTextConfigSchema> = {
  id: 'image-with-text',
  label: 'Image with Text',
  description: 'Display an image alongside text content with optional call-to-action.',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32, left: 0, right: 0 },
  usesUnifiedPadding: false,
  configSchema: imageWithTextConfigSchema,
  settingsSchema: imageWithTextSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => imageWithTextDefaults,
  templatePath: 'image-with-text/image-with-text.hbs'
}

export type { ImageWithTextSectionConfig }
export { imageWithTextConfigSchema, imageWithTextSettingsSchema, imageWithTextDefaults }
