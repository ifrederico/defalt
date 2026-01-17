import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'
import type { SidebarItem } from '@defalt/utils/config/sectionRegistry'
import {
  DEFAULT_ACCENT_COLOR,
  type AnnouncementBarConfig,
  type AnnouncementContentConfig,
  type AnnouncementBarInstance,
  type NavigationLayoutSetting
} from '@defalt/utils/config/themeConfig'
import type {
  SectionDefinition,
  SectionInstance,
} from '@defalt/sections/engine'
import type { PreviewData } from '@defalt/rendering/custom-source/handlebars/dataResolvers'

// =============================================================================
// Types
// =============================================================================

type TypographyCase = 'default' | 'uppercase'

interface SectionPadding {
  top: number
  bottom: number
  left?: number
  right?: number
}

interface SectionMargin {
  top?: number
  bottom?: number
}

interface WorkspaceState {
  // Data source
  previewData: PreviewData | null
  dataSource: 'placeholder' | 'ghost'
  accentColor: string

  // Section state
  sectionVisibility: Record<string, boolean>
  sectionPadding: Record<string, SectionPadding>
  sectionMargins: Record<string, SectionMargin>
  templateItems: SidebarItem[]
  footerItems: SidebarItem[]
  templateDefinitions: SectionDefinition[]
  customSections: Record<string, SectionInstance>

  // Header/navigation state
  navigationLayoutValue: NavigationLayoutSetting
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  stickyHeaderValue: string
  stickyHeaderOptions: string[]
  isSearchEnabled: boolean
  typographyCase: TypographyCase

  // Announcement bars
  announcementBars: AnnouncementBarInstance[]

  // AI sections
  aiSections: Array<{ id: string; name: string; html: string }>
}

interface WorkspaceActions {
  // Bulk state update (called by WorkspaceContext to sync state)
  syncState: (state: Partial<WorkspaceState>) => void

  // Section visibility
  setVisibility: (id: string, hidden: boolean) => void
  setBulkVisibility: (updates: Record<string, boolean>) => void

  // Section padding/margins (preview only, commit is handled by context)
  setSectionPadding: (id: string, padding: SectionPadding) => void
  setSectionMargin: (id: string, margin: SectionMargin) => void

  // Reordering
  setTemplateItems: (items: SidebarItem[]) => void
  setFooterItems: (items: SidebarItem[]) => void

  // Custom sections
  setCustomSections: (sections: Record<string, SectionInstance>) => void

  // Header settings
  setNavigationLayout: (value: NavigationLayoutSetting) => void
  setStickyHeader: (value: string) => void
  setSearchEnabled: (value: boolean) => void
  setTypographyCase: (value: TypographyCase) => void

  // Announcement bars
  setAnnouncementBars: (bars: AnnouncementBarInstance[]) => void
  updateAnnouncementBar: (id: string, config: AnnouncementBarConfig) => void
  updateAnnouncementContent: (id: string, config: AnnouncementContentConfig) => void

  // AI sections
  setAiSections: (sections: Array<{ id: string; name: string; html: string }>) => void
}

type WorkspaceStore = WorkspaceState & WorkspaceActions

// =============================================================================
// Default values
// =============================================================================

const defaultState: WorkspaceState = {
  previewData: null,
  dataSource: 'placeholder',
  accentColor: DEFAULT_ACCENT_COLOR,
  sectionVisibility: {},
  sectionPadding: {},
  sectionMargins: {},
  templateItems: [],
  footerItems: [],
  templateDefinitions: [],
  customSections: {},
  navigationLayoutValue: 'text',
  navigationLayoutOptions: [],
  navigationLayoutError: null,
  stickyHeaderValue: 'Always',
  stickyHeaderOptions: [],
  isSearchEnabled: true,
  typographyCase: 'default',
  announcementBars: [],
  aiSections: [],
}

// =============================================================================
// Store
// =============================================================================

export const useWorkspaceStore = create<WorkspaceStore>()(
  subscribeWithSelector((set) => ({
    ...defaultState,

    // Bulk state sync from WorkspaceContext
    syncState: (state) => set(state),

    // Section visibility
    setVisibility: (id, hidden) =>
      set((state) => ({
        sectionVisibility: { ...state.sectionVisibility, [id]: hidden }
      })),

    setBulkVisibility: (updates) =>
      set((state) => ({
        sectionVisibility: { ...state.sectionVisibility, ...updates }
      })),

    // Section padding/margins
    setSectionPadding: (id, padding) =>
      set((state) => ({
        sectionPadding: { ...state.sectionPadding, [id]: padding }
      })),

    setSectionMargin: (id, margin) =>
      set((state) => ({
        sectionMargins: { ...state.sectionMargins, [id]: margin }
      })),

    // Reordering
    setTemplateItems: (items) => set({ templateItems: items }),
    setFooterItems: (items) => set({ footerItems: items }),

    // Custom sections
    setCustomSections: (sections) => set({ customSections: sections }),

    // Header settings
    setNavigationLayout: (value) => set({ navigationLayoutValue: value }),
    setStickyHeader: (value) => set({ stickyHeaderValue: value }),
    setSearchEnabled: (value) => set({ isSearchEnabled: value }),
    setTypographyCase: (value) => set({ typographyCase: value }),

    // Announcement bars
    setAnnouncementBars: (bars) => set({ announcementBars: bars }),

    updateAnnouncementBar: (id, config) =>
      set((state) => ({
        announcementBars: state.announcementBars.map((bar) =>
          bar.id === id ? { ...bar, config } : bar
        )
      })),

    updateAnnouncementContent: (id, config) =>
      set((state) => ({
        announcementBars: state.announcementBars.map((bar) =>
          bar.id === id ? { ...bar, content: config } : bar
        )
      })),

    // AI sections
    setAiSections: (sections) => set({ aiSections: sections }),
  }))
)

// =============================================================================
// Selectors - Only export what's actually used
// =============================================================================

export const usePreviewData = () => useWorkspaceStore((s) => s.previewData)
export const useDataSource = () => useWorkspaceStore((s) => s.dataSource)
export const useSectionPadding = () => useWorkspaceStore((s) => s.sectionPadding)
export const useSectionMargins = () => useWorkspaceStore((s) => s.sectionMargins)
export const useCustomSections = () => useWorkspaceStore((s) => s.customSections)
export const useAnnouncementBars = () => useWorkspaceStore((s) => s.announcementBars)
export const useAiSections = () => useWorkspaceStore((s) => s.aiSections)

export const useHeaderSettings = () => useWorkspaceStore(
  useShallow((s) => ({
    navigationLayout: s.navigationLayoutValue,
    navigationLayoutOptions: s.navigationLayoutOptions,
    navigationLayoutError: s.navigationLayoutError,
    stickyHeader: s.stickyHeaderValue,
    stickyHeaderOptions: s.stickyHeaderOptions,
    isSearchEnabled: s.isSearchEnabled,
    typographyCase: s.typographyCase,
  }))
)
