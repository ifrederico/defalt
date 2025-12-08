/**
 * Section Registry - Auto-discovery and registration of sections
 *
 * Uses Vite's import.meta.glob for automatic section discovery.
 * Simply create a folder in sections/ with an index.ts exporting
 * a definition, and it will be automatically registered.
 *
 * @example
 * // sections/hero/index.ts
 * export const definition = heroDefinition
 *
 * // The hero section is now automatically available via:
 * getSectionDefinition('hero')
 */

import type { SectionDefinition, SectionInstance, SectionCategory } from './schemaTypes.js'
import { isPremium } from '../premiumConfig.js'

// =============================================================================
// Types
// =============================================================================

export interface SectionModule {
  definition: SectionDefinition
}

export interface RegisteredSection extends SectionDefinition {
  premium: boolean
}

// =============================================================================
// Auto-Discovery via import.meta.glob
// =============================================================================

/**
 * Eagerly import all section index.ts files
 * This runs at build time and creates a map of all sections
 */
const sectionModules = import.meta.glob<SectionModule>(
  '../sections/*/index.ts',
  { eager: true }
)

/**
 * Extract section definitions from modules
 */
function loadSectionDefinitions(): RegisteredSection[] {
  const definitions: RegisteredSection[] = []

  for (const [path, module] of Object.entries(sectionModules)) {
    // Extract section ID from path: ../sections/hero/index.ts -> hero
    const match = path.match(/\/sections\/([^/]+)\/index\.ts$/)
    if (!match) {
      console.warn(`[sectionRegistry] Invalid section path: ${path}`)
      continue
    }

    const sectionId = match[1]

    if (!module.definition) {
      console.warn(`[sectionRegistry] Section "${sectionId}" missing definition export`)
      continue
    }

    const definition = module.definition

    // Validate definition has required fields
    if (!definition.id || !definition.templatePath) {
      console.warn(
        `[sectionRegistry] Section "${sectionId}" missing required fields (id, templatePath)`
      )
      continue
    }

    // Verify ID matches folder name
    if (definition.id !== sectionId) {
      console.warn(
        `[sectionRegistry] Section ID mismatch: folder "${sectionId}" vs definition "${definition.id}"`
      )
    }

    // Apply premium status from config
    const registeredSection: RegisteredSection = {
      ...definition,
      premium: isPremium(definition.id)
    }

    definitions.push(registeredSection)
  }

  return definitions
}

// =============================================================================
// Registry State
// =============================================================================

/**
 * All discovered section definitions
 */
export const sectionDefinitions: RegisteredSection[] = loadSectionDefinitions()

/**
 * Map for O(1) lookup by section ID
 */
export const sectionDefinitionMap = new Map<string, RegisteredSection>(
  sectionDefinitions.map((def) => [def.id, def])
)

// =============================================================================
// Public API
// =============================================================================

/**
 * Get a section definition by ID
 */
export function getSectionDefinition(sectionId: string): RegisteredSection | undefined {
  return sectionDefinitionMap.get(sectionId)
}

/**
 * Check if a section exists
 */
export function hasSection(sectionId: string): boolean {
  return sectionDefinitionMap.has(sectionId)
}

/**
 * Get all section IDs
 */
export function getSectionIds(): string[] {
  return Array.from(sectionDefinitionMap.keys())
}

/**
 * Get sections by category
 */
export function getSectionsByCategory(category: SectionCategory): RegisteredSection[] {
  return sectionDefinitions.filter((def) => def.category === category)
}

/**
 * Get all premium sections
 */
export function getPremiumSections(): RegisteredSection[] {
  return sectionDefinitions.filter((def) => def.premium)
}

/**
 * Get all free sections
 */
export function getFreeSections(): RegisteredSection[] {
  return sectionDefinitions.filter((def) => !def.premium)
}

/**
 * Build a section instance with merged config
 *
 * @param definitionId - The section definition ID
 * @param instanceId - Unique instance ID for this section
 * @param customConfig - Optional custom config to merge with defaults
 */
export function buildSectionInstance<T = unknown>(
  definitionId: string,
  instanceId: string,
  customConfig?: Partial<T>
): SectionInstance<T> | null {
  const definition = sectionDefinitionMap.get(definitionId)
  if (!definition) {
    console.warn(`[sectionRegistry] Unknown section: ${definitionId}`)
    return null
  }

  // Get default config from definition
  const baseConfig = definition.createConfig()

  // Merge with custom config
  const mergedConfig =
    customConfig && typeof customConfig === 'object'
      ? { ...baseConfig, ...customConfig }
      : baseConfig

  return {
    id: instanceId,
    definitionId,
    label: definition.label,
    category: definition.category,
    config: mergedConfig as T
  }
}

/**
 * Get the template path for a section
 */
export function getSectionTemplatePath(sectionId: string): string | null {
  const definition = sectionDefinitionMap.get(sectionId)
  return definition?.templatePath ?? null
}

/**
 * List all available sections with metadata
 */
export function listSections(): Array<{
  id: string
  label: string
  description?: string
  category: SectionCategory
  premium: boolean
}> {
  return sectionDefinitions.map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    category: def.category,
    premium: def.premium
  }))
}

// =============================================================================
// Debug Utilities
// =============================================================================

/**
 * Log all registered sections (for debugging)
 */
export function debugLogSections(): void {
  console.group('[sectionRegistry] Registered Sections')
  for (const def of sectionDefinitions) {
    console.log(`- ${def.id} (${def.label})${def.premium ? ' [PREMIUM]' : ''}`)
    console.log(`  Template: ${def.templatePath}`)
    console.log(`  Settings: ${def.settingsSchema?.length ?? 0} fields`)
    console.log(`  Blocks: ${def.blocksSchema?.length ?? 0} types`)
  }
  console.groupEnd()
}

// Log on import in development
if (import.meta.env.DEV) {
  console.log(`[sectionRegistry] Loaded ${sectionDefinitions.length} section(s)`)
}
