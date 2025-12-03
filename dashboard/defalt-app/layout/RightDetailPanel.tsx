import type { ReactNode } from 'react'
import { Layers } from 'lucide-react'
import { PanelHeader } from '@defalt/ui'
import { useActiveDetail, useUIActions } from '../stores'

export type RightDetailPanelProps = {
  detailContent: ReactNode
}

export function RightDetailPanel({ detailContent }: RightDetailPanelProps) {
  const activeDetail = useActiveDetail()
  const { clearSelection } = useUIActions()
  return (
    <aside className="w-[300px] bg-surface border-l border-border flex flex-col h-full">
      {activeDetail ? (
        <>
          <PanelHeader title={activeDetail.label} onBack={clearSelection} />
          <div className="flex-1 overflow-y-auto bg-surface">
            {detailContent}
          </div>
        </>
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
