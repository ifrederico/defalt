/**
 * Ghost Grid Section Defaults
 *
 * Derived from the Zod schema to ensure single source of truth.
 */

import { ghostGridConfigSchema, type GhostGridSectionConfig } from './schema.js'

// Derive defaults from Zod schema - no manual duplication needed
export const ghostGridDefaults: GhostGridSectionConfig = ghostGridConfigSchema.parse({})
