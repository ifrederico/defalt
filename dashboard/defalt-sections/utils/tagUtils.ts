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
  const normalized = stripped.toLowerCase()

  // Ghost Cards: legacy ghost-card/ghost-cards -> new #cards
  const ghostCardsMatch = normalized.match(/^ghost-cards?-?(\d+)?$/)
  if (ghostCardsMatch) {
    const suffix = ghostCardsMatch[1]
    return suffix ? `#cards-${suffix}` : '#cards'
  }

  // Ghost Cards: support direct #cards/#cards-2/#cards2 inputs
  const cardsMatch = normalized.match(/^cards-?(\d+)?$/)
  if (cardsMatch) {
    const suffix = cardsMatch[1]
    return suffix ? `#cards-${suffix}` : '#cards'
  }

  // Image with text: legacy image-with-text -> new #image-text
  const imageWithTextMatch = normalized.match(/^image-with-text-?(\d+)?$/)
  if (imageWithTextMatch) {
    const suffix = imageWithTextMatch[1]
    return suffix ? `#image-text-${suffix}` : '#image-text'
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
 * Returns 1 for '#cards', the number for '#cards-N', or 0 for non-matching tags.
 */
export function parseGhostCardTagSuffix(tagValue: unknown): number {
  if (typeof tagValue !== 'string') {
    return 0
  }
  const normalized = tagValue.trim().replace(/^#+/, '').toLowerCase()
  if (!normalized) {
    return 0
  }

  const cardsMatch = normalized.match(/^cards-?(\d+)?$/)
  if (cardsMatch) {
    const numeric = cardsMatch[1] ? Number.parseInt(cardsMatch[1], 10) : NaN
    if (!cardsMatch[1]) {
      return 1
    }
    return Number.isFinite(numeric) ? numeric : 1
  }

  const legacyMatch = normalized.match(/^ghost-cards?-?(\d+)?$/)
  if (!legacyMatch) {
    return 0
  }
  if (!legacyMatch[1]) {
    return 1
  }
  const numeric = Number.parseInt(legacyMatch[1], 10)
  return Number.isFinite(numeric) ? numeric : 1
}
