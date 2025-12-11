/**
 * Image With Text Section Defaults
 *
 * Derived from the Zod schema to ensure single source of truth.
 */

import { imageWithTextConfigSchema, type ImageWithTextSectionConfig } from './schema.js'

// Derive defaults from Zod schema - no manual duplication needed
export const imageWithTextDefaults: ImageWithTextSectionConfig = imageWithTextConfigSchema.parse({})
