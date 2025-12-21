/**
 * Ghost Cards Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { ghostCardsConfigSchema, ghostCardsSettingsSchema, type GhostCardsSectionConfig } from './schema.js'
import { ghostCardsDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostCardsConfigSchema> = {
  id: 'ghostCards',
  label: 'Ghost cards',
  description: 'A grid of content cards',
  tag: '#cards',
  category: 'template',
  defaultVisibility: true,
  paddingControls: 'vertical',
  configSchema: ghostCardsConfigSchema,
  settingsSchema: ghostCardsSettingsSchema,
  uiHiddenConfigKeys: ['tags'],
  blocksSchema: undefined,
  createConfig: () => ghostCardsDefaults,
  templatePath: 'ghostCards/ghostCards.hbs'
}

export type { GhostCardsSectionConfig }
export { ghostCardsConfigSchema, ghostCardsSettingsSchema, ghostCardsDefaults }
