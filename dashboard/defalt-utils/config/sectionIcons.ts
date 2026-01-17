/**
 * Centralized section icon configuration.
 * Single source of truth for all section-to-icon mappings.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Ghost as GhostIcon,
  GalleryVertical,
  Grid3x3,
  LayoutList
} from 'lucide-react'

/**
 * Map of section IDs to their corresponding Lucide icons.
 * Used across the app for consistent icon display.
 */
export const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  'hero': GalleryVertical,
  'image-with-text': LayoutList,
  'ghostCards': GhostIcon,
  'ghostGrid': Grid3x3,
}

/**
 * Set of section IDs that are built-in Ghost Source theme sections.
 * These always get the GhostIcon.
 */
const GHOST_SECTION_IDS = new Set([
  'subheader',
  'featured',
  'footerbar',
  'footer-signup',
  'footersignup',
  'main'
])

/**
 * Resolves the appropriate icon for a section.
 *
 * Resolution order:
 * 1. If identifier is a Ghost built-in section → GhostIcon
 * 2. If identifier is in SECTION_ICON_MAP → mapped icon
 * 3. Default → provided icon or GhostIcon
 *
 * @param identifier - The section ID or definition ID
 * @param defaultIcon - Optional icon (defaults to GhostIcon)
 * @returns The resolved LucideIcon
 */
export function resolveSectionIcon(
  identifier: string | undefined | null,
  defaultIcon: LucideIcon = GhostIcon
): LucideIcon {
  if (!identifier) {
    return defaultIcon
  }

  const normalized = identifier.toLowerCase()

  // Check if it's a Ghost built-in section
  if (GHOST_SECTION_IDS.has(normalized)) {
    return GhostIcon
  }

  // Check the icon map (use original identifier for exact match)
  if (SECTION_ICON_MAP[identifier]) {
    return SECTION_ICON_MAP[identifier]
  }

  // Also check normalized version for case-insensitive match
  if (SECTION_ICON_MAP[normalized]) {
    return SECTION_ICON_MAP[normalized]
  }

  return defaultIcon
}

// Re-export GhostIcon for convenience
export { GhostIcon }
