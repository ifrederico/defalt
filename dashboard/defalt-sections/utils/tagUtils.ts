/**
 * Shared tag utilities for Ghost section definitions
 * Used by ghostCards, ghostGrid, and imageWithText sections
 */

import type { PreviewPageData } from '../definitions/sectionTypes.js'

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
 * Check if a page has a specific tag by slug
 */
export function pageHasTag(page: PreviewPageData, tagSlug: string): boolean {
  if (!page.tags || !Array.isArray(page.tags)) return false
  return page.tags.some((tag: { slug?: string }) => tag.slug === tagSlug)
}

/**
 * Find the first page that has the required tag and doesn't have the hide tag
 */
export function findPageByTag(
  pages: PreviewPageData[],
  tagSlug: string,
  hideTagSlug?: string
): PreviewPageData | undefined {
  return pages.find((page) => {
    const hasRequiredTag = pageHasTag(page, tagSlug)
    const hasHideTag = hideTagSlug ? pageHasTag(page, hideTagSlug) : false
    return hasRequiredTag && !hasHideTag
  })
}

/**
 * Filter pages by tag, excluding pages with the hide tag
 */
export function filterPagesByTag(
  pages: PreviewPageData[],
  tagSlug: string,
  hideTagSlug?: string
): PreviewPageData[] {
  return pages.filter((page) => {
    const hasRequiredTag = pageHasTag(page, tagSlug)
    const hasHideTag = hideTagSlug ? pageHasTag(page, hideTagSlug) : false
    return hasRequiredTag && !hasHideTag
  })
}
