import type { ReactNode } from 'react'
import { Layers } from 'lucide-react'

export type RightDetailPanelProps = {
  children?: ReactNode
}

/**
 * Right panel container for section details on wide screens.
 * This is a simple positioning wrapper - the actual content (header, tags, settings)
 * is handled by SectionDetailPanel which is passed as children.
 */
export function RightDetailPanel({ children }: RightDetailPanelProps) {
  return (
    <aside className="w-[300px] bg-surface border-l border-border flex flex-col h-full">
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
  )
}
