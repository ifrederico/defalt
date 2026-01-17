/**
 * Workspace Hydrate - Pure functions for extracting state from EditorState
 *
 * These functions convert stored EditorState into workspace state structures.
 * They are pure functions with no React dependencies.
 */

import {
  CONFIG_TO_ID_MAP,
  CSS_DEFAULT_PADDING,
  DEFAULT_CUSTOM_SECTION_PADDING,
  CSS_DEFAULT_MARGIN,
  PADDING_BLOCK_SECTIONS,
  extractHeaderSettings,
  extractMainSettings,
  loadPersistedThemeDocument,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MAIN_SETTINGS,
  type EditorState,
  type PageConfig,
  type SectionConfig,
  type FooterConfig,
  type SectionSettings,
  type SectionPadding,
  type WorkspaceSnapshot,
  type AnnouncementBarInstance
} from '@defalt/utils/config/themeConfig'
import {
  buildSectionInstance,
  getSectionDefinition,
  type SectionInstance
} from '@defalt/sections/engine'
import {
  applyDefaultTagsForSection,
  normalizeSectionId,
  resolveCustomSectionLabel,
  footerDefaultsById,
  footerItemsDefault,
  type SidebarItem
} from '@defalt/utils/config/sectionRegistry'
import type { LucideIcon } from 'lucide-react'
import { resolvePaddingValue, normalizeMarginValue as resolveMarginValue } from './derive.js'

// =============================================================================
// Types
// =============================================================================

export interface HydrationInput {
  state: EditorState
  currentPage: 'home' | 'about' | 'post' | 'page'
  templateDefaults: SidebarItem[]
  templateDefaultsById: Record<string, SidebarItem>
  definitionIconMap: Record<string, LucideIcon>
  defaultIcon: LucideIcon
}

export interface HydrationResult {
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
  sectionVisibility: Record<string, boolean>
  sectionPadding: Record<string, { top: number; bottom: number; left?: number; right?: number }>
  sectionMargins: Record<string, { top?: number; bottom?: number }>
  customSections: Record<string, SectionInstance>
  announcementBars: AnnouncementBarInstance[]
  snapshot: WorkspaceSnapshot
  invalidCustomSections: string[]
}

interface PaddingDefaults {
  top: number
  bottom: number
  left: number
  right: number
}

// =============================================================================
// Helper Functions
// =============================================================================

const normalizeSectionCustomConfig = (
  definitionId: string | undefined,
  instanceId: string,
  customConfig: unknown
): Record<string, unknown> | undefined => {
  if (!definitionId) {
    return customConfig && typeof customConfig === 'object'
      ? { ...(customConfig as Record<string, unknown>) }
      : undefined
  }
  return applyDefaultTagsForSection(definitionId, instanceId, customConfig)
}

const getDefaultPadding = (key: string, definitionId?: string): PaddingDefaults => {
  const cssDefault = CSS_DEFAULT_PADDING[key]
  if (typeof cssDefault === 'number') {
    return { top: cssDefault, bottom: cssDefault, left: 0, right: 0 }
  }
  if (cssDefault) {
    return {
      top: typeof cssDefault.top === 'number' ? cssDefault.top : 0,
      bottom: typeof cssDefault.bottom === 'number' ? cssDefault.bottom : 0,
      left: typeof cssDefault.left === 'number' ? cssDefault.left : 0,
      right: typeof cssDefault.right === 'number' ? cssDefault.right : 0
    }
  }
  if (definitionId) {
    return { ...DEFAULT_CUSTOM_SECTION_PADDING }
  }
  return { top: 0, bottom: 0, left: 0, right: 0 }
}

// =============================================================================
// Template Items Extraction
// =============================================================================

interface TemplateItemsResult {
  templateItems: SidebarItem[]
  customSections: Record<string, SectionInstance>
  invalidCustomSections: string[]
}

