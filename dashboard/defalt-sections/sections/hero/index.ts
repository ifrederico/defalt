/**
 * Hero Section Definition
 *
 * A full-width hero banner with heading, subheading, and optional CTA button.
 * Supports customizable colors, alignment, width, and height modes.
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { heroConfigSchema, heroSettingsSchema, type HeroConfig } from './schema.js'
import { heroDefaults } from './defaults.js'

/**
 * Hero section definition
 */
export const definition: SectionDefinition<typeof heroConfigSchema> = {
  id: 'hero',
  label: 'Hero',
  description: 'Full-width hero banner with heading, subheading, and CTA',
  category: 'template',
  defaultVisibility: true,
  defaultPadding: { top: 32, bottom: 32 },
  usesUnifiedPadding: false,

  // Zod schema for config validation
  configSchema: heroConfigSchema,

  // UI settings schema for panel generation
  settingsSchema: heroSettingsSchema,

  // No blocks for hero (single content area)
  blocksSchema: undefined,

  // Factory for default config
  createConfig: () => heroDefaults,

  // Path to Handlebars template (relative to sections/)
  templatePath: 'hero/hero.hbs'
}

// Re-export types for consumers
export type { HeroConfig }
export { heroConfigSchema, heroSettingsSchema, heroDefaults }
