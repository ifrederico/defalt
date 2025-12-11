/**
 * Hero Section Defaults
 *
 * Derived from the Zod schema to ensure single source of truth.
 * All default values are defined in heroConfigSchema.
 */

import { heroConfigSchema, type HeroConfig } from './schema.js'

// Derive defaults from Zod schema - no manual duplication needed
export const heroDefaults: HeroConfig = heroConfigSchema.parse({})
