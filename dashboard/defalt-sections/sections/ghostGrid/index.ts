/**
 * Ghost Grid Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import {
  ghostGridConfigSchema,
  ghostGridSettingsSchema,
  ghostGridBlocksSchema,
  type GhostGridSectionConfig
} from './schema.js'
import { ghostGridDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostGridConfigSchema> = {
  id: 'ghostGrid',
  label: 'Ghost Grid',
  description: 'Two-column grid for Ghost pages',
  category: 'template',
  defaultVisibility: true,
  configSchema: ghostGridConfigSchema,
  settingsSchema: ghostGridSettingsSchema,
  blocksSchema: ghostGridBlocksSchema,
  createConfig: () => ghostGridDefaults,
  templatePath: 'ghostGrid/ghostGrid.hbs'
}

export type { GhostGridSectionConfig }
export { ghostGridConfigSchema, ghostGridSettingsSchema, ghostGridDefaults }
