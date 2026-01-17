import {
  formatInternalTag,
  parseGhostCardIdSuffix,
  resolveHeroDefaultTag,
  resolveImageWithTextDefaultTag
} from '../helpers/tagFilterUtils.js'
import { isPlainRecord } from '../helpers/typeGuards.js'
import type { LucideIcon } from 'lucide-react'
import type { SectionInstance } from '@defalt/sections/engine'
import type { AnnouncementBarInstance } from './themeConfig'

export type SectionKind = 'template' | 'custom' | 'footer' | 'announcement'

export interface SidebarItem {
  id: string
  label: string
  icon?: LucideIcon
  definitionId?: string
  originalIndex?: number
}

export type SectionLabelContext = {
  headerStyleValue?: string
}

type CustomSectionRegistryEntry = {
  definitionId: string
  baseId: string
  label: string
  maxInstances: number
  tagKeys: string[]
  resolveDefaultTags: (instanceId: string) => Record<string, string>
  normalizeTagValue: (key: string, value: unknown) => string
}

type TagSource = {
  tag: string
  sectionId: string
  field: string
  label: string
}

export type TagCollision = {
  tag: string
  sources: TagSource[]
}

export type TagState = {
  customSections: Record<string, SectionInstance>
  announcementBars: AnnouncementBarInstance[]
}

const MAX_CUSTOM_INSTANCES = 5

const TEMPLATE_DEFAULT_ORDER_BY_PAGE: Record<string, string[]> = {
  home: ['subheader', 'featured', 'main'],
  homepage: ['subheader', 'featured', 'main'],
  about: ['main'],
  post: ['main'],
  page: ['main'],
  default: ['main']
}

const FOOTER_DEFAULT_ORDER = ['footerBar', 'footerSignup']

const TEMPLATE_SECTION_LABELS: Record<string, string> = {
  header: 'Header',
  subheader: 'Subheader',
  featured: 'Featured',
  main: 'Main',
}

const FOOTER_SECTION_LABELS: Record<string, string> = {
  footerBar: 'Footer bar',
  footerSignup: 'Footer signup'
}

const resolveCustomSectionIndex = (baseId: string, instanceId: string): number => {
  if (instanceId === baseId) {
    return 1
  }
  const prefix = `${baseId}-`
  if (!instanceId.startsWith(prefix)) {
    return 0
  }
  const raw = instanceId.slice(prefix.length)
  const numeric = Number.parseInt(raw, 10)
  return Number.isFinite(numeric) ? numeric : 0
}

const resolveGhostCardsTagFromId = (instanceId: string): string => {
  const suffix = parseGhostCardIdSuffix(instanceId)
  if (suffix <= 1) {
    return '#cards'
  }
  return `#cards-${suffix}`
}

const resolveGhostGridTagsFromId = (instanceId: string): Record<string, string> => {
  const baseId = 'ghost-grid'
  const suffix = resolveCustomSectionIndex(baseId, instanceId)
  const suffixLabel = suffix > 1 ? `-${suffix}` : ''
  return {
    left: `#grid-left${suffixLabel}`,
    right: `#grid-right${suffixLabel}`
  }
}

const CUSTOM_SECTION_REGISTRY: Record<string, CustomSectionRegistryEntry> = {
  hero: {
    definitionId: 'hero',
    baseId: 'hero',
    label: 'Hero',
    maxInstances: MAX_CUSTOM_INSTANCES,
    tagKeys: ['primary'],
    resolveDefaultTags: (instanceId) => ({ primary: resolveHeroDefaultTag(instanceId) }),
    normalizeTagValue: (_field, value) => formatInternalTag(value)
  },
  'image-with-text': {
    definitionId: 'image-with-text',
    baseId: 'image-with-text',
    label: 'Image with text',
    maxInstances: MAX_CUSTOM_INSTANCES,
    tagKeys: ['primary'],
    resolveDefaultTags: (instanceId) => ({ primary: resolveImageWithTextDefaultTag(instanceId) }),
    normalizeTagValue: (_field, value) => formatInternalTag(value)
  },
  ghostCards: {
    definitionId: 'ghostCards',
    baseId: 'ghost-cards',
    label: 'Ghost cards',
    maxInstances: MAX_CUSTOM_INSTANCES,
    tagKeys: ['primary'],
    resolveDefaultTags: (instanceId) => ({ primary: resolveGhostCardsTagFromId(instanceId) }),
    normalizeTagValue: (_field, value) => formatInternalTag(value)
  },
  ghostGrid: {
    definitionId: 'ghostGrid',
    baseId: 'ghost-grid',
    label: 'Ghost grid',
    maxInstances: MAX_CUSTOM_INSTANCES,
    tagKeys: ['left', 'right'],
    resolveDefaultTags: (instanceId) => resolveGhostGridTagsFromId(instanceId),
    normalizeTagValue: (_field, value) => formatInternalTag(value)
  }
}

