/**
 * Ghost Cards Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { ghostCardsConfigSchema, ghostCardsSettingsSchema, type GhostCardsSectionConfig } from './schema.js'
import { ghostCardsDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostCardsConfigSchema> = {
  id: 'ghostCards',
  label: 'Ghost Cards',
  description: 'A grid of content cards',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 0, bottom: 0 },
  showPaddingControls: false,
  configSchema: ghostCardsConfigSchema,
  settingsSchema: ghostCardsSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => ghostCardsDefaults,
  templatePath: 'ghostCards/ghostCards.hbs'
}

export type { GhostCardsSectionConfig }
export { ghostCardsConfigSchema, ghostCardsSettingsSchema, ghostCardsDefaults }
