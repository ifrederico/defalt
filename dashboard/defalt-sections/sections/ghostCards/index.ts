/**
 * Ghost Cards Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { ghostCardsConfigSchema, ghostCardsSettingsSchema, ghostCardsBlocksSchema, type GhostCardsSectionConfig } from './schema.js'
import { ghostCardsDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostCardsConfigSchema> = {
  id: 'ghostCards',
  label: 'Cards',
  description: 'A grid of content cards',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 48, bottom: 48 },
  configSchema: ghostCardsConfigSchema,
  settingsSchema: ghostCardsSettingsSchema,
  blocksSchema: ghostCardsBlocksSchema,
  createConfig: () => ghostCardsDefaults,
  templatePath: 'ghostCards/ghostCards.hbs'
}

export type { GhostCardsSectionConfig }
export { ghostCardsConfigSchema, ghostCardsSettingsSchema, ghostCardsDefaults }
