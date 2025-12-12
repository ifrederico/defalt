/**
 * Header Section Defaults
 *
 * Derived from schema to ensure single source of truth.
 */

import { headerConfigSchema, type HeaderSectionConfig } from './schema.js'

// Derive defaults from schema - eliminates duplication
export const headerDefaults: HeaderSectionConfig = headerConfigSchema.parse({})
