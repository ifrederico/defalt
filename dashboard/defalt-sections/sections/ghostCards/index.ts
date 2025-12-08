/**
 * Ghost Cards Section Definition
 *
 * Display a three-card grid for featured posts or offers.
 * Fetches content from Ghost pages by tag or uses manual cards.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import {
  ghostCardsConfigSchema,
  ghostCardsSettingsSchema,
  ghostCardsBlocksSchema,
  type GhostCardsSectionConfig
} from './schema.js'
import { ghostCardsDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof ghostCardsConfigSchema> = {
  id: 'ghostCards',
  label: 'Ghost cards',
  description: 'Display a three-card grid for featured posts or offers.',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32, left: 0, right: 0 },
  usesUnifiedPadding: false,
  configSchema: ghostCardsConfigSchema,
  settingsSchema: ghostCardsSettingsSchema,
  blocksSchema: ghostCardsBlocksSchema,
  createConfig: () => ghostCardsDefaults,
  templatePath: 'ghostCards/ghostCards.hbs'
}

export type { GhostCardsSectionConfig }
export { ghostCardsConfigSchema, ghostCardsSettingsSchema, ghostCardsDefaults }
