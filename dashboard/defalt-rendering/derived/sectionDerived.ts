import {
  parseGhostCardIdSuffix,
  toApiTagSlug,
  resolveHeroTagFromId,
  resolveImageWithTextTagFromId
} from '../../defalt-sections/utils/tagUtils.js'

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

export const toTagFilter = (internalTag: string): string => `tag:${toApiTagSlug(internalTag)}`

export const resolveHeroDefaultTag = (sectionId: string): string =>
  resolveHeroTagFromId(sectionId)

export const resolveImageWithTextDefaultTag = (sectionId: string): string =>
  resolveImageWithTextTagFromId(sectionId)

export const resolveGhostCardsDefaultTag = (sectionId: string): string => {
  const suffix = parseGhostCardIdSuffix(sectionId)
  if (suffix <= 1) return '#cards'
  return `#cards-${suffix}`
}
