import { useContext } from 'react'
import { HistoryContext } from './HistoryContextBase'
import type { HistoryContextValue } from './HistoryContext.types'

export function useHistoryContext(): HistoryContextValue {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistoryContext must be used within a HistoryProvider')
  }
  return context
}