const CUSTOM_BASE_IDS = Object.values(CUSTOM_SECTION_REGISTRY)
  .map((entry) => entry.baseId)
  .sort((a, b) => b.length - a.length)

const CUSTOM_BASE_ID_TO_DEFINITION = Object.values(CUSTOM_SECTION_REGISTRY).reduce<Record<string, string>>(
  (acc, entry) => {
    acc[entry.baseId] = entry.definitionId
    return acc
  },
  {}
)

export const normalizeSectionId = (sectionId: string): string => sectionId

export const getCustomSectionEntry = (definitionId: string): CustomSectionRegistryEntry | null =>
  CUSTOM_SECTION_REGISTRY[definitionId] ?? null

export const getCustomSectionBaseId = (definitionId: string): string | null =>
  CUSTOM_SECTION_REGISTRY[definitionId]?.baseId ?? null

export const getCustomSectionMaxInstances = (definitionId: string): number | null =>
  CUSTOM_SECTION_REGISTRY[definitionId]?.maxInstances ?? null

export const getCustomSectionDefinitionIdFromInstance = (instanceId: string): string | null => {
  for (const baseId of CUSTOM_BASE_IDS) {
    if (instanceId === baseId) {
      return CUSTOM_BASE_ID_TO_DEFINITION[baseId] ?? null
    }
    if (instanceId.startsWith(`${baseId}-`)) {
      const suffix = instanceId.slice(baseId.length + 1)
      const numeric = Number.parseInt(suffix, 10)
      if (Number.isFinite(numeric)) {
        return CUSTOM_BASE_ID_TO_DEFINITION[baseId] ?? null
      }
    }
  }
  return null
}

export const buildCustomSectionInstanceId = (definitionId: string, existingIds: Set<string>): string => {
  const baseId = getCustomSectionBaseId(definitionId) ?? definitionId
  let attempt = baseId
  let suffix = 2
  while (existingIds.has(attempt)) {
    attempt = `${baseId}-${suffix}`
    suffix += 1
  }
  return attempt
}

export const resolveCustomSectionLabel = (instanceId: string, definitionId?: string): string => {
  const resolvedDefinition = definitionId ?? getCustomSectionDefinitionIdFromInstance(instanceId) ?? instanceId
  const entry = CUSTOM_SECTION_REGISTRY[resolvedDefinition]
  if (!entry) {
    return instanceId
  }
  const index = resolveCustomSectionIndex(entry.baseId, instanceId)
  if (index > 1) {
    return `${entry.label} ${index}`
  }
  return entry.label
}

export const resolveAnnouncementBarLabel = (instanceId: string): string => {
  const baseId = 'announcement-bar'
  const index = resolveCustomSectionIndex(baseId, instanceId)
  if (index > 1) {
    return `Announcement bar ${index}`
  }
  return 'Announcement bar'
}

export const resolveAnnouncementBlockTag = (barId: string, blockIndex: number): string => {
  const barIndex = resolveCustomSectionIndex('announcement-bar', barId) || 1
  if (barIndex === 1 && blockIndex === 0) {
    return '#announcement'
  }
  if (barIndex === 1) {
    return `#announcement-${blockIndex + 1}`
  }
  return `#announcement-${barIndex}-${blockIndex + 1}`
}

export const resolveSectionLabel = (sectionId: string, context?: SectionLabelContext): string => {
  const normalized = normalizeSectionId(sectionId)
  if (normalized === 'announcement-bar' || normalized.startsWith('announcement-bar-')) {
    return resolveAnnouncementBarLabel(normalized)
  }
  if (FOOTER_SECTION_LABELS[normalized]) {
    return FOOTER_SECTION_LABELS[normalized]
  }
  if (TEMPLATE_SECTION_LABELS[normalized]) {
    if (normalized === 'subheader' && context?.headerStyleValue) {
      return context.headerStyleValue
    }
    return TEMPLATE_SECTION_LABELS[normalized]
  }
  const definitionId = getCustomSectionDefinitionIdFromInstance(normalized)
  if (definitionId) {
    return resolveCustomSectionLabel(normalized, definitionId)
  }
  return normalized
}

