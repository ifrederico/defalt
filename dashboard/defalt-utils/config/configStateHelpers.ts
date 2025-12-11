import { logError } from '../logging/errorLogger.js'
import { getSectionDefinition, type SectionConfigSchema, type HeroSectionConfig } from '@defalt/sections/engine'
import { normalizeHeroSectionId } from './configStateDefaults'
import { sanitizeHexColor } from '@defalt/utils/security/sanitizers'

/**
 * Attempts to migrate legacy hero configurations (pre Defalt hero sections)
 * into the latest hero config schema so custom hero content is preserved.
 *
 * @param sectionId - Section instance identifier.
 * @param customConfig - Raw section config stored in user data.
 * @returns Updated hero configuration or null if migration is not possible.
 */
export function migrateLegacyHeroConfig(sectionId: string, customConfig: SectionConfigSchema | undefined): HeroSectionConfig | null {
  if (!customConfig || typeof customConfig !== 'object') {
    return null
  }

  const normalizedId = normalizeHeroSectionId(sectionId)
  if (!normalizedId.startsWith('hero-defalt')) {
    return null
  }

  const definition = getSectionDefinition('hero')
  if (!definition) {
    return null
  }

  const defaultsRaw = definition.createConfig()
  if (!defaultsRaw || typeof defaultsRaw !== 'object') {
    logError(new Error('Failed to create default hero config'), { scope: 'useConfigState.migrateLegacyHeroConfig.defaults' })
    return null
  }

  const defaults = defaultsRaw as HeroSectionConfig
  const legacy = customConfig as Record<string, unknown>
  const hasHeroMarkers =
    'placeholder' in legacy ||
    'ghostPageTag' in legacy ||
    'title' in legacy ||
    'description' in legacy ||
    'primaryCtaText' in legacy ||
    'primaryCtaHref' in legacy

  if (!hasHeroMarkers) {
    return null
  }

  const placeholderSource = typeof legacy.placeholder === 'object' && legacy.placeholder !== null
    ? legacy.placeholder as Record<string, unknown>
    : {}

  const resolveString = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
    return fallback
  }

  const resolveOptionalString = (value: unknown, fallback?: string): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
    return fallback
  }

  const resolveNumber = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    return fallback
  }

  const placeholder = {
    title: resolveString(placeholderSource.title ?? legacy.title, defaults.placeholder.title),
    description: resolveString(placeholderSource.description ?? legacy.description, defaults.placeholder.description),
    imageUrl: resolveOptionalString(
      placeholderSource.imageUrl ?? placeholderSource.image ?? (legacy as { image?: string }).image,
      defaults.placeholder.imageUrl
    ),
    buttonText: resolveOptionalString(
      placeholderSource.buttonText ?? legacy.primaryCtaText,
      defaults.placeholder.buttonText
    ),
    buttonHref: sanitizeCtaHref(
      placeholderSource.buttonHref ?? legacy.primaryCtaHref,
      defaults.placeholder.buttonHref && defaults.placeholder.buttonHref.trim().length > 0
        ? defaults.placeholder.buttonHref
        : 'https://example.com'
    )
  }

  const backgroundColor = sanitizeHexColor(
    resolveString(
      (legacy as { backgroundColor?: string, background?: string }).backgroundColor ?? (legacy as { background?: string }).background,
      defaults.backgroundColor ?? '#000000'
    ),
    defaults.backgroundColor ?? '#000000'
  )

  const buttonTextColor = sanitizeHexColor(
    resolveString(
      (legacy as { buttonTextColor?: string, textColor?: string }).buttonTextColor ?? (legacy as { textColor?: string }).textColor,
      defaults.buttonTextColor ?? '#151515'
    ),
    defaults.buttonTextColor ?? '#151515'
  )

  const cardBorderRadius = resolveNumber(
    (legacy as { cardBorderRadius?: number }).cardBorderRadius ?? (legacy as { padding?: number }).padding ?? (defaults.cardBorderRadius ?? defaults.buttonBorderRadius ?? 3),
    defaults.cardBorderRadius ?? defaults.buttonBorderRadius ?? 3
  )

  const imagePositionRaw = (legacy as { imagePosition?: string }).imagePosition
  const contentAlignmentRaw = (legacy as { contentAlignment?: string }).contentAlignment

  const imagePosition: HeroSectionConfig['imagePosition'] =
    imagePositionRaw === 'left' || imagePositionRaw === 'right' || imagePositionRaw === 'background'
      ? imagePositionRaw
      : defaults.imagePosition

  const contentAlignment: HeroSectionConfig['contentAlignment'] =
    contentAlignmentRaw === 'left' || contentAlignmentRaw === 'center' || contentAlignmentRaw === 'right'
      ? contentAlignmentRaw
      : defaults.contentAlignment

  return {
    ...defaults,
    ghostPageTag: normalizedId,
    backgroundColor,
    buttonTextColor,
    cardBorderRadius,
    buttonColor: sanitizeHexColor(
      resolveString((legacy as { buttonColor?: string }).buttonColor, defaults.buttonColor ?? '#ffffff'),
      defaults.buttonColor ?? '#ffffff'
    ),
    showButton: (legacy as { showButton?: boolean }).showButton ?? defaults.showButton,
    placeholder,
    imagePosition,
    contentAlignment
  }
}

const sanitizeCtaHref = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback
  }
  const trimmed = value.trim()
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed
  }
  return fallback
}