function extractTemplateItems(
  pageConfig: PageConfig,
  currentPage: string,
  templateDefaults: SidebarItem[],
  templateDefaultsById: Record<string, SidebarItem>,
  definitionIconMap: Record<string, LucideIcon>,
  defaultIcon: LucideIcon
): TemplateItemsResult {
  const allowSubscribe = currentPage === 'home'
  const templateOrder = Array.isArray(pageConfig.order) ? pageConfig.order : []
  const newTemplateItems: SidebarItem[] = []
  const newCustomSections: Record<string, SectionInstance> = {}
  const invalidCustomSections: string[] = []

  templateOrder.forEach((configKey) => {
    const rawItemId = CONFIG_TO_ID_MAP[configKey] || configKey
    const normalizedItemId = normalizeSectionId(rawItemId)
    if (!allowSubscribe && normalizedItemId === 'subheader') {
      return
    }
    const sectionConfig = pageConfig.sections[configKey]
    const definitionId = sectionConfig?.settings?.definitionId

    if (definitionId) {
      const normalizedCustomConfig = normalizeSectionCustomConfig(
        definitionId,
        normalizedItemId,
        sectionConfig?.settings?.customConfig
      )
      const instance = buildSectionInstance(definitionId, normalizedItemId, normalizedCustomConfig)
      if (instance) {
        newCustomSections[normalizedItemId] = instance
        newTemplateItems.push({
          id: normalizedItemId,
          label: resolveCustomSectionLabel(normalizedItemId, definitionId),
          definitionId,
          icon: definitionIconMap[definitionId] || defaultIcon
        })
        return
      }

      const defaultInstance = buildSectionInstance(definitionId, normalizedItemId)
      if (defaultInstance) {
        invalidCustomSections.push(normalizedItemId)
        newCustomSections[normalizedItemId] = defaultInstance
        newTemplateItems.push({
          id: normalizedItemId,
          label: resolveCustomSectionLabel(normalizedItemId, definitionId),
          definitionId,
          icon: definitionIconMap[definitionId] || defaultIcon
        })
        return
      }
    }

    const defaultItem = templateDefaultsById[normalizedItemId]
    if (defaultItem) {
      newTemplateItems.push({ ...defaultItem })
    } else {
      newTemplateItems.push({
        id: normalizedItemId,
        label: normalizedItemId.replace(/[-_]/g, ' ')
      })
    }
  })

  // Add any missing default sections
  const seenTemplateIds = new Set(newTemplateItems.map((item) => item.id))
  templateDefaults.forEach((item) => {
    if (!seenTemplateIds.has(item.id)) {
      newTemplateItems.push({ ...item })
    }
  })

  return {
    templateItems: newTemplateItems.length > 0 ? newTemplateItems : templateDefaults.map((item) => ({ ...item })),
    customSections: newCustomSections,
    invalidCustomSections
  }
}

// =============================================================================
// Footer Items Extraction
// =============================================================================

function extractFooterItems(footerConfig: FooterConfig): SidebarItem[] {
  const footerOrder = Array.isArray(footerConfig.order) ? footerConfig.order : []
  const newFooterItems = footerOrder.map((configKey) => {
    const itemId = CONFIG_TO_ID_MAP[configKey] || configKey
    const defaultItem = footerDefaultsById[itemId]
    return defaultItem
      ? { ...defaultItem }
      : {
          id: itemId,
          label: itemId.replace(/[-_]/g, ' ')
        }
  })
  return newFooterItems.length > 0 ? newFooterItems : footerItemsDefault.map((item) => ({ ...item }))
}

// =============================================================================
// Page Sections State Extraction
// =============================================================================

interface SectionsStateResult {
  visibility: Record<string, boolean>
  padding: Record<string, { top: number; bottom: number; left?: number; right?: number }>
  margins: Record<string, { top?: number; bottom?: number }>
}

