/**
 * Ghost Grid Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { ghostGridConfigSchema, ghostGridSettingsSchema, type GhostGridSectionConfig } from './schema.js'
import { ghostGridDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostGridConfigSchema> = {
  id: 'ghostGrid',
  label: 'Ghost grid',
  description: 'Two-column grid for Ghost pages',
  category: 'template',
  defaultVisibility: true,
  paddingControls: 'vertical',
  configSchema: ghostGridConfigSchema,
  settingsSchema: ghostGridSettingsSchema,
  uiHiddenConfigKeys: ['tags'],
  blocksSchema: undefined,
  createConfig: () => ghostGridDefaults,
  templatePath: 'ghostGrid/ghostGrid.hbs'
}

export type { GhostGridSectionConfig }
export { ghostGridConfigSchema, ghostGridSettingsSchema, ghostGridDefaults }
