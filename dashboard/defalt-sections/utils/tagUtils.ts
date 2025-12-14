/**
 * Shared tag utilities for Ghost section definitions
 * Used by ghostCards, ghostGrid, and imageWithText sections
 */

import type { PreviewPageData } from '../engine/previewTypes.js'

// Re-export the type for convenience
export type { PreviewPageData }

/**
 * Normalize and format a tag input string
 * Handles various formats: "#tag", "tag", "ghost-card-1", etc.
 */
export function formatInternalTag(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }
  const stripped = trimmed.replace(/^#+/, '')
  if (!stripped) {
    return ''
  }
  // Handle ghost-card/ghost-cards variants
  const ghostMatch = stripped.toLowerCase().match(/^ghost-cards?-?(\d+)?$/)
  if (ghostMatch) {
    const suffix = ghostMatch[1]
    return suffix ? `#ghost-card-${suffix}` : '#ghost-card'
  }
  return `#${stripped}`
}

/**
 * Convert internal tag format (#ghost-card) to API slug format (hash-ghost-card)
 */
export function toApiTagSlug(internalTag: string): string {
  if (internalTag.startsWith('#')) {
    return 'hash-' + internalTag.slice(1)
  }
  return internalTag
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
 * Parse numeric suffix from a ghost card tag value.
 * Returns 1 for '#ghost-card', the number for '#ghost-card-N', or 0 for non-matching tags.
 */
export function parseGhostCardTagSuffix(tagValue: unknown): number {
  if (typeof tagValue !== 'string') {
    return 0
  }
  const normalized = tagValue.trim().replace(/^#+/, '').toLowerCase()
  if (!normalized) {
    return 0
  }
  const match = normalized.match(/^ghost-cards?-?(\d+)?$/)
  if (!match) {
    return 0
  }
  if (!match[1]) {
    return 1
  }
  const numeric = Number.parseInt(match[1], 10)
  return Number.isFinite(numeric) ? numeric : 1
}