export const isFixedSection = (sectionId: string): boolean => {
  const normalized = normalizeSectionId(sectionId)
  if (normalized === 'announcement-bar' || normalized.startsWith('announcement-bar-')) {
    return true
  }
  if (normalized === 'header' || normalized === 'footer') {
    return true
  }
  if (normalized === 'page' || normalized === 'post') {
    return true
  }
  if (TEMPLATE_SECTION_LABELS[normalized]) {
    return true
  }
  if (FOOTER_SECTION_LABELS[normalized]) {
    return true
  }
  return false
}

export const getTemplateOrder = (page: string): string[] => {
  const order = TEMPLATE_DEFAULT_ORDER_BY_PAGE[page] ?? TEMPLATE_DEFAULT_ORDER_BY_PAGE.default
  return [...order]
}

export const getFooterOrder = (): string[] => [...FOOTER_DEFAULT_ORDER]

const buildSidebarItem = (id: string): SidebarItem => ({
  id,
  label: resolveSectionLabel(id)
})

export const getTemplateDefaults = (page: string): SidebarItem[] =>
  getTemplateOrder(page).map(buildSidebarItem)

export const footerItemsDefault: SidebarItem[] = getFooterOrder().map(buildSidebarItem)

export const footerDefaultsById = footerItemsDefault.reduce<Record<string, SidebarItem>>((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

export const applyDefaultTagsForSection = (
  definitionId: string,
  instanceId: string,
  customConfig: unknown
): Record<string, unknown> | undefined => {
  const entry = getCustomSectionEntry(definitionId)
  if (!entry) {
    return customConfig && typeof customConfig === 'object'
      ? { ...(customConfig as Record<string, unknown>) }
      : undefined
  }
  const next = customConfig && typeof customConfig === 'object'
    ? { ...(customConfig as Record<string, unknown>) }
    : {}
  const defaults = entry.resolveDefaultTags(instanceId)
  const baseDefaults = entry.resolveDefaultTags(entry.baseId)
  const nextTags = isPlainRecord(next.tags) ? { ...(next.tags as Record<string, unknown>) } : {}

  delete (next as Record<string, unknown>).tag
  delete (next as Record<string, unknown>).tagLeft
  delete (next as Record<string, unknown>).tagRight

  entry.tagKeys.forEach((key) => {
    const rawValue = nextTags[key]
    const normalized = entry.normalizeTagValue(key, rawValue)
    const defaultTag = defaults[key]
    const baseDefault = baseDefaults[key]

    if (normalized) {
      if (baseDefault && defaultTag && normalized === baseDefault && defaultTag !== baseDefault) {
        nextTags[key] = defaultTag
      } else {
        nextTags[key] = normalized
      }
      return
    }

    if (defaultTag) {
      nextTags[key] = defaultTag
    } else {
      delete nextTags[key]
    }
  })

  if (Object.keys(nextTags).length > 0) {
    next.tags = nextTags
  } else {
    delete (next as Record<string, unknown>).tags
  }

  return next
}

export const collectTagSources = (
  customSections: Record<string, SectionInstance>,
  announcementBars: AnnouncementBarInstance[]
): TagSource[] => {
  const sources: TagSource[] = []

  Object.entries(customSections).forEach(([sectionId, section]) => {
    const entry = getCustomSectionEntry(section.definitionId)
    if (!entry) {
      return
    }
    const label = resolveCustomSectionLabel(sectionId, entry.definitionId)
    const config = section.config as Record<string, unknown>
    const tags = isPlainRecord(config.tags) ? config.tags as Record<string, unknown> : {}
    entry.tagKeys.forEach((key) => {
      const normalized = entry.normalizeTagValue(key, tags[key])
      if (normalized) {
        sources.push({ tag: normalized, sectionId, field: `tags.${key}`, label })
      }
    })
  })

  announcementBars.forEach((bar) => {
    const label = resolveAnnouncementBarLabel(bar.id)
    const announcements = bar.content?.announcements ?? []
    announcements.forEach((block, index) => {
      const normalized = formatInternalTag(block.tag)
      if (normalized) {
        sources.push({
          tag: normalized,
          sectionId: bar.id,
          field: `announcement-${index}`,
          label
        })
      }
    })
  })

  return sources
}

export const findTagCollision = (sources: TagSource[]): TagCollision | null => {
  const map = new Map<string, TagSource[]>()
  sources.forEach((source) => {
    const list = map.get(source.tag) ?? []
    list.push(source)
    map.set(source.tag, list)
  })
  for (const [tag, list] of map) {
    if (list.length > 1) {
      return { tag, sources: list }
    }
  }
  return null
}