function extractPageSectionsState(
  pageConfig: PageConfig,
  currentPage: string
): SectionsStateResult {
  const allowSubscribe = currentPage === 'home'
  const newVisibility: Record<string, boolean> = {}
  const newPadding: Record<string, { top: number; bottom: number; left?: number; right?: number }> = {}
  const newMargins: Record<string, { top?: number; bottom?: number }> = {}

  Object.entries(pageConfig.sections).forEach(([key, section]) => {
    const rawItemId = CONFIG_TO_ID_MAP[key] || key
    const stateId = normalizeSectionId(rawItemId)
    if (!allowSubscribe && stateId === 'subheader') {
      return
    }
    const definitionId = section.settings.definitionId
    const definition = definitionId ? getSectionDefinition(definitionId) : undefined
    const defaultPadding = getDefaultPadding(key, definitionId)
    const usesUnifiedPadding = definition?.usesUnifiedPadding ?? PADDING_BLOCK_SECTIONS.has(key)

    newVisibility[stateId] = section.settings.visible === false

    if (typeof section.settings.paddingBlock === 'number') {
      const unified = resolvePaddingValue(section.settings.paddingBlock, defaultPadding.top)
      newPadding[stateId] = {
        top: unified,
        bottom: unified,
        left: defaultPadding.left,
        right: defaultPadding.right
      }
    } else if (section.settings.padding) {
      const paddingSettings = section.settings.padding as SectionPadding
      newPadding[stateId] = {
        top: resolvePaddingValue(paddingSettings?.top, defaultPadding.top),
        bottom: resolvePaddingValue(paddingSettings?.bottom, defaultPadding.bottom),
        left: resolvePaddingValue(paddingSettings?.left, defaultPadding.left),
        right: resolvePaddingValue(paddingSettings?.right, defaultPadding.right)
      }
    } else {
      newPadding[stateId] = defaultPadding
    }

    if (usesUnifiedPadding) {
      const existing = newPadding[stateId]
      const value = existing?.top ?? defaultPadding.top
      newPadding[stateId] = {
        top: value,
        bottom: value,
        left: existing?.left ?? defaultPadding.left,
        right: existing?.right ?? defaultPadding.right
      }
    }

    const marginDefaults = CSS_DEFAULT_MARGIN[key]
    const marginSettings = (section.settings as SectionSettings & { margin?: { top?: number; bottom?: number } }).margin
    const resolvedTop = resolveMarginValue(marginSettings?.top, marginDefaults?.top)
    const resolvedBottom = resolveMarginValue(marginSettings?.bottom, marginDefaults?.bottom)
    if (resolvedTop !== undefined || resolvedBottom !== undefined) {
      newMargins[stateId] = {
        ...(resolvedTop !== undefined ? { top: resolvedTop } : {}),
        ...(resolvedBottom !== undefined ? { bottom: resolvedBottom } : {})
      }
    }
  })

  return {
    visibility: newVisibility,
    padding: newPadding,
    margins: newMargins
  }
}

// =============================================================================
// Footer Sections State Extraction
// =============================================================================

