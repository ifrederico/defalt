import { DEFAULT_CUSTOM_SECTION_PADDING, type SectionPadding, type SectionSettings } from '../config/themeConfig.js'

/**
 * Normalizes a padding value to a non-negative integer.
 * Returns the fallback value if the input is not a finite number.
 *
 * @param value - The value to normalize (typically from user input or config)
 * @param fallback - The default value to use if input is invalid
 * @returns A non-negative integer
 */
export const normalizePaddingValue = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return Math.max(0, Math.round(fallback))
}

/**
 * Required padding structure with all fields guaranteed to be present.
 */
export type RequiredSectionPadding = Required<SectionPadding>

/**
 * Resolves section padding by merging provided values with defaults.
 * Ensures all padding values are normalized non-negative integers.
 *
 * @param padding - Optional padding configuration to resolve
 * @param defaults - Default values to use for missing or invalid values
 * @returns A complete padding object with all fields guaranteed
 */
export const resolveSectionPadding = (
  padding?: SectionPadding,
  defaults: SectionPadding = DEFAULT_CUSTOM_SECTION_PADDING
): RequiredSectionPadding => {
  const base = padding ?? defaults
  return {
    top: normalizePaddingValue(base.top, defaults.top),
    bottom: normalizePaddingValue(base.bottom, defaults.bottom),
    left: normalizePaddingValue(base.left ?? 0, defaults.left ?? 0),
    right: normalizePaddingValue(base.right ?? 0, defaults.right ?? 0)
  }
}

/**
 * Extracts and resolves padding from section settings.
 * Handles both explicit `padding` object and legacy `paddingBlock` number.
 * For paddingBlock, applies the value to both top and bottom.
 *
 * @param settings - Section settings that may contain padding or paddingBlock
 * @param defaults - Default values to use for missing or invalid values
 * @returns A complete padding object with all fields guaranteed
 */
export const extractSectionPadding = (
  settings: SectionSettings | undefined,
  defaults: SectionPadding = DEFAULT_CUSTOM_SECTION_PADDING
): RequiredSectionPadding => {
  if (!settings) {
    return resolveSectionPadding(undefined, defaults)
  }

  // Check for explicit padding object
  const rawPadding = settings.padding as { top?: unknown; bottom?: unknown; left?: unknown; right?: unknown } | undefined
  if (rawPadding && typeof rawPadding === 'object') {
    return {
      top: normalizePaddingValue(rawPadding.top, defaults.top),
      bottom: normalizePaddingValue(rawPadding.bottom, defaults.bottom),
      left: normalizePaddingValue(rawPadding.left, defaults.left ?? 0),
      right: normalizePaddingValue(rawPadding.right, defaults.right ?? 0)
    }
  }

  // Check for legacy paddingBlock (applies to both top and bottom)
  const paddingBlock = settings.paddingBlock
  if (typeof paddingBlock === 'number') {
    const unified = normalizePaddingValue(paddingBlock, defaults.top)
    return {
      top: unified,
      bottom: unified,
      left: defaults.left ?? 0,
      right: defaults.right ?? 0
    }
  }

  return resolveSectionPadding(undefined, defaults)
}

/**
 * Builds an inline CSS style string from padding values.
 * Only includes padding properties with positive values.
 *
 * @param padding - The padding configuration to convert to CSS
 * @returns A semicolon-separated CSS style string
 */
export const buildSectionStyle = (padding: SectionPadding): string => {
  const styles: string[] = []
  if (padding.top > 0) {
    styles.push(`padding-top: ${padding.top}px`)
  }
  if (padding.bottom > 0) {
    styles.push(`padding-bottom: ${padding.bottom}px`)
  }
  if ((padding.left ?? 0) > 0) {
    styles.push(`padding-left: ${padding.left}px`)
  }
  if ((padding.right ?? 0) > 0) {
    styles.push(`padding-right: ${padding.right}px`)
  }
  return styles.join('; ')
}
