import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'

// Types
export type SectionDetail = {
  id: string
  label: string
  blockType?: string
  blockIndex?: number
}

export type ActiveTab = 'sections' | 'settings' | 'ai'

// State shape
interface UIState {
  // Selection
  activeDetail: SectionDetail | null

  // Hover (for preview highlighting)
  hoveredSectionId: string | null

  // Scroll-only trigger (from sidebar hover delay)
  scrollToSectionId: string | null

  // Sidebar
  activeTab: ActiveTab
  leftSidebarCollapsed: boolean
  rightPanelCollapsed: boolean
}

// Actions shape
interface UIActions {
  setActiveDetail: (detail: SectionDetail | null) => void
  setHoveredSectionId: (id: string | null) => void
  setScrollToSectionId: (id: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
  setLeftSidebarCollapsed: (collapsed: boolean) => void
  toggleLeftSidebar: () => void
  setRightPanelCollapsed: (collapsed: boolean) => void
  toggleRightPanel: () => void

  // Convenience action to select a section and open its detail
  selectSection: (id: string, label: string) => void

  // Clear selection
  clearSelection: () => void
}

type UIStore = UIState & UIActions

// Initial state
const initialState: UIState = {
  activeDetail: null,
  hoveredSectionId: null,
  scrollToSectionId: null,
  activeTab: 'sections',
  leftSidebarCollapsed: false,
  rightPanelCollapsed: false,
}

// Create store with subscribeWithSelector and persist for fine-grained subscriptions
export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setActiveDetail: (detail) => set({ activeDetail: detail }),

        setHoveredSectionId: (id) => set({ hoveredSectionId: id }),

        setScrollToSectionId: (id) => set({ scrollToSectionId: id }),

        setActiveTab: (tab) => set({ activeTab: tab }),

        setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),

        toggleLeftSidebar: () => set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),

        setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

        toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),

        selectSection: (id, label) => set({ activeDetail: { id, label } }),

        clearSelection: () => set({ activeDetail: null }),
      }),
      {
        name: 'defalt-ui-preferences',
        version: 2,
        partialize: (state) => ({
          activeTab: state.activeTab,
          leftSidebarCollapsed: state.leftSidebarCollapsed,
          rightPanelCollapsed: state.rightPanelCollapsed,
        }),
        migrate: (state, version) => {
          if (version === 1) {
            const previous = state as {
              activeTab?: ActiveTab | 'code'
              sidebarExpanded?: boolean
            }
            const activeTab = previous.activeTab === 'code' ? 'sections' : previous.activeTab ?? 'sections'
            return {
              activeTab,
              leftSidebarCollapsed: false,
              rightPanelCollapsed: false,
            }
          }
          return state as {
            activeTab?: ActiveTab
            leftSidebarCollapsed?: boolean
            rightPanelCollapsed?: boolean
          }
        },
      }
    )
  )
)

// Selector hooks for fine-grained subscriptions
// Components using these will only re-render when their specific slice changes

export const useActiveDetail = () => useUIStore((state) => state.activeDetail)
export const useHoveredSectionId = () => useUIStore((state) => state.hoveredSectionId)
export const useScrollToSectionId = () => useUIStore((state) => state.scrollToSectionId)
export const useActiveTab = () => useUIStore((state) => state.activeTab)
export const useLeftSidebarCollapsed = () => useUIStore((state) => state.leftSidebarCollapsed)
export const useRightPanelCollapsed = () => useUIStore((state) => state.rightPanelCollapsed)

// Action hooks (stable references, never cause re-renders)
// useShallow prevents infinite loops by doing shallow comparison of the returned object
export const useUIActions = () => useUIStore(
  useShallow((state) => ({
    setActiveDetail: state.setActiveDetail,
    setHoveredSectionId: state.setHoveredSectionId,
    setScrollToSectionId: state.setScrollToSectionId,
    setActiveTab: state.setActiveTab,
    setLeftSidebarCollapsed: state.setLeftSidebarCollapsed,
    toggleLeftSidebar: state.toggleLeftSidebar,
    setRightPanelCollapsed: state.setRightPanelCollapsed,
    toggleRightPanel: state.toggleRightPanel,
    selectSection: state.selectSection,
    clearSelection: state.clearSelection,
  }))
)
