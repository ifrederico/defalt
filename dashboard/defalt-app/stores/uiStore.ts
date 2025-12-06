import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'

// Types
export type SectionDetail = {
  id: string
  label: string
}

export type ActiveTab = 'sections' | 'settings' | 'code'

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
  sidebarExpanded: boolean
}

// Actions shape
interface UIActions {
  setActiveDetail: (detail: SectionDetail | null) => void
  setHoveredSectionId: (id: string | null) => void
  setScrollToSectionId: (id: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
  setSidebarExpanded: (expanded: boolean) => void
  toggleSidebar: () => void

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
  sidebarExpanded: false,
}

// Create store with subscribeWithSelector for fine-grained subscriptions
export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    ...initialState,

    // Actions
    setActiveDetail: (detail) => set({ activeDetail: detail }),

    setHoveredSectionId: (id) => set({ hoveredSectionId: id }),

    setScrollToSectionId: (id) => set({ scrollToSectionId: id }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

    toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

    selectSection: (id, label) => set({ activeDetail: { id, label } }),

    clearSelection: () => set({ activeDetail: null }),
  }))
)

// Selector hooks for fine-grained subscriptions
// Components using these will only re-render when their specific slice changes

export const useActiveDetail = () => useUIStore((state) => state.activeDetail)
export const useHoveredSectionId = () => useUIStore((state) => state.hoveredSectionId)
export const useScrollToSectionId = () => useUIStore((state) => state.scrollToSectionId)
export const useActiveTab = () => useUIStore((state) => state.activeTab)
export const useSidebarExpanded = () => useUIStore((state) => state.sidebarExpanded)

// Action hooks (stable references, never cause re-renders)
// useShallow prevents infinite loops by doing shallow comparison of the returned object
export const useUIActions = () => useUIStore(
  useShallow((state) => ({
    setActiveDetail: state.setActiveDetail,
    setHoveredSectionId: state.setHoveredSectionId,
    setScrollToSectionId: state.setScrollToSectionId,
    setActiveTab: state.setActiveTab,
    setSidebarExpanded: state.setSidebarExpanded,
    toggleSidebar: state.toggleSidebar,
    selectSection: state.selectSection,
    clearSelection: state.clearSelection,
  }))
)