function extractFooterSectionsState(
  footerConfig: FooterConfig
): SectionsStateResult {
  const footerOrder = Array.isArray(footerConfig.order) ? footerConfig.order : []
  const footerSections = footerConfig.sections || {}
  const newVisibility: Record<string, boolean> = {}
  const newPadding: Record<string, { top: number; bottom: number; left?: number; right?: number }> = {}
  const newMargins: Record<string, { top?: number; bottom?: number }> = {}

  footerOrder.forEach((key) => {
    const section = footerSections[key]
    const stateId = CONFIG_TO_ID_MAP[key] || key
    const cssDefault = CSS_DEFAULT_PADDING[stateId]
    const cssMarginDefault = CSS_DEFAULT_MARGIN[stateId]

    if (section) {
      newVisibility[stateId] = section.settings.visible === false
    }

    if (section && typeof section.settings.paddingBlock === 'number') {
      const value = section.settings.paddingBlock
      newPadding[stateId] = {
        top: value,
        bottom: value,
        left: typeof cssDefault === 'object' ? cssDefault.left ?? 0 : 0,
        right: typeof cssDefault === 'object' ? cssDefault.right ?? 0 : 0
      }
    } else if (section && section.settings.padding) {
      const paddingSettings = section.settings.padding as SectionPadding
      newPadding[stateId] = {
        top: paddingSettings.top ?? (typeof cssDefault === 'object' ? cssDefault.top ?? 0 : 0),
        bottom: paddingSettings.bottom ?? (typeof cssDefault === 'object' ? cssDefault.bottom ?? 0 : 0),
        left: paddingSettings.left ?? (typeof cssDefault === 'object' ? cssDefault.left ?? 0 : 0),
        right: paddingSettings.right ?? (typeof cssDefault === 'object' ? cssDefault.right ?? 0 : 0)
      }
    } else if (typeof cssDefault === 'number') {
      newPadding[stateId] = { top: cssDefault, bottom: cssDefault, left: 0, right: 0 }
    } else if (cssDefault) {
      newPadding[stateId] = {
        top: cssDefault.top ?? 0,
        bottom: cssDefault.bottom ?? 0,
        left: cssDefault.left ?? 0,
        right: cssDefault.right ?? 0
      }
    }

    const sectionMargin = section
      ? (section.settings as SectionSettings & { margin?: { top?: number; bottom?: number } }).margin
      : undefined
    const resolvedTop = resolveMarginValue(sectionMargin?.top, cssMarginDefault?.top)
    const resolvedBottom = resolveMarginValue(sectionMargin?.bottom, cssMarginDefault?.bottom)
    if (resolvedTop !== undefined || resolvedBottom !== undefined) {
      newMargins[stateId] = {
        ...(resolvedTop !== undefined ? { top: resolvedTop } : {}),
        ...(resolvedBottom !== undefined ? { bottom: resolvedBottom } : {})
      }
    }
  })

  // Footer container margin
  const footerContainerMarginDefault = CSS_DEFAULT_MARGIN.footer
  const footerContainerMargin = footerConfig.margin
  const footerResolvedTop = resolveMarginValue(footerContainerMargin?.top, footerContainerMarginDefault?.top)
  const footerResolvedBottom = resolveMarginValue(footerContainerMargin?.bottom, footerContainerMarginDefault?.bottom)
  if (footerResolvedTop !== undefined || footerResolvedBottom !== undefined) {
    newMargins['footer'] = {
      ...(footerResolvedTop !== undefined ? { top: footerResolvedTop } : {}),
      ...(footerResolvedBottom !== undefined ? { bottom: footerResolvedBottom } : {})
    }
  }

  return {
    visibility: newVisibility,
    padding: newPadding,
    margins: newMargins
  }
}

// =============================================================================
// Header State Extraction
// =============================================================================

interface HeaderStateResult {
  visibility: Record<string, boolean>
  padding: Record<string, { top: number; bottom: number; left?: number; right?: number }>
  announcementBars: AnnouncementBarInstance[]
}

function extractHeaderState(headerConfig: SectionConfig): HeaderStateResult {
  const newVisibility: Record<string, boolean> = {}
  const newPadding: Record<string, { top: number; bottom: number; left?: number; right?: number }> = {}

  const headerHidden = headerConfig.settings.visible === false
  newVisibility.header = headerHidden

  const headerPadding = headerConfig.settings.padding
  if (headerPadding) {
    const top = headerPadding.top ?? 0
    const bottom = headerPadding.bottom ?? 0
    const left = headerPadding.left ?? 0
    const right = headerPadding.right ?? 0
    if (top !== 0 || bottom !== 0 || left !== 0 || right !== 0) {
      newPadding.header = { top, bottom, left, right }
    }
  } else if (typeof headerConfig.settings.paddingBlock === 'number') {
    const value = headerConfig.settings.paddingBlock
    if (value !== 0) {
      newPadding.header = {
        top: value,
        bottom: value,
        left: 0,
        right: 0
      }
    }
  }

  const headerAnnouncementBars = (headerConfig.settings as SectionSettings).announcementBars
  const announcementBars: AnnouncementBarInstance[] = Array.isArray(headerAnnouncementBars)
    ? headerAnnouncementBars
    : []

  return {
    visibility: newVisibility,
    padding: newPadding,
    announcementBars
  }
}

