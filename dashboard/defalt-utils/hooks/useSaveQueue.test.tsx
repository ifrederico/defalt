/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSaveQueue, isAbortError, throwIfAborted } from './useSaveQueue'

describe('useSaveQueue', () => {
  it('runs tasks sequentially and increments versions', async () => {
    const { result, unmount } = renderHook(() => useSaveQueue())
    const api = result.current
    const order: number[] = []

    const firstTask = vi.fn(async ({ version }: { version: number }) => {
      order.push(version)
      await Promise.resolve()
      return 'first'
    })
    const secondTask = vi.fn(async ({ version }: { version: number }) => {
      order.push(version)
      return 'second'
    })

    const firstResult = api.enqueue(firstTask)
    const secondResult = api.enqueue(secondTask)

    await expect(firstResult).resolves.toMatchObject({ value: 'first', version: 1 })
    await expect(secondResult).resolves.toMatchObject({ value: 'second', version: 2 })
    expect(order).toEqual([1, 2])

    unmount()
  })

  it('cancels the active task by aborting its signal', async () => {
    const { result, unmount } = renderHook(() => useSaveQueue())
    const api = result.current

    let resolveStarted: (() => void) | null = null
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const blockingTask = vi.fn(({ signal }: { signal: AbortSignal }) => {
      resolveStarted?.()
      return new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const pending = api.enqueue(blockingTask)
    await started
    api.cancel()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(api.getActiveVersion()).toBeNull()

    unmount()
  })

  it('throws and identifies abort errors via helpers', () => {
    const controller = new AbortController()
    controller.abort()

    expect(() => throwIfAborted(controller.signal)).toThrowError(/Aborted/)

    try {
      throwIfAborted(controller.signal)
    } catch (error) {
      expect(isAbortError(error)).toBe(true)
    }
  })
})
