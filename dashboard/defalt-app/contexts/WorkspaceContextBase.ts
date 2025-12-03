import { createContext } from 'react'
import type { WorkspaceContextValue } from './WorkspaceContext.types'

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
