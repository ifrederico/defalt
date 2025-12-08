/**
 * Kitchen Sink Debug Section
 *
 * A development-only section for testing all UI primitive types.
 * Contains one of every input type for quality assurance testing.
 *
 * @devOnly - This section should NOT appear in production exports
 */

import type { SectionDefinition } from '../../engine/schemaTypes.js'
import { kitchenSinkConfigSchema, kitchenSinkSettingsSchema } from './schema.js'
import { createKitchenSinkConfig, kitchenSinkDefaultPadding } from './defaults.js'

const kitchenSinkDefinition: SectionDefinition<typeof kitchenSinkConfigSchema> = {
  id: 'debug-kitchen-sink',
  label: 'Kitchen Sink (Debug)',
  description: 'Test all UI primitives - dev only',
  category: 'template',
  premium: false,
  defaultVisibility: true,
  defaultPadding: kitchenSinkDefaultPadding,
  configSchema: kitchenSinkConfigSchema,
  settingsSchema: kitchenSinkSettingsSchema,
  createConfig: createKitchenSinkConfig,
  templatePath: 'debug-kitchen-sink/debug-kitchen-sink.hbs'
}

// Export for auto-discovery
export const definition = kitchenSinkDefinition

// Re-export schema and types
export { kitchenSinkConfigSchema, kitchenSinkSettingsSchema } from './schema.js'
export type { KitchenSinkConfig } from './schema.js'
