/**
 * Shared tag utilities for Ghost section definitions
 * Used by ghostCards, ghostGrid, imageWithText, and hero sections
 */

import type { PreviewPageData } from '../engine/previewTypes.js'

// Re-export the type for convenience
export type { PreviewPageData }

/**
 * Normalize and format a tag input string.
 * Requires a leading # and lowercases the tag value.
 */
export function formatInternalTag(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }
  if (!trimmed.startsWith('#')) {
    return ''
  }
  // Remove any leading # symbols, then lowercase
  const stripped = trimmed.replace(/^#+/, '').toLowerCase()
  if (!stripped) {
    return ''
  }
  return `#${stripped}`
}

/**
 * Convert internal tag format (#cards) to API slug format (hash-cards)
 */
export function toApiTagSlug(internalTag: string): string {
  if (internalTag.startsWith('#')) {
    return 'hash-' + internalTag.slice(1)
  }
  return ''
}

/**
 * Parse numeric suffix from a ghost-cards section ID.
 * Returns 1 for 'ghost-cards', the number for 'ghost-cards-N', or 0 for non-matching IDs.
 */
export function parseGhostCardIdSuffix(sectionId: string): number {
  if (sectionId === 'ghost-cards') {
    return 1
  }
  const match = sectionId.match(/^ghost-cards-(\d+)$/)
  if (!match) {
    return 0
  }
  const numeric = Number.parseInt(match[1], 10)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Parse numeric suffix from a hero section ID.
 * Returns 1 for base IDs, the number for suffixed IDs, or 0 for non-matching IDs.
 */
export function parseHeroIdSuffix(sectionId: string): number {
  if (typeof sectionId !== 'string') {
    return 0
  }
  const normalized = sectionId.trim().toLowerCase()
  const match = normalized.match(/^hero(?:-(\d+))?$/)
  if (!match) {
    return 0
  }
  if (!match[1]) {
    return 1
  }
  const numeric = Number.parseInt(match[1], 10)
  return Number.isFinite(numeric) ? numeric : 1
}

/**
 * Resolve the default hero tag for a given instance ID.
 */
export function resolveHeroTagFromId(sectionId: string): string {
  const suffix = parseHeroIdSuffix(sectionId)
  if (suffix <= 1) {
    return '#hero'
  }
  return `#hero-${suffix}`
}

/**
 * Parse numeric suffix from an image-with-text section ID.
 * Returns 1 for base IDs, the number for suffixed IDs, or 0 for non-matching IDs.
 */
export function parseImageWithTextIdSuffix(sectionId: string): number {
  if (typeof sectionId !== 'string') {
    return 0
  }
  const normalized = sectionId.trim().toLowerCase()
  const match = normalized.match(/^image-with-text(?:-(\d+))?$/)
  if (!match) {
    return 0
  }
  if (!match[1]) {
    return 1
  }
  const numeric = Number.parseInt(match[1], 10)
  return Number.isFinite(numeric) ? numeric : 1
}

/**
 * Resolve the default image-with-text tag for a given instance ID.
 */
export function resolveImageWithTextTagFromId(sectionId: string): string {
  const suffix = parseImageWithTextIdSuffix(sectionId)
  if (suffix <= 1) {
    return '#image-text'
  }
  return `#image-text-${suffix}`
}
