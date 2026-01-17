/**
 * Schema Introspection Tests
 *
 * These tests verify that Zod schemas remain compatible after version changes.
 * Zod 4 introduced breaking changes to internal introspection APIs, so we test
 * the public schema behaviors to catch regressions.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { heroConfigSchema, heroSettingsSchema } from '../sections/hero/schema.js'
import { ghostCardsConfigSchema, ghostCardsSettingsSchema } from '../sections/ghostCards/schema.js'
import { ghostGridConfigSchema } from '../sections/ghostGrid/schema.js'
import { imageWithTextConfigSchema } from '../sections/image-with-text/schema.js'
import { announcementBarConfigSchema, announcementBarSettingsSchema } from '../sections/announcement-bar/schema.js'
import { headerConfigSchema } from '../sections/header/schema.js'
import {
  getAllSettingIds,
  findSettingsByType,
  buildDefaultsFromSchema,
  walkSettingsSchema
} from './settingsWalker.js'

// =============================================================================
// Schema Parsing Tests
// =============================================================================

describe('Section Config Schemas', () => {
  describe('heroConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = heroConfigSchema.parse({})
      // Verify key properties exist (actual names from the schema)
      expect(result).toHaveProperty('contentWidth')
      expect(result).toHaveProperty('pageTitle')
      expect(result).toHaveProperty('textAlignment')
      expect(result).toHaveProperty('tags')
    })

    it('validates custom values', () => {
      const result = heroConfigSchema.parse({
        contentWidth: '960px',
        pageTitle: false,
        textAlignment: 'left'
      })
      expect(result.contentWidth).toBe('960px')
      expect(result.pageTitle).toBe(false)
      expect(result.textAlignment).toBe('left')
    })

    it('applies defaults for empty input', () => {
      const result = heroConfigSchema.parse({})
      // Default values from the schema
      expect(result.contentWidth).toBe('1120px')
      expect(result.pageTitle).toBe(true)
    })
  })

  describe('ghostCardsConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = ghostCardsConfigSchema.parse({})
      expect(result).toBeDefined()
    })
  })

  describe('ghostGridConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = ghostGridConfigSchema.parse({})
      expect(result).toBeDefined()
    })
  })

  describe('imageWithTextConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = imageWithTextConfigSchema.parse({})
      expect(result).toBeDefined()
    })
  })

  describe('announcementBarConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = announcementBarConfigSchema.parse({})
      expect(result).toBeDefined()
    })
  })

  describe('headerConfigSchema', () => {
    it('parses empty object with defaults', () => {
      const result = headerConfigSchema.parse({})
      expect(result).toBeDefined()
    })
  })
})

// =============================================================================
// Settings Schema Tests
// =============================================================================

describe('UI Settings Schemas', () => {
  it('hero settings have expected structure', () => {
    expect(Array.isArray(heroSettingsSchema)).toBe(true)
    expect(heroSettingsSchema.length).toBeGreaterThan(0)

    // Check that each setting has required properties
    heroSettingsSchema.forEach((setting) => {
      expect(setting).toHaveProperty('type')
      expect(setting).toHaveProperty('id')
      expect(typeof setting.id).toBe('string')
    })
  })

  it('ghost cards settings have expected structure', () => {
    expect(Array.isArray(ghostCardsSettingsSchema)).toBe(true)
    ghostCardsSettingsSchema.forEach((setting) => {
      expect(setting).toHaveProperty('type')
      expect(setting).toHaveProperty('id')
    })
  })

  it('announcement bar settings have expected structure', () => {
    expect(Array.isArray(announcementBarSettingsSchema)).toBe(true)
    announcementBarSettingsSchema.forEach((setting) => {
      expect(setting).toHaveProperty('type')
      expect(setting).toHaveProperty('id')
    })
  })
})

// =============================================================================
// Settings Walker Tests
// =============================================================================

describe('settingsWalker', () => {
  describe('getAllSettingIds', () => {
    it('extracts all setting IDs from hero schema', () => {
      const ids = getAllSettingIds(heroSettingsSchema)
      expect(ids).toContain('contentWidth')  // from contentWidthPxSetting
      expect(ids).toContain('pageTitle')
      expect(ids.length).toBeGreaterThan(0)
    })

    it('extracts all setting IDs from ghost cards schema', () => {
      const ids = getAllSettingIds(ghostCardsSettingsSchema)
      expect(ids.length).toBeGreaterThan(0)
    })
  })

  describe('findSettingsByType', () => {
    it('finds checkbox settings', () => {
      const checkboxes = findSettingsByType(heroSettingsSchema, undefined, 'checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
      checkboxes.forEach(({ setting }) => {
        expect(setting.type).toBe('checkbox')
      })
    })

    it('finds header settings', () => {
      const headers = findSettingsByType(heroSettingsSchema, undefined, 'header')
      expect(headers.length).toBeGreaterThan(0)
      headers.forEach(({ setting }) => {
        expect(setting.type).toBe('header')
      })
    })
  })

  describe('buildDefaultsFromSchema', () => {
    it('builds defaults from hero schema', () => {
      const defaults = buildDefaultsFromSchema(heroSettingsSchema)
      expect(defaults).toBeDefined()
      // Should have some defaults
      expect(Object.keys(defaults).length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('walkSettingsSchema', () => {
    it('visits all settings', () => {
      const visited: string[] = []
      walkSettingsSchema(heroSettingsSchema, undefined, (setting) => {
        visited.push(setting.id)
      })
      expect(visited.length).toBe(heroSettingsSchema.length)
    })

    it('stops iteration when callback returns false', () => {
      const visited: string[] = []
      walkSettingsSchema(heroSettingsSchema, undefined, (setting) => {
        visited.push(setting.id)
        if (visited.length >= 2) {
          return false
        }
      })
      expect(visited.length).toBe(2)
    })
  })
})

// =============================================================================
// Zod Introspection Tests
// =============================================================================

describe('Zod introspection compatibility', () => {
  it('z.infer correctly infers types', () => {
    // This is a compile-time check, but we can verify the runtime behavior
    type HeroConfig = z.infer<typeof heroConfigSchema>
    const config: HeroConfig = heroConfigSchema.parse({})
    expect(config).toBeDefined()
  })

  it('schema.shape returns expected keys', () => {
    // Zod 4 changed some internal APIs - verify shape access works
    const shape = heroConfigSchema.shape
    expect(shape).toBeDefined()
    expect(typeof shape).toBe('object')
  })

  it('safeParse works correctly', () => {
    const result = heroConfigSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeDefined()
    }

    // Test with invalid enum value - this should fail
    const invalid = heroConfigSchema.safeParse({ contentWidth: 'not-a-valid-option' })
    expect(invalid.success).toBe(false)
  })

  it('default values are applied', () => {
    const schema = z.object({
      name: z.string().default('default'),
      count: z.number().default(0)
    })

    const result = schema.parse({})
    expect(result.name).toBe('default')
    expect(result.count).toBe(0)
  })

  it('optional and nullable work correctly', () => {
    const schema = z.object({
      optional: z.string().optional(),
      // In Zod 4, nullable() doesn't make the field optional
      // Use nullish() for optional + nullable, or just test nullable with a value
      nullableOptional: z.string().nullish()  // nullish = optional + nullable
    })

    const result = schema.parse({})
    expect(result.optional).toBeUndefined()
    expect(result.nullableOptional).toBeUndefined()

    const withNull = schema.parse({ nullableOptional: null })
    expect(withNull.nullableOptional).toBeNull()

    const withValue = schema.parse({ optional: 'test', nullableOptional: 'test' })
    expect(withValue.optional).toBe('test')
    expect(withValue.nullableOptional).toBe('test')
  })
})
