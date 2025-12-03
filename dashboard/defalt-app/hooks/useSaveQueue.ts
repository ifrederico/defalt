import { useCallback, useRef } from 'react'

type TaskContext = {
  signal: AbortSignal
  version: number
}

type QueueTask<T> = (ctx: TaskContext) => Promise<T> | T

const createAbortError = () => {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError')
  }
  const error = new Error('Aborted')
  error.name = 'AbortError'
  return error
}

export const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }
  const name = (error as { name?: string }).name
  return name === 'AbortError'
}

export const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) {
    throw createAbortError()
  }
}

export function useSaveQueue() {
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const activeRef = useRef<{ controller: AbortController, version: number } | null>(null)
  const versionRef = useRef(0)

  const enqueue = useCallback(<T>(task: QueueTask<T>): Promise<{ value: T, version: number }> => {
    versionRef.current += 1
    const version = versionRef.current
    const controller = new AbortController()

    const runTask = async () => {
      throwIfAborted(controller.signal)
      activeRef.current = { controller, version }
      try {
        const value = await task({ signal: controller.signal, version })
        return { value, version }
      } finally {
        if (activeRef.current?.version === version) {
          activeRef.current = null
        }
      }
    }

    const chained = queueRef.current.then(runTask, runTask)

    queueRef.current = chained
      .then(() => undefined)
      .catch(() => undefined)

    return chained
  }, [])

  const cancel = useCallback(() => {
    if (activeRef.current) {
      activeRef.current.controller.abort()
      activeRef.current = null
    }
  }, [])

  const getActiveVersion = useCallback(() => activeRef.current?.version ?? null, [])

  return {
    enqueue,
    cancel,
    getActiveVersion
  }
}
