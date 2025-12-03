import { createContext } from 'react'
import type { HistoryContextValue } from './HistoryContext.types'

export const HistoryContext = createContext<HistoryContextValue | null>(null)
