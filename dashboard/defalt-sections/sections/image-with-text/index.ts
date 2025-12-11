/**
 * Image With Text Section Definition
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
  description: 'Image alongside text content',
  tag: '#image-text',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 48, bottom: 48 },
  configSchema: imageWithTextConfigSchema,
  settingsSchema: imageWithTextSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => imageWithTextDefaults,
  templatePath: 'image-with-text/image-with-text.hbs'
}

export type { ImageWithTextSectionConfig }
export { imageWithTextConfigSchema, imageWithTextSettingsSchema, imageWithTextDefaults }
