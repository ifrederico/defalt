import { HISTORY_STACK_LIMIT } from './constants'
import type { HistoryCommand, HistoryCommandScope, HistoryCommandMetadata } from './commands'

type HistoryEntry = {
  id: number
  scope: HistoryCommandScope
  pageId?: string
  command: HistoryCommand
}

type HistorySnapshot = {
  canUndo: boolean
  canRedo: boolean
  currentPage: string
  undoMetadata: HistoryCommandMetadata | null
  redoMetadata: HistoryCommandMetadata | null
  isInteractionBlocked: boolean
}

type HistoryListener = (snapshot: HistorySnapshot) => void

export class HistoryManager {
  private readonly pageUndoStacks = new Map<string, HistoryEntry[]>()
  private readonly pageRedoStacks = new Map<string, HistoryEntry[]>()
  private readonly listeners = new Set<HistoryListener>()
  private readonly stackLimit: number
  private globalUndoStack: HistoryEntry[] = []
  private globalRedoStack: HistoryEntry[] = []
  private sequence = 0
  private currentPage: string
  private interactionBlockers = new Set<string>()

  constructor(options?: { initialPage?: string, stackLimit?: number }) {
    this.currentPage = this.normalizePageId(options?.initialPage ?? 'home')
    this.stackLimit = options?.stackLimit ?? HISTORY_STACK_LIMIT
  }

  execute(command: HistoryCommand) {
    const scope = command.scope
    const pageId = scope === 'page' ? this.normalizePageId(command.pageId ?? this.currentPage) : undefined

    command.execute()

    const entry: HistoryEntry = {
      id: ++this.sequence,
      scope,
      pageId,
      command
    }

    if (scope === 'global') {
      this.globalUndoStack = this.pushWithLimit(this.globalUndoStack, entry)
      this.globalRedoStack = []
    } else if (pageId) {
      const stack = this.getPageUndoStack(pageId)
      this.pageUndoStacks.set(pageId, this.pushWithLimit(stack, entry))
      this.pageRedoStacks.set(pageId, [])
    }

    this.notify()
  }

  undo(): boolean {
    const entry = this.peekUndoEntry()
    if (!entry) {
      return false
    }

    entry.command.undo()

    if (entry.scope === 'global') {
      this.globalUndoStack.pop()
      this.globalRedoStack = this.pushWithLimit(this.globalRedoStack, entry)
    } else if (entry.pageId) {
      const undoStack = this.getPageUndoStack(entry.pageId)
      undoStack.pop()
      const redoStack = this.getPageRedoStack(entry.pageId)
      this.pageRedoStacks.set(entry.pageId, this.pushWithLimit(redoStack, entry))
    }

    this.notify()
    return true
  }

  redo(): boolean {
    const entry = this.peekRedoEntry()
    if (!entry) {
      return false
    }

    entry.command.execute()

    if (entry.scope === 'global') {
      this.globalRedoStack.pop()
      this.globalUndoStack = this.pushWithLimit(this.globalUndoStack, entry)
    } else if (entry.pageId) {
      const redoStack = this.getPageRedoStack(entry.pageId)
      redoStack.pop()
      const undoStack = this.getPageUndoStack(entry.pageId)
      this.pageUndoStacks.set(entry.pageId, this.pushWithLimit(undoStack, entry))
    }

    this.notify()
    return true
  }

  switchPage(pageId: string) {
    const normalized = this.normalizePageId(pageId)
    if (!normalized || this.currentPage === normalized) {
      return
    }
    this.currentPage = normalized
    this.notify()
  }

  canUndo(): boolean {
    return this.getPageUndoStack(this.currentPage).length > 0 || this.globalUndoStack.length > 0
  }

  canRedo(): boolean {
    return this.getPageRedoStack(this.currentPage).length > 0 || this.globalRedoStack.length > 0
  }

  subscribe(listener: HistoryListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): HistorySnapshot {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentPage: this.currentPage,
      undoMetadata: this.peekUndoEntry()?.command.metadata ?? null,
      redoMetadata: this.peekRedoEntry()?.command.metadata ?? null,
      isInteractionBlocked: this.interactionBlockers.size > 0
    }
  }

  setInteractionBlocker(id: string, active: boolean) {
    if (!id) {
      return
    }
    if (active) {
      this.interactionBlockers.add(id)
    } else {
      this.interactionBlockers.delete(id)
    }
    this.notify()
  }

  private pushWithLimit(stack: HistoryEntry[], entry: HistoryEntry) {
    const next = [...stack, entry]
    if (next.length > this.stackLimit) {
      next.shift()
    }
    return next
  }

  private getPageUndoStack(pageId: string) {
    if (!this.pageUndoStacks.has(pageId)) {
      this.pageUndoStacks.set(pageId, [])
    }
    return this.pageUndoStacks.get(pageId)!
  }

  private getPageRedoStack(pageId: string) {
    if (!this.pageRedoStacks.has(pageId)) {
      this.pageRedoStacks.set(pageId, [])
    }
    return this.pageRedoStacks.get(pageId)!
  }

  private selectLatestEntry(a?: HistoryEntry, b?: HistoryEntry): HistoryEntry | null {
    if (a && b) {
      return a.id >= b.id ? a : b
    }
    return a ?? b ?? null
  }

  private notify() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }

  private peekUndoEntry(): HistoryEntry | null {
    const pageStack = this.getPageUndoStack(this.currentPage)
    const pageEntry = pageStack[pageStack.length - 1]
    const globalEntry = this.globalUndoStack[this.globalUndoStack.length - 1]
    return this.selectLatestEntry(pageEntry, globalEntry)
  }

  private peekRedoEntry(): HistoryEntry | null {
    const pageStack = this.getPageRedoStack(this.currentPage)
    const pageEntry = pageStack[pageStack.length - 1]
    const globalEntry = this.globalRedoStack[this.globalRedoStack.length - 1]
    return this.selectLatestEntry(pageEntry, globalEntry)
  }

  private normalizePageId(pageId: string) {
    if (pageId === 'home') {
      return 'homepage'
    }
    return pageId
  }

  reset() {
    this.pageUndoStacks.clear()
    this.pageRedoStacks.clear()
    this.globalUndoStack = []
    this.globalRedoStack = []
    this.sequence = 0
    this.interactionBlockers.clear()
    this.notify()
  }
}
