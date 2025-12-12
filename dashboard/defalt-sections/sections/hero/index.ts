/**
 * Hero Section Definition
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { heroConfigSchema, heroSettingsSchema, type HeroConfig } from './schema.js'
import { heroDefaults } from './defaults.js'

export const definition: SectionDefinition<typeof heroConfigSchema> = {
  id: 'hero',
  label: 'Hero',
  description: 'Split hero with image and text/CTAs',
  tag: '#hero',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 48, bottom: 48 },
  configSchema: heroConfigSchema,
  settingsSchema: heroSettingsSchema,
  blocksSchema: undefined,
  createConfig: () => heroDefaults,
  templatePath: 'hero/hero.hbs'
}

export type { HeroConfig }
export { heroConfigSchema, heroSettingsSchema, heroDefaults }
