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

import { z } from 'zod'
import type { SectionDefinition, SectionInstance, SectionCategory } from './schemaTypes.js'
import { isPremium } from '@defalt/utils/config/premiumConfig.js'

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

const templateModules = import.meta.glob('../sections/*/*.hbs', { query: '?raw', import: 'default' })

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

    // Dev-only sections should not ship in the editor.
    if (sectionId.startsWith('debug-')) {
      continue
    }

    if (!module.definition) {
      console.warn(`[sectionRegistry] Section "${sectionId}" missing definition export`)
      continue
    }

    const definition = module.definition

    const warnings: string[] = []

    // Validate definition has required fields
    if (!definition.id) {
      console.warn(
        `[sectionRegistry] Section "${sectionId}" missing required field (id)`
      )
      continue
    }

    if (!definition.label) {
      warnings.push('missing required field (label)')
    }

    if (!definition.category) {
      warnings.push('missing required field (category)')
    }

    // Verify ID matches folder name
    if (definition.id !== sectionId) {
      console.warn(
        `[sectionRegistry] Section ID mismatch: folder "${sectionId}" vs definition "${definition.id}"`
      )
    }

    if (definition.templatePath) {
      const templateKey = `../sections/${definition.templatePath}`
      if (!templateModules[templateKey]) {
        warnings.push(`templatePath not found (${definition.templatePath})`)
      }
    }

    if (definition.configSchema && definition.settingsSchema && definition.settingsSchema.length > 0) {
      const schemaKeys = new Set<string>()
      const schemaDefaults: Record<string, unknown> = {}

      if (definition.configSchema instanceof z.ZodObject) {
        Object.keys(definition.configSchema.shape).forEach((key) => schemaKeys.add(key))
        const parsed = definition.configSchema.safeParse({})
        if (parsed.success && parsed.data && typeof parsed.data === 'object') {
          Object.assign(schemaDefaults, parsed.data as Record<string, unknown>)
        }
      }

      for (const setting of definition.settingsSchema) {
        if (!('id' in setting) || typeof setting.id !== 'string') {
          continue
        }
        if (setting.type === 'header' || setting.type === 'paragraph' || setting.type === 'cardList') {
          continue
        }
        if (schemaKeys.size > 0 && !schemaKeys.has(setting.id)) {
          warnings.push(`settingsSchema id "${setting.id}" missing in configSchema`)
        }
        if ('default' in setting && setting.default !== undefined) {
          const expected = schemaDefaults[setting.id]
          if (expected !== undefined && expected !== setting.default) {
            warnings.push(`settingsSchema default mismatch for "${setting.id}"`)
          }
        }
      }
    }

    if (warnings.length > 0) {
      console.warn(`[sectionRegistry] Section "${sectionId}" validation warnings:`, warnings)
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
const sectionDefinitionMap = new Map<string, RegisteredSection>(
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
 * Get sections by category
 */
export function getSectionsByCategory(category: SectionCategory): RegisteredSection[] {
  return sectionDefinitions.filter((def) => def.category === category)
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
  const baseConfig = definition.createConfig() as Record<string, unknown>

  // Merge with custom config
  const mergedConfig =
    customConfig && typeof customConfig === 'object'
      ? { ...baseConfig, ...(customConfig as Record<string, unknown>) }
      : baseConfig

  // Validate + apply Zod defaults at the boundary.
  const parsed = definition.configSchema.safeParse(mergedConfig)
  if (!parsed.success) {
    console.warn(
      `[sectionRegistry] Invalid config for section "${definitionId}" instance "${instanceId}"`,
      parsed.error.flatten().fieldErrors
    )
    return null
  }

  return {
    id: instanceId,
    definitionId,
    label: definition.label,
    category: definition.category,
    config: parsed.data as T
  }
}

/**
 * Get the template path for a section
 */
export function getSectionTemplatePath(sectionId: string): string | null {
  const definition = sectionDefinitionMap.get(sectionId)
  return definition?.templatePath ?? null
}

// Log on import in development
if (import.meta.env.DEV) {
  console.log(`[sectionRegistry] Loaded ${sectionDefinitions.length} section(s)`)
}
