/**
 * Settings Walker - Schema traversal utilities
 *
 * This module provides utilities for traversing section settings schemas,
 * including nested block settings. Useful for:
 * - Extracting all setting IDs from a schema
 * - Finding settings by type
 * - Validating config against schema
 * - Building default configs from schemas
 */

import type { SettingSchema, BlockSchema, SectionDefinition } from './schemaTypes.js'

// =============================================================================
// Types
// =============================================================================

export type SettingLocation = {
  /** Setting ID */
  id: string
  /** Parent block type (null if top-level setting) */
  blockType: string | null
  /** Block index if inside a block instance */
  blockIndex?: number
}

export type WalkCallback = (
  setting: SettingSchema,
  location: SettingLocation
) => void | boolean // Return false to stop iteration

export type FilterPredicate = (setting: SettingSchema) => boolean

// =============================================================================
// Core Walker
// =============================================================================

/**
 * Walks all settings in a schema, including nested block settings.
 * Calls the callback for each setting found.
 *
 * @param settings - Top-level settings array
 * @param blocks - Optional block definitions
 * @param callback - Function called for each setting
 */
export function walkSettingsSchema(
  settings: SettingSchema[],
  blocks: BlockSchema[] | undefined,
  callback: WalkCallback
): void {
  // Walk top-level settings
  for (const setting of settings) {
    const shouldContinue = callback(setting, { id: setting.id, blockType: null })
    if (shouldContinue === false) return
  }

  // Walk block settings
  if (blocks) {
    for (const block of blocks) {
      for (const setting of block.settings) {
        const shouldContinue = callback(setting, {
          id: setting.id,
          blockType: block.type
        })
        if (shouldContinue === false) return
      }
    }
  }
}

/**
 * Walks settings in a section definition
 */
export function walkSectionSettings(
  definition: SectionDefinition,
  callback: WalkCallback
): void {
  walkSettingsSchema(definition.settingsSchema, definition.blocksSchema, callback)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Collects all setting IDs from a schema
 */
export function getAllSettingIds(
  settings: SettingSchema[],
  blocks?: BlockSchema[]
): string[] {
  const ids: string[] = []
  walkSettingsSchema(settings, blocks, (setting) => {
    ids.push(setting.id)
  })
  return ids
}

/**
 * Collects all setting IDs from a section definition
 */
export function getSectionSettingIds(definition: SectionDefinition): string[] {
  return getAllSettingIds(definition.settingsSchema, definition.blocksSchema)
}

/**
 * Finds settings matching a predicate
 */
export function findSettings(
  settings: SettingSchema[],
  blocks: BlockSchema[] | undefined,
  predicate: FilterPredicate
): Array<{ setting: SettingSchema; location: SettingLocation }> {
  const results: Array<{ setting: SettingSchema; location: SettingLocation }> = []
  walkSettingsSchema(settings, blocks, (setting, location) => {
    if (predicate(setting)) {
      results.push({ setting, location })
    }
  })
  return results
}

/**
 * Finds settings by type
 */
export function findSettingsByType<T extends SettingSchema['type']>(
  settings: SettingSchema[],
  blocks: BlockSchema[] | undefined,
  type: T
): Array<{ setting: Extract<SettingSchema, { type: T }>; location: SettingLocation }> {
  return findSettings(settings, blocks, (s) => s.type === type) as Array<{
    setting: Extract<SettingSchema, { type: T }>
    location: SettingLocation
  }>
}

/**
 * Gets a setting by ID from the schema
 */
export function getSettingById(
  settings: SettingSchema[],
  blocks: BlockSchema[] | undefined,
  id: string
): { setting: SettingSchema; location: SettingLocation } | null {
  let result: { setting: SettingSchema; location: SettingLocation } | null = null
  walkSettingsSchema(settings, blocks, (setting, location) => {
    if (setting.id === id) {
      result = { setting, location }
      return false // Stop iteration
    }
  })
  return result
}

/**
 * Checks if a setting ID exists in the schema
 */
export function hasSettingId(
  settings: SettingSchema[],
  blocks: BlockSchema[] | undefined,
  id: string
): boolean {
  return getSettingById(settings, blocks, id) !== null
}

// =============================================================================
// Default Value Extraction
// =============================================================================

type SettingDefault = string | number | boolean | undefined

/**
 * Extracts the default value from a setting schema
 */
export function getSettingDefault(setting: SettingSchema): SettingDefault {
  switch (setting.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'url':
    case 'color':
    case 'select':
    case 'radio':
    case 'image_picker':
      return setting.default
    case 'checkbox':
      return setting.default
    case 'range':
      return setting.default
    case 'header':
    case 'paragraph':
    case 'cardList':
      return undefined // Display-only, no default
    default:
      return undefined
  }
}

/**
 * Builds a default config object from settings schema
 * Only includes settings that have default values
 */
export function buildDefaultsFromSchema(
  settings: SettingSchema[],
  blocks?: BlockSchema[]
): Record<string, SettingDefault> {
  const defaults: Record<string, SettingDefault> = {}

  walkSettingsSchema(settings, blocks, (setting, location) => {
    const defaultValue = getSettingDefault(setting)
    if (defaultValue !== undefined) {
      // For block settings, we just record the default but actual block instances
      // would need separate handling
      if (location.blockType === null) {
        defaults[setting.id] = defaultValue
      }
    }
  })

  return defaults
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that a config object only contains known setting IDs
 * Returns array of unknown keys found in config
 */
export function findUnknownConfigKeys(
  config: Record<string, unknown>,
  settings: SettingSchema[],
  blocks?: BlockSchema[],
  hiddenKeys?: string[]
): string[] {
  const knownIds = new Set(getAllSettingIds(settings, blocks))

  // Add hidden keys as known
  if (hiddenKeys) {
    for (const key of hiddenKeys) {
      knownIds.add(key)
    }
  }

  // Find keys in config that aren't in schema
  return Object.keys(config).filter((key) => !knownIds.has(key))
}

// Note: findMissingRequiredSettings was removed as all settings are currently optional.
// When required field validation is needed, implement it here.

// =============================================================================
// Block Instance Helpers
// =============================================================================

/**
 * Walks settings within block instances in a config
 * @param config - The section config containing block instances
 * @param blocks - Block schema definitions
 * @param callback - Called for each setting in each block instance
 */
export function walkBlockInstances(
  config: Record<string, unknown>,
  blocks: BlockSchema[],
  callback: (
    setting: SettingSchema,
    value: unknown,
    location: SettingLocation & { blockIndex: number }
  ) => void | boolean
): void {
  for (const block of blocks) {
    const instances = config[block.type]
    if (!Array.isArray(instances)) continue

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i] as Record<string, unknown>
      for (const setting of block.settings) {
        const value = instance[setting.id]
        const shouldContinue = callback(setting, value, {
          id: setting.id,
          blockType: block.type,
          blockIndex: i
        })
        if (shouldContinue === false) return
      }
    }
  }
}
