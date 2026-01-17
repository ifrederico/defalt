// =============================================================================
// Announcement Bar Utilities
// =============================================================================

import { clampValue } from '../helpers/numericHelpers.js'
import { sanitizeHexColor } from '../security/sanitizers.js'
import type {
  AnnouncementBarConfig,
  AnnouncementContentConfig,
  AnnouncementBlock,
  AnnouncementBarTypographySize,
  AnnouncementBarTypographyWeight,
  AnnouncementBarTypographySpacing,
  AnnouncementBarTypographyCase
} from './themeConfig.types.js'

// =============================================================================
// Typography Parsers
// =============================================================================

const parseSize = (input: unknown): AnnouncementBarTypographySize | null => {
  if (input === 'small' || input === 'normal' || input === 'large' || input === 'x-large') {
    return input
  }
  return null
}

const parseWeight = (input: unknown): AnnouncementBarTypographyWeight | null => {
  if (input === 'light' || input === 'default' || input === 'bold') {
    return input
  }
  return null
}

const parseSpacing = (input: unknown): AnnouncementBarTypographySpacing | null => {
  if (input === 'tight' || input === 'regular' || input === 'wide') {
    return input
  }
  return null
}

const parseCase = (input: unknown): AnnouncementBarTypographyCase | null => {
  if (input === 'uppercase' || input === 'default') {
    return input
  }
  return null
}

// =============================================================================
// Normalization Functions
// =============================================================================

export const normalizeAnnouncementBarConfig = (
  value: unknown,
  defaultConfig: AnnouncementBarConfig
): AnnouncementBarConfig => {
  if (!value || typeof value !== 'object') {
    return { ...defaultConfig }
  }
  const raw = value as Record<string, unknown>
  const width = raw.width === 'narrow' ? 'narrow' : 'default'

  const dividerThickness = clampValue(typeof raw.dividerThickness === 'number' ? raw.dividerThickness : 0, 0, 5)
  const paddingTop = clampValue(typeof raw.paddingTop === 'number' ? raw.paddingTop : defaultConfig.paddingTop, 0, 100)
  const paddingBottom = clampValue(typeof raw.paddingBottom === 'number' ? raw.paddingBottom : defaultConfig.paddingBottom, 0, 100)

  return {
    width,
    backgroundColor: sanitizeHexColor(typeof raw.backgroundColor === 'string' ? raw.backgroundColor : null, defaultConfig.backgroundColor),
    textColor: sanitizeHexColor(typeof raw.textColor === 'string' ? raw.textColor : null, defaultConfig.textColor),
    dividerThickness,
    dividerColor: sanitizeHexColor(typeof raw.dividerColor === 'string' ? raw.dividerColor : null, defaultConfig.dividerColor),
    paddingTop,
    paddingBottom
  }
}

export const normalizeAnnouncementContentConfig = (
  value: unknown,
  defaultConfig: AnnouncementContentConfig
): AnnouncementContentConfig => {
  if (!value || typeof value !== 'object') {
    return { ...defaultConfig }
  }
  const raw = value as Record<string, unknown>

  // Parse announcements array
  const parseAnnouncements = (input: unknown): AnnouncementBlock[] => {
    if (!Array.isArray(input)) return defaultConfig.announcements
    return input.map((item): AnnouncementBlock => {
      if (!item || typeof item !== 'object') {
        return { tag: '#announcement', text: '', typographySize: 'normal', typographyWeight: 'default', typographySpacing: 'regular', typographyCase: 'default' }
      }
      const obj = item as Record<string, unknown>
      return {
        tag: typeof obj.tag === 'string' ? obj.tag : '#announcement',
        text: typeof obj.text === 'string' ? obj.text : '',
        // Typography settings with defaults
        typographySize: parseSize(obj.typographySize) ?? 'normal',
        typographyWeight: parseWeight(obj.typographyWeight) ?? 'default',
        typographySpacing: parseSpacing(obj.typographySpacing) ?? 'regular',
        typographyCase: parseCase(obj.typographyCase) ?? 'default'
      }
    })
  }

  return {
    announcements: parseAnnouncements(raw.announcements)
  }
}
