/**
 * Ghost Cards Section Defaults
 *
 * Derived from the Zod schema to ensure single source of truth.
 */

import { ghostCardsConfigSchema, type GhostCardsSectionConfig } from './schema.js'

// Derive defaults from Zod schema - no manual duplication needed
export const ghostCardsDefaults: GhostCardsSectionConfig = ghostCardsConfigSchema.parse({})
