/**
 * Section Derived Values
 *
 * Pure functions for deriving rendering values from section config.
 * Re-exports tag utilities from defalt-utils for convenience.
 *
 * NOTE: Uses relative imports because this file is in the Vite plugin dependency chain.
 * Path aliases like @defalt/* aren't resolved during config bundling.
 */

// Re-export tag utilities from defalt-utils (the source of truth)
export {
  toTagFilter,
  resolveHeroDefaultTag,
  resolveImageWithTextDefaultTag,
  resolveGhostCardsDefaultTag
} from '../../defalt-utils/helpers/tagFilterUtils.js'

export const resolveContainerPaddingX = (contentWidth: unknown): string =>
  contentWidth === 'none' ? '0px' : 'var(--container-gap, 24px)'

export const resolveImageColumns = (imageWidth: unknown): { imageColumn: string; textColumn: string } => {
  if (imageWidth === '2/3') return { imageColumn: '2fr', textColumn: '1fr' }
  if (imageWidth === '3/4') return { imageColumn: '3fr', textColumn: '1fr' }
  return { imageColumn: '1fr', textColumn: '1fr' }
}

export const resolveImageAspectRatio = (imageAspect: unknown): string => {
  if (imageAspect === 'square') return '1 / 1'
  if (imageAspect === 'portrait') return '3 / 4'
  if (imageAspect === 'wide') return '16 / 9'
  if (imageAspect === 'tall') return '9 / 16'
  if (imageAspect === 'landscape') return '4 / 3'
  return ''
}
