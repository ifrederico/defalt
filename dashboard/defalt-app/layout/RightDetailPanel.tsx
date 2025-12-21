import type { ReactNode } from 'react'
import { Layers } from 'lucide-react'
import { SidebarToggle } from '@defalt/ui'
import { useRightPanelCollapsed, useUIActions } from '../stores'

export type RightDetailPanelProps = {
  children?: ReactNode
}

/**
 * Right panel container for section details on wide screens.
 * This is a simple positioning wrapper - the actual content (header, tags, settings)
 * is handled by SectionDetailPanel which is passed as children.
 */
export function RightDetailPanel({ children }: RightDetailPanelProps) {
  const rightPanelCollapsed = useRightPanelCollapsed()
  const { toggleRightPanel } = useUIActions()
  const toggleClassName = rightPanelCollapsed
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  return (
    <div className={`group relative flex-shrink-0 transition-[width] duration-300 ${rightPanelCollapsed ? 'w-0' : 'w-[300px]'}`}>
      {rightPanelCollapsed && (
        <div
          className="absolute inset-y-0 right-0 w-8 z-10"
          aria-hidden="true"
        />
      )}
      <SidebarToggle
        position="right"
        collapsed={rightPanelCollapsed}
        onToggle={toggleRightPanel}
        className={`transition-opacity duration-200 z-30 ${toggleClassName}`}
      />
      <aside
        className={`relative z-20 h-full w-[300px] bg-surface border-l border-border flex flex-col transition-transform duration-300 ${
          rightPanelCollapsed ? 'translate-x-full group-hover:translate-x-0 shadow-md-heavy' : 'translate-x-0'
        }`}
      >
        {children ? (
          children
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-muted" />
            </div>
            <h3 className="font-md font-semibold text-foreground mb-1">Customize your templates</h3>
            <p className="font-sm text-muted">Select a section or block in the sidebar to start.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
