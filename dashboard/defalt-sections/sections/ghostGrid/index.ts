/**
 * Ghost Grid Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { ghostGridConfigSchema, ghostGridSettingsSchema, type GhostGridSectionConfig } from './schema.js'
import { ghostGridDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostGridConfigSchema> = {
  id: 'ghostGrid',
  label: 'Ghost Grid',
  description: 'Two-column grid for Ghost pages',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 0, bottom: 0 },
  showPaddingControls: false,
  configSchema: ghostGridConfigSchema,
  settingsSchema: ghostGridSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => ghostGridDefaults,
  templatePath: 'ghostGrid/ghostGrid.hbs'
}

export type { GhostGridSectionConfig }
export { ghostGridConfigSchema, ghostGridSettingsSchema, ghostGridDefaults }