// =============================================================================
// Main Hydration Function
// =============================================================================

/**
 * Extracts workspace state from EditorState.
 * This is a pure function that performs data transformation.
 */
export function hydrateWorkspaceState(input: HydrationInput): HydrationResult {
  const {
    state,
    currentPage,
    templateDefaults,
    templateDefaultsById,
    definitionIconMap,
    defaultIcon
  } = input

  const headerConfig = state.header
  const footerConfig = state.footer
  const pageConfig = state.page
  const packageJsonValue = state.packageJson

  // Extract template items and custom sections
  const {
    templateItems,
    customSections,
    invalidCustomSections
  } = extractTemplateItems(
    pageConfig,
    currentPage,
    templateDefaults,
    templateDefaultsById,
    definitionIconMap,
    defaultIcon
  )

  // Extract footer items
  const footerItems = extractFooterItems(footerConfig)

  // Extract page sections state
  const pageSectionsState = extractPageSectionsState(pageConfig, currentPage)

  // Extract footer sections state
  const footerSectionsState = extractFooterSectionsState(footerConfig)

  // Extract header state
  const headerState = extractHeaderState(headerConfig)

  // Merge visibility, padding, and margins from all sources
  const sectionVisibility = {
    ...pageSectionsState.visibility,
    ...footerSectionsState.visibility,
    ...headerState.visibility
  }

  const sectionPadding = {
    ...pageSectionsState.padding,
    ...footerSectionsState.padding,
    ...headerState.padding
  }

  const sectionMargins = {
    ...pageSectionsState.margins,
    ...footerSectionsState.margins
  }

  // Build workspace snapshot
  const document = loadPersistedThemeDocument()
  const headerSettings = extractHeaderSettings(headerConfig, document)
  const mainSettings = extractMainSettings(pageConfig, document)

  const snapshot: WorkspaceSnapshot = {
    headerSettings,
    mainSettings,
    ...(typeof packageJsonValue === 'string' ? { packageJson: packageJsonValue } : {})
  }

  return {
    templateItems,
    footerItems,
    sectionVisibility,
    sectionPadding,
    sectionMargins,
    customSections,
    announcementBars: headerState.announcementBars,
    snapshot,
    invalidCustomSections
  }
}

// =============================================================================
// Snapshot Helpers
// =============================================================================

/**
 * Resolves workspace state by merging base snapshot with extras
 */
export function resolveWorkspaceSnapshot(
  base: WorkspaceSnapshot,
  extras?: Partial<WorkspaceSnapshot>
): WorkspaceSnapshot {
  return {
    headerSettings: extras?.headerSettings ?? base.headerSettings ?? DEFAULT_HEADER_SETTINGS,
    mainSettings: extras?.mainSettings ?? base.mainSettings ?? DEFAULT_MAIN_SETTINGS,
    ...(extras?.packageJson !== undefined
      ? { packageJson: extras.packageJson }
      : base.packageJson ? { packageJson: base.packageJson } : {})
  }
}

/**
 * Parses background color from package.json
 */
export function parseBgColorFromPackageJson(packageJsonStr: string | undefined): string {
  if (typeof packageJsonStr !== 'string' || packageJsonStr.length === 0) {
    return '#ffffff'
  }
  try {
    const pkgJson = JSON.parse(packageJsonStr)
    return pkgJson?.config?.custom?.site_background_color?.default ?? '#ffffff'
  } catch {
    return '#ffffff'
  }
}
