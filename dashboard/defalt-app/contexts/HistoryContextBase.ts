import { createTypedContext } from '@defalt/utils/helpers/createTypedContext'
import type { HistoryContextValue } from './HistoryContext.types'

// Use factory to create context and hook together
export const [HistoryContext, useHistoryContextInternal] = createTypedContext<HistoryContextValue>('History')
