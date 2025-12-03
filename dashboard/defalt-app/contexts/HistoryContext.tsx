import type { ReactNode } from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { HistoryManager } from '@defalt/utils/history/HistoryManager'
import type { HistoryCommand } from '@defalt/utils/history/commands'
import { HistoryContext } from './HistoryContextBase'
import type { HistoryContextValue } from './HistoryContext.types'

type HistoryProviderProps = {
  children: ReactNode
}

const isUndoRedoKey = (event: KeyboardEvent) => {
  if (!event.key || event.key.toLowerCase() !== 'z') {
    return null
  }
  if (!(event.metaKey || event.ctrlKey)) {
    return null
  }
  return event.shiftKey ? 'redo' : 'undo'
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  const manager = useMemo(() => new HistoryManager({ initialPage: 'home' }), [])
  const initialSnapshot = manager.getSnapshot()
  const [canUndo, setCanUndo] = useState(initialSnapshot.canUndo)
  const [canRedo, setCanRedo] = useState(initialSnapshot.canRedo)
  const [undoMetadata, setUndoMetadata] = useState(initialSnapshot.undoMetadata)
  const [redoMetadata, setRedoMetadata] = useState(initialSnapshot.redoMetadata)
  const [isInteractionBlocked, setInteractionBlocked] = useState(initialSnapshot.isInteractionBlocked)

  useEffect(() => {
    return manager.subscribe((snapshot) => {
      setCanUndo(snapshot.canUndo)
      setCanRedo(snapshot.canRedo)
      setUndoMetadata(snapshot.undoMetadata)
      setRedoMetadata(snapshot.redoMetadata)
      setInteractionBlocked(snapshot.isInteractionBlocked)
    })
  }, [manager])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const intent = isUndoRedoKey(event)
      if (!intent || event.defaultPrevented) {
        return
      }
      event.preventDefault()
      if (intent === 'undo') {
        manager.undo()
      } else {
        manager.redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [manager])

  const executeCommand = useCallback((command: HistoryCommand) => {
    manager.execute(command)
  }, [manager])

  const setInteractionBlocker = useCallback((id: string, active: boolean) => {
    manager.setInteractionBlocker(id, active)
  }, [manager])

  const resetHistory = useCallback(() => {
    manager.reset()
  }, [manager])

  const value = useMemo<HistoryContextValue>(() => ({
    executeCommand,
    undo: () => {
      manager.undo()
    },
    redo: () => {
      manager.redo()
    },
    canUndo,
    canRedo,
    undoMetadata,
    redoMetadata,
    isInteractionBlocked,
    setInteractionBlocker,
    switchPage: (pageId: string) => manager.switchPage(pageId),
    resetHistory
  }), [canRedo, canUndo, executeCommand, isInteractionBlocked, manager, redoMetadata, resetHistory, setInteractionBlocker, undoMetadata])

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}
