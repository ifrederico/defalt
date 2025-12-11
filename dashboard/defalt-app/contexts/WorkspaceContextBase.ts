import { createTypedContext } from '@defalt/utils/helpers/createTypedContext'
import type { WorkspaceContextValue } from './WorkspaceContext.types'

// Use factory to create context and hook together
export const [WorkspaceContext, useWorkspaceContextInternal] = createTypedContext<WorkspaceContextValue>('Workspace')
