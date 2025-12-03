import { useContext } from 'react'
import { WorkspaceContext } from './WorkspaceContextBase'
import type { WorkspaceContextValue } from './WorkspaceContext.types'

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}
