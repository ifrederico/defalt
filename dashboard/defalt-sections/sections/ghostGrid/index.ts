/**
 * Ghost Grid Section Definition
 *
 * Show two Ghost pages side-by-side as feature cards.
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
  label: 'Ghost grid',
  description: 'Show two Ghost pages side-by-side as feature cards.',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32, left: 0, right: 0 },
  usesUnifiedPadding: false,
  configSchema: ghostGridConfigSchema,
  settingsSchema: ghostGridSettingsSchema,
  blocksSchema: ghostGridBlocksSchema,
  createConfig: () => ghostGridDefaults,
  templatePath: 'ghostGrid/ghostGrid.hbs'
}

export type { GhostGridSectionConfig }
export { ghostGridConfigSchema, ghostGridSettingsSchema, ghostGridDefaults }
