import type { HistoryCommand, HistoryCommandMetadata } from '@defalt/utils/history/commands'

export type HistoryContextValue = {
  executeCommand: (command: HistoryCommand) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  undoMetadata: HistoryCommandMetadata | null
  redoMetadata: HistoryCommandMetadata | null
  isInteractionBlocked: boolean
  setInteractionBlocker: (id: string, active: boolean) => void
  switchPage: (pageId: string) => void
  resetHistory: () => void
}
