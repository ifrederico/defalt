/**
 * Validation - Runtime validation utilities for section configs
 *
 * Uses Zod schemas from section definitions to validate configs
 * at various points: load, update, export.
 */

import { z } from 'zod'
import { getSectionDefinition } from './sectionRegistry.js'

// =============================================================================
// Types
// =============================================================================

export interface ValidationSuccess<T = unknown> {
  success: true
  data: T
}

export interface ValidationError {
  success: false
  errors: z.ZodError
  message: string
}

export type ValidationResult<T = unknown> = ValidationSuccess<T> | ValidationError

export interface FieldError {
  path: string
  message: string
}

// =============================================================================
// Full Config Validation
// =============================================================================

/**
 * Validate a section config against its Zod schema
 *
 * @param sectionId - The section definition ID
 * @param config - The config to validate
 * @returns Validation result with parsed data or errors
 *
 * @example
 * const result = validateSectionConfig('hero', userConfig)
 * if (result.success) {
 *   // result.data is typed and validated
 * } else {
 *   console.error(result.message)
 * }
 */
export function validateSectionConfig<T = unknown>(
  sectionId: string,
  config: unknown
): ValidationResult<T> {
  const definition = getSectionDefinition(sectionId)

  if (!definition) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: `Unknown section: ${sectionId}`
        }
      ]),
      message: `Unknown section: ${sectionId}`
    }
  }

  const schema = definition.configSchema

  if (!schema) {
    // No schema defined, pass through
    return {
      success: true,
      data: config as T
    }
  }

  const result = schema.safeParse(config)

  if (result.success) {
    return {
      success: true,
      data: result.data as T
    }
  }

  return {
    success: false,
    errors: result.error,
    message: formatZodError(result.error)
  }
}

/**
 * Validate and return parsed config, throwing on error
 */
export function parseConfigOrThrow<T = unknown>(sectionId: string, config: unknown): T {
  const result = validateSectionConfig<T>(sectionId, config)

  if (!result.success) {
    throw new Error(`Invalid config for section "${sectionId}": ${result.message}`)
  }

  return result.data
}

// =============================================================================
// Partial Config Validation
// =============================================================================

/**
 * Validate a partial config update
 * Useful for incremental updates in the UI
 */
export function validatePartialConfig(
  sectionId: string,
  partialConfig: Record<string, unknown>
): ValidationResult {
  const definition = getSectionDefinition(sectionId)

  if (!definition) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: `Unknown section: ${sectionId}`
        }
      ]),
      message: `Unknown section: ${sectionId}`
    }
  }

  const schema = definition.configSchema

  if (!schema) {
    return {
      success: true,
      data: partialConfig
    }
  }

  // Make all fields optional for partial validation
  const partialSchema = schema.partial()
  const result = partialSchema.safeParse(partialConfig)

  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }

  return {
    success: false,
    errors: result.error,
    message: formatZodError(result.error)
  }
}

// =============================================================================
// Default Config Generation
// =============================================================================

/**
 * Get the default config for a section
 * Uses the Zod schema's default values
 */
export function getDefaultConfig<T = unknown>(sectionId: string): T | null {
  const definition = getSectionDefinition(sectionId)

  if (!definition) {
    console.warn(`[validation] Unknown section: ${sectionId}`)
    return null
  }

  // Use the createConfig factory if available
  if (typeof definition.createConfig === 'function') {
    return definition.createConfig() as T
  }

  // Fallback: parse empty object to get defaults from schema
  const schema = definition.configSchema
  if (schema) {
    const result = schema.safeParse({})
    if (result.success) {
      return result.data as T
    }
  }

  return null
}

/**
 * Merge user config with defaults, filling in missing fields
 */
export function mergeWithDefaults<T extends Record<string, unknown>>(
  sectionId: string,
  userConfig: Partial<T>
): T | null {
  const defaults = getDefaultConfig<T>(sectionId)

  if (!defaults) {
    return userConfig as T
  }

  return {
    ...defaults,
    ...userConfig
  }
}

// =============================================================================
// Field-Level Validation
// =============================================================================

/**
 * Validate a single field value
 */
export function validateField(
  sectionId: string,
  fieldId: string,
  value: unknown
): { valid: boolean; message?: string } {
  const definition = getSectionDefinition(sectionId)

  if (!definition?.configSchema) {
    return { valid: true }
  }

  // Create a partial object with just this field
  const testObject = setNestedValue({}, fieldId, value)

  // Use partial schema for single field validation
  const partialSchema = definition.configSchema.partial()
  const result = partialSchema.safeParse(testObject)

  if (result.success) {
    return { valid: true }
  }

  // Find error for this specific field
  const fieldError = result.error.errors.find(
    (err) => err.path.join('.') === fieldId || err.path[0] === fieldId
  )

  return {
    valid: false,
    message: fieldError?.message ?? 'Invalid value'
  }
}

// =============================================================================
// Batch Validation
// =============================================================================

/**
 * Validate multiple section configs at once
 * Useful for export validation
 */
export function validateAllConfigs(
  configs: Record<string, { definitionId: string; config: unknown }>
): {
  valid: boolean
  errors: Record<string, ValidationError>
} {
  const errors: Record<string, ValidationError> = {}
  let valid = true

  for (const [instanceId, { definitionId, config }] of Object.entries(configs)) {
    const result = validateSectionConfig(definitionId, config)

    if (!result.success) {
      valid = false
      errors[instanceId] = result
    }
  }

  return { valid, errors }
}

// =============================================================================
// Error Formatting
// =============================================================================

/**
 * Format a Zod error into a human-readable message
 */
export function formatZodError(error: z.ZodError): string {
  const messages = error.errors.map((err) => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })

  return messages.join('; ')
}

/**
 * Extract field-level errors from a Zod error
 */
export function extractFieldErrors(error: z.ZodError): FieldError[] {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message
  }))
}

/**
 * Get error message for a specific field
 */
export function getFieldError(error: z.ZodError, fieldPath: string): string | null {
  const fieldError = error.errors.find(
    (err) => err.path.join('.') === fieldPath
  )

  return fieldError?.message ?? null
}

// =============================================================================
// Schema Introspection
// =============================================================================

/**
 * Get the Zod schema for a section
 */
export function getSectionSchema(sectionId: string): z.ZodType | null {
  const definition = getSectionDefinition(sectionId)
  return definition?.configSchema ?? null
}

/**
 * Check if a section has a config schema
 */
export function hasConfigSchema(sectionId: string): boolean {
  const definition = getSectionDefinition(sectionId)
  return !!definition?.configSchema
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Set a nested value in an object using dot notation
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return obj
}

/**
 * Get a nested value from an object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current
}
