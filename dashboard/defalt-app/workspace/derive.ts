/**
 * Workspace Derive - Pure functions for building configs from workspace state
 *
 * These functions convert workspace state into config structures suitable
 * for persistence. They are pure functions with no React dependencies.
 */

import {
  SECTION_ID_MAP,
  PADDING_BLOCK_SECTIONS,
  type SectionConfig,
  type PageConfig,
  type FooterConfig,
  type SectionSettings,
  type SectionType
} from '@defalt/utils/config/themeConfig'
import { getSectionDefinition, type SectionInstance } from '@defalt/sections/engine'
import type { SidebarItem } from '@defalt/utils/config/sectionRegistry'
import type { AnnouncementBarInstance } from '@defalt/utils/config/themeConfig'
import type { HeaderSettingsSnapshot } from '@defalt/utils/config/themeConfig'

// =============================================================================
// Types
// =============================================================================

export interface SectionState {
  sectionVisibility: Record<string, boolean>
  sectionPadding: Record<string, { top: number; bottom: number; left?: number; right?: number }>
  sectionMargins: Record<string, { top?: number; bottom?: number }>
  customSections: Record<string, SectionInstance>
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
}

export interface HeaderState {
  headerSettings: HeaderSettingsSnapshot
  announcementBars: AnnouncementBarInstance[]
}

// =============================================================================
// Page Config Building
// =============================================================================

/**
 * Builds a PageConfig from workspace state
 */
export function buildPageConfigFromState(state: SectionState): PageConfig {
  const templateOrder = state.templateItems
    .map((item) => SECTION_ID_MAP[item.id] || item.id)
    .filter((key) => key !== 'header' && key !== 'footerBar' && key !== 'footerSignup')

  const sections: Record<string, SectionConfig> = {}

  state.templateItems.forEach((item) => {
    if (item.id === 'header') {
      return
    }
    const configKey = SECTION_ID_MAP[item.id] || item.id
    const customInstance = state.customSections[item.id]
    const visible = !(state.sectionVisibility[item.id] ?? false)
    const definition = customInstance ? getSectionDefinition(customInstance.definitionId) : undefined
    const usesUnifiedPadding = definition?.usesUnifiedPadding ?? PADDING_BLOCK_SECTIONS.has(configKey)
    const padding = state.sectionPadding[item.id]

    const settings: SectionConfig['settings'] = {
      visible
    }

    if (customInstance) {
      settings.definitionId = customInstance.definitionId
      settings.customConfig = customInstance.config as Record<string, unknown>
    }

    if (padding) {
      if (usesUnifiedPadding) {
        settings.paddingBlock = padding.top
      } else {
        settings.padding = { ...padding }
      }
    }

    const margin = state.sectionMargins[item.id]
    if (margin) {
      const normalizedMargin: { top?: number; bottom?: number } = {}
      if (typeof margin.top === 'number' && Number.isFinite(margin.top)) {
        normalizedMargin.top = Math.max(0, margin.top)
      }
      if (typeof margin.bottom === 'number' && Number.isFinite(margin.bottom)) {
        normalizedMargin.bottom = Math.max(0, margin.bottom)
      }
      if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
        settings.margin = normalizedMargin
      }
    }

    const sectionType: SectionType = customInstance ? 'custom' : (configKey === 'main' ? 'main' : 'header')

    sections[configKey] = {
      type: sectionType,
      settings
    }
  })

  return {
    order: templateOrder,
    sections
  }
}

// =============================================================================
// Header Config Building
// =============================================================================

/**
 * Builds a header SectionConfig from workspace state
 */
export function buildHeaderConfigFromState(
  state: SectionState,
  headerState: HeaderState
): SectionConfig {
  const headerHidden = state.sectionVisibility.header ?? false
  const headerPadding = state.sectionPadding.header

  const settings: SectionSettings = {
    visible: !headerHidden,
    navigationLayout: headerState.headerSettings.navigationLayout,
    stickyHeaderMode: headerState.headerSettings.stickyHeaderMode,
    searchEnabled: headerState.headerSettings.searchEnabled,
    typographyCase: headerState.headerSettings.typographyCase,
    announcementBars: headerState.announcementBars
  }

  if (headerPadding) {
    const { top, bottom, left, right } = headerPadding
    if (top !== 0 || bottom !== 0 || (left && left !== 0) || (right && right !== 0)) {
      settings.padding = { ...headerPadding }
    }
  }

  return {
    type: 'header',
    settings
  }
}

// =============================================================================
// Footer Config Building
// =============================================================================

/**
 * Builds a FooterConfig from workspace state
 */
export function buildFooterConfigFromState(state: SectionState): FooterConfig {
  const order = state.footerItems.map((item) => SECTION_ID_MAP[item.id] || item.id)
  const sections: Record<string, SectionConfig> = {}

  state.footerItems.forEach((item) => {
    const configKey = SECTION_ID_MAP[item.id] || item.id
    const visible = !(state.sectionVisibility[item.id] ?? false)
    const padding = state.sectionPadding[item.id]
    const isPaddingBlockSection = PADDING_BLOCK_SECTIONS.has(configKey)

    const settings: SectionSettings = {
      visible
    }

    if (padding) {
      if (isPaddingBlockSection) {
        settings.paddingBlock = padding.top
      } else {
        settings.padding = { ...padding }
      }
    }

    const margin = state.sectionMargins[item.id]
    if (margin) {
      const normalizedMargin: { top?: number; bottom?: number } = {}
      if (typeof margin.top === 'number' && Number.isFinite(margin.top)) {
        normalizedMargin.top = Math.max(0, margin.top)
      }
      if (typeof margin.bottom === 'number' && Number.isFinite(margin.bottom)) {
        normalizedMargin.bottom = Math.max(0, margin.bottom)
      }
      if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
        settings.margin = normalizedMargin
      }
    }

    sections[configKey] = {
      type: configKey === 'footerSignup' ? 'footer-signup' : 'footer-bar',
      settings
    }
  })

  // Footer container margin
  const footerContainerMargin = state.sectionMargins['footer']
  let margin: { top?: number; bottom?: number } | undefined
  if (footerContainerMargin) {
    const normalizedMargin: { top?: number; bottom?: number } = {}
    if (typeof footerContainerMargin.top === 'number' && Number.isFinite(footerContainerMargin.top)) {
      normalizedMargin.top = Math.max(0, footerContainerMargin.top)
    }
    if (typeof footerContainerMargin.bottom === 'number' && Number.isFinite(footerContainerMargin.bottom)) {
      normalizedMargin.bottom = Math.max(0, footerContainerMargin.bottom)
    }
    if (normalizedMargin.top !== undefined || normalizedMargin.bottom !== undefined) {
      margin = normalizedMargin
    }
  }

  return {
    order,
    sections,
    margin
  }
}

// =============================================================================
// Margin Normalization
// =============================================================================

/**
 * Normalizes a margin value, ensuring it's non-negative
 */
export function normalizeMarginValue(value: unknown, defaultValue?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }
  if (typeof defaultValue === 'number' && Number.isFinite(defaultValue)) {
    return Math.max(0, defaultValue)
  }
  return undefined
}

/**
 * Resolves padding from various sources
 */
export function resolvePaddingValue(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return defaultValue
}
