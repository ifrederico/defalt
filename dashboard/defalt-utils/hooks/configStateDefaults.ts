import { Ghost as GhostIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SidebarItem {
  id: string
  label: string
  icon?: LucideIcon
  definitionId?: string
  originalIndex?: number
}

export const HERO_ID_PREFIX = 'hero-defalt'
export const LEGACY_HERO_ID_PREFIX = 'header-defalt'

const TEMPLATE_DEFAULTS_BY_PAGE: Record<string, SidebarItem[]> = {
  home: [
    { id: 'subheader', label: 'Subheader', icon: GhostIcon },
    { id: 'featured', label: 'Featured', icon: GhostIcon },
    { id: 'main', label: 'Main', icon: GhostIcon }
  ],
  about: [{ id: 'main', label: 'Main', icon: GhostIcon }],
  post: [{ id: 'main', label: 'Main', icon: GhostIcon }],
  default: [{ id: 'main', label: 'Main', icon: GhostIcon }]
}

export const footerItemsDefault: SidebarItem[] = [
  { id: 'footerBar', label: 'Footer bar', icon: GhostIcon },
  { id: 'footerSignup', label: 'Footer signup', icon: GhostIcon }
]

export const footerDefaultsById = footerItemsDefault.reduce<Record<string, SidebarItem>>((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

export const getTemplateDefaults = (page: string): SidebarItem[] => {
  const defaults = TEMPLATE_DEFAULTS_BY_PAGE[page] ?? TEMPLATE_DEFAULTS_BY_PAGE.default
  return defaults.map((item) => ({ ...item }))
}

export const normalizeHeroSectionId = (value: string): string => {
  if (value.startsWith(LEGACY_HERO_ID_PREFIX)) {
    return value.replace(LEGACY_HERO_ID_PREFIX, HERO_ID_PREFIX)
  }
  return value
}
