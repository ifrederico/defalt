/**
 * Tag Filter Utilities
 *
 * Shared utilities for resolving internal tags and tag filters for Ghost sections.
 * Consolidates logic from HandlebarsRenderer, SectionActionBar, and exportTheme.
 *
 * This module is self-contained and does not depend on other defalt-* modules
 * to respect the module boundary rules (defalt-utils has no defalt-* dependencies).
 */

export type TagFilterResult = {
  internalTag: string
  tagFilter: string
}

export type GridTagFilterResult = {
  left: TagFilterResult
  right: TagFilterResult
  anyTagFilter: string
}

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
 * Convert internal tag format (#cards) to API filter format (tag:hash-cards)
 */
export function toTagFilter(internalTag: string): string {
  return `tag:${toApiTagSlug(internalTag)}`
}

/**
 * Parse numeric suffix from a section instance ID.
 * Returns 1 for base IDs (e.g., 'hero'), the number for suffixed IDs (e.g., 'hero-2'), or 0 for non-matching.
 */
function parseSectionIdSuffix(sectionId: string, baseId: string): number {
  if (typeof sectionId !== 'string') {
    return 0
  }
  const normalized = sectionId.trim().toLowerCase()
  const pattern = new RegExp(`^${baseId}(?:-(\\d+))?$`)
  const match = normalized.match(pattern)
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
export function resolveHeroDefaultTag(sectionId: string): string {
  const suffix = parseSectionIdSuffix(sectionId, 'hero')
  if (suffix <= 1) {
    return '#hero'
  }
  return `#hero-${suffix}`
}

/**
 * Resolve the default image-with-text tag for a given instance ID.
 */
export function resolveImageWithTextDefaultTag(sectionId: string): string {
  const suffix = parseSectionIdSuffix(sectionId, 'image-with-text')
  if (suffix <= 1) {
    return '#image-text'
  }
  return `#image-text-${suffix}`
}

/**
 * Resolve the default ghost-cards tag for a given instance ID.
 */
export function resolveGhostCardsDefaultTag(sectionId: string): string {
  const suffix = parseSectionIdSuffix(sectionId, 'ghost-cards')
  if (suffix <= 1) {
    return '#cards'
  }
  return `#cards-${suffix}`
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
 * Resolves the default grid tags for a ghost-grid section instance.
 * Returns left and right internal tags based on the section ID.
 */
export function resolveGhostGridDefaultTags(instanceId: string): { left: string; right: string } {
  const baseId = 'ghost-grid'
  let suffix = ''
  if (instanceId !== baseId && instanceId.startsWith(`${baseId}-`)) {
    const raw = Number.parseInt(instanceId.slice(baseId.length + 1), 10)
    if (Number.isFinite(raw) && raw > 1) {
      suffix = `-${raw}`
    }
  }
  return {
    left: `#grid-left${suffix}`,
    right: `#grid-right${suffix}`
  }
}

/**
 * Resolves the internal tag and tag filter for a section based on its definition type.
 *
 * @param sectionId - The instance ID of the section (e.g., 'hero', 'hero-2', 'ghost-cards')
 * @param definitionId - The definition ID of the section (e.g., 'hero', 'ghostCards', 'image-with-text')
 * @param tags - Optional tags object containing user-configured tag values
 * @returns Object with internalTag and tagFilter, or null if definition is not supported
 */
export function resolveSectionTagFilter(
  sectionId: string,
  definitionId: string,
  tags?: { primary?: string; left?: string; right?: string }
): TagFilterResult | null {
  const rawTag = tags?.primary

  switch (definitionId) {
    case 'hero': {
      const internalTag = formatInternalTag(rawTag) || resolveHeroDefaultTag(sectionId)
      return {
        internalTag,
        tagFilter: toTagFilter(internalTag)
      }
    }

    case 'image-with-text': {
      const internalTag = formatInternalTag(rawTag) || resolveImageWithTextDefaultTag(sectionId)
      return {
        internalTag,
        tagFilter: toTagFilter(internalTag)
      }
    }

    case 'ghostCards': {
      const internalTag = formatInternalTag(rawTag) || resolveGhostCardsDefaultTag(sectionId)
      return {
        internalTag,
        tagFilter: toTagFilter(internalTag)
      }
    }

    default:
      return null
  }
}

/**
 * Resolves tag filters for grid sections with dual tags (left and right).
 *
 * @param sectionId - The instance ID of the grid section (e.g., 'ghost-grid', 'ghost-grid-2')
 * @param tags - Optional tags object containing left and right tag values
 * @returns Object with left and right tag filter results, plus combined anyTagFilter
 */
export function resolveGridTagFilters(
  sectionId: string,
  tags?: { left?: string; right?: string }
): GridTagFilterResult {
  const defaults = resolveGhostGridDefaultTags(sectionId)

  const internalTagLeft = formatInternalTag(tags?.left) || defaults.left
  const internalTagRight = formatInternalTag(tags?.right) || defaults.right

  const leftTagFilter = toTagFilter(internalTagLeft)
  const rightTagFilter = toTagFilter(internalTagRight)

  return {
    left: {
      internalTag: internalTagLeft,
      tagFilter: leftTagFilter
    },
    right: {
      internalTag: internalTagRight,
      tagFilter: rightTagFilter
    },
    anyTagFilter: `${leftTagFilter},${rightTagFilter}`
  }
}
