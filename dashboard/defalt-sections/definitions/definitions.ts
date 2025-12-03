import type { GhostCardsSectionConfig } from './ghostCards.js'
import { ghostCardsDefinition } from './ghostCards.js'
import { ghostGridDefinition } from './ghostGrid.js'
import type { HeroSectionConfig } from './hero.js'
import { heroDefinition } from './hero.js'
import type { ImageWithTextSectionConfig } from './imageWithText.js'
import { imageWithTextDefinition } from './imageWithText.js'
import type { SectionCategory, SectionConfigSchema, SectionDefinition, SectionInstance } from './sectionTypes.js'
import { isPremium, isFree, getPremiumFeatures, getFreeFeatures } from '../premiumConfig.js'

export type {
  SectionCategory,
  SectionConfigSchema,
  SectionDefinition,
  SectionInstance,
  SectionSettingSchema
} from './sectionTypes.js'
export type { HeroSectionConfig } from './hero.js'
export type { GhostCardsSectionConfig, GhostCardsCardConfig } from './ghostCards.js'
export type { GhostGridSectionConfig } from './ghostGrid.js'
export type { ImageWithTextSectionConfig } from './imageWithText.js'

// Premium utilities
export { isPremium, isFree, getPremiumFeatures, getFreeFeatures }

// Note: Grid, Testimonials, FAQ, About sections coming soon
const sectionDefinitions: Array<SectionDefinition<SectionConfigSchema>> = [
  heroDefinition as unknown as SectionDefinition<SectionConfigSchema>,
  ghostCardsDefinition as unknown as SectionDefinition<SectionConfigSchema>,
  ghostGridDefinition as unknown as SectionDefinition<SectionConfigSchema>,
  imageWithTextDefinition as unknown as SectionDefinition<SectionConfigSchema>
]

// Apply premium status from single source of truth
sectionDefinitions.forEach((definition) => {
  definition.premium = isPremium(definition.id)
})

export const sectionDefinitionMap = new Map(sectionDefinitions.map((definition) => [definition.id, definition]))

export function getSectionDefinition(definitionId: string) {
  return sectionDefinitionMap.get(definitionId)
}

export function buildSectionInstance(
  definitionId: string,
  instanceId: string,
  customConfig?: SectionConfigSchema
): SectionInstance | null {
  const definition = sectionDefinitionMap.get(definitionId)
  if (!definition) {
    return null
  }

  const baseConfig = definition.createConfig()
  const mergedConfig =
    typeof customConfig === 'object' && customConfig !== null ? { ...baseConfig, ...customConfig } : baseConfig

  let finalConfig = mergedConfig

  if (definition.id === 'hero') {
    const heroConfig = mergedConfig as HeroSectionConfig
    const normalizedTag =
      heroConfig.ghostPageTag && heroConfig.ghostPageTag !== 'hero-preview' ? heroConfig.ghostPageTag : instanceId

    if (normalizedTag !== heroConfig.ghostPageTag) {
      finalConfig = {
        ...heroConfig,
        ghostPageTag: normalizedTag
      }
    }
  } else if (definition.id === 'ghostCards') {
    const ghostCardsConfig = mergedConfig as GhostCardsSectionConfig
    const suffixMatch = instanceId.match(/(\d+)$/)
    const tagBase = '#ghost-card'
    const defaultTag = suffixMatch ? `${tagBase}-${suffixMatch[1]}` : tagBase
    const rawTag = typeof ghostCardsConfig.ghostPageTag === 'string' ? ghostCardsConfig.ghostPageTag.trim() : ''

    const normalizeGhostCardTag = (value: string) => {
      const strippedTag = value.trim().replace(/^#+/, '')
      if (!strippedTag) {
        return ''
      }
      const ghostMatch = strippedTag.toLowerCase().match(/^ghost-cards?-?(\d+)?$/)
      if (ghostMatch) {
        const suffix = ghostMatch[1]
        return suffix ? `${tagBase}-${suffix}` : tagBase
      }
      return `#${strippedTag}`
    }

    const baseNormalized = normalizeGhostCardTag(rawTag)
    const normalizedTag = (!baseNormalized || (suffixMatch && baseNormalized === tagBase))
      ? defaultTag
      : baseNormalized

    if (normalizedTag !== ghostCardsConfig.ghostPageTag) {
      finalConfig = {
        ...ghostCardsConfig,
        ghostPageTag: normalizedTag
      }
    }
  } else if (definition.id === 'image-with-text') {
    const imageWithTextConfig = mergedConfig as ImageWithTextSectionConfig
    const suffixMatch = instanceId.match(/(\d+)$/)
    const tagBase = '#image-with-text'
    const defaultTag = suffixMatch ? `${tagBase}-${suffixMatch[1]}` : tagBase
    const rawTag = typeof imageWithTextConfig.ghostPageTag === 'string' ? imageWithTextConfig.ghostPageTag.trim() : ''
    const strippedTag = rawTag.replace(/^#+/, '')
    const baseNormalized = strippedTag.length > 0 ? `#${strippedTag}` : ''
    const normalizedTag = (!baseNormalized || (baseNormalized === tagBase && suffixMatch))
      ? defaultTag
      : baseNormalized

    if (normalizedTag !== imageWithTextConfig.ghostPageTag) {
      finalConfig = {
        ...imageWithTextConfig,
        ghostPageTag: normalizedTag
      }
    }
  }

  return {
    id: instanceId,
    definitionId,
    label: definition.label,
    category: definition.category,
    config: finalConfig
  }
}

export function listDefinitionsByCategory(category: SectionCategory): SectionDefinition<SectionConfigSchema>[] {
  return sectionDefinitions.filter((definition) => definition.category === category)
}
