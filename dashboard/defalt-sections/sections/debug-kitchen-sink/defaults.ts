/**
 * Kitchen Sink Debug Section Defaults
 */

import { kitchenSinkConfigSchema, type KitchenSinkConfig } from './schema.js'

/**
 * Create default config by parsing empty object through Zod schema
 */
export function createKitchenSinkConfig(): KitchenSinkConfig {
  return kitchenSinkConfigSchema.parse({})
}

/**
 * Default padding for kitchen sink section
 */
export const kitchenSinkDefaultPadding = {
  top: 48,
  bottom: 48
}
