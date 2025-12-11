import type { MutableRefObject } from 'react'
import type {
  SectionPadding,
  AnnouncementBarConfig,
  AnnouncementContentConfig
} from '@defalt/utils/config/themeConfig'
import type { SidebarItem } from '@defalt/utils/config/configStateDefaults'
import type { SectionInstance, SectionConfigSchema, listDefinitionsByCategory } from '@defalt/sections/engine'
import type { LucideIcon } from 'lucide-react'
import type { HistoryCommand } from '@defalt/utils/history/commands'
import type { WorkspacePage } from '../../types/workspace'

export type PaddingUpdateResult = {
  previousState: Record<string, SectionPadding>
  nextState: Record<string, SectionPadding>
}

export type MarginUpdateResult = {
  previousState: Record<string, { top?: number; bottom?: number }>
  nextState: Record<string, { top?: number; bottom?: number }>
}

export type ToastHandler = (
  title: string,
  description?: string,
  type?: 'success' | 'error' | 'info'
) => void

// Section Manager Types

export interface SectionManagerParams {
  executeCommand: (cmd: HistoryCommand) => void
  markAsDirty: () => void
  showToast: ToastHandler
  currentPageRef: MutableRefObject<WorkspacePage>
  getHistoryPageId: () => string
}

export interface SectionManagerReturn {
  // State
  sectionVisibility: Record<string, boolean>
  sectionPadding: Record<string, SectionPadding>
  sectionMargins: Record<string, { top?: number; bottom?: number }>
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
  customSections: Record<string, SectionInstance>

  // Refs (for external access)
  sectionVisibilityRef: MutableRefObject<Record<string, boolean>>
  sectionPaddingRef: MutableRefObject<Record<string, SectionPadding>>
  sectionMarginsRef: MutableRefObject<Record<string, { top?: number; bottom?: number }>>
  templateItemsRef: MutableRefObject<SidebarItem[]>
  footerItemsRef: MutableRefObject<SidebarItem[]>
  customSectionsRef: MutableRefObject<Record<string, SectionInstance>>

  // Memoized values
  templateDefinitions: ReturnType<typeof listDefinitionsByCategory>
  memoizedTemplateOrder: string[]
  memoizedFooterOrder: string[]
  customTemplateSectionList: SectionInstance[]
  definitionIconMap: Record<string, LucideIcon>

  // Visibility functions
  setSectionVisibilityState: (id: string, hidden: boolean, options?: { silent?: boolean }) => void
  toggleSectionVisibility: (id: string, forceHidden?: boolean, options?: { silent?: boolean }) => void
  syncFeaturedSectionVisibility: (shouldShow: boolean, options?: { silent?: boolean }) => void

  // Reorder functions
  reorderTemplateItems: (startIndex: number, endIndex: number) => void
  reorderFooterItems: (startIndex: number, endIndex: number) => void

  // Add/Remove functions
  addTemplateSection: (definitionId: string) => void
  removeTemplateSection: (sectionId: string) => void

  // Padding functions
  updateSectionPadding: (
    id: string,
    updater: (padding: SectionPadding) => SectionPadding,
    options?: { recordHistory?: boolean }
  ) => PaddingUpdateResult | null
  previewSectionPaddingChange: (
    id: string,
    updater: (padding: SectionPadding) => SectionPadding
  ) => void
  commitSectionPaddingChange: (
    id: string,
    updater: (padding: SectionPadding) => SectionPadding
  ) => void

  // Margin functions
  updateSectionMargin: (
    id: string,
    updater: (margin: { top?: number; bottom?: number }) => { top?: number; bottom?: number },
    options?: { recordHistory?: boolean }
  ) => MarginUpdateResult | null
  previewSectionMarginChange: (
    id: string,
    updater: (margin: { top?: number; bottom?: number }) => { top?: number; bottom?: number }
  ) => void
  commitSectionMarginChange: (
    id: string,
    updater: (margin: { top?: number; bottom?: number }) => { top?: number; bottom?: number }
  ) => void

  // Custom section functions
  updateCustomSectionConfig: (
    id: string,
    updater: (config: SectionConfigSchema) => SectionConfigSchema
  ) => void

  // Subheader spacing
  applySubheaderSpacing: (style: string, options?: { recordHistory?: boolean }) => void

  // Hydration
  hydrateSection: (data: SectionHydrationData) => void

  // State setters (for hydration from outside)
  setSectionVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setSectionPadding: React.Dispatch<React.SetStateAction<Record<string, SectionPadding>>>
  setSectionMargins: React.Dispatch<React.SetStateAction<Record<string, { top?: number; bottom?: number }>>>
  setTemplateItems: React.Dispatch<React.SetStateAction<SidebarItem[]>>
  setFooterItems: React.Dispatch<React.SetStateAction<SidebarItem[]>>
  setCustomSections: React.Dispatch<React.SetStateAction<Record<string, SectionInstance>>>
}

export interface SectionHydrationData {
  sectionVisibility: Record<string, boolean>
  sectionPadding: Record<string, SectionPadding>
  sectionMargins: Record<string, { top?: number; bottom?: number }>
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
  customSections: Record<string, SectionInstance>
}

// Announcement Bar Types

export interface AnnouncementBarParams {
  executeCommand: (cmd: HistoryCommand) => void
  markAsDirty: () => void
}

export interface AnnouncementBarReturn {
  // State
  announcementBarConfig: AnnouncementBarConfig
  announcementContentConfig: AnnouncementContentConfig

  // Refs
  announcementBarConfigRef: MutableRefObject<AnnouncementBarConfig>
  announcementContentConfigRef: MutableRefObject<AnnouncementContentConfig>

  // Functions
  updateAnnouncementBarConfig: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  updateAnnouncementContentConfig: (updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => void
  // Preview/commit functions for color picker pattern
  previewAnnouncementBarConfig: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  commitAnnouncementBarConfig: () => void

  // Hydration
  hydrateAnnouncementBar: (data: AnnouncementBarHydrationData) => void

  // State setters (for hydration from outside)
  setAnnouncementBarConfig: React.Dispatch<React.SetStateAction<AnnouncementBarConfig>>
  setAnnouncementContentConfig: React.Dispatch<React.SetStateAction<AnnouncementContentConfig>>
}

export interface AnnouncementBarHydrationData {
  announcementBarConfig: AnnouncementBarConfig
  announcementContentConfig: AnnouncementContentConfig
}
