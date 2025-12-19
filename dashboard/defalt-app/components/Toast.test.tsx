/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ToastProvider } from './Toast'
import { useToast } from './ToastContext'

const { toastSpy, successSpy, errorSpy, mockToaster } = vi.hoisted(() => {
  return {
    toastSpy: vi.fn(),
    successSpy: vi.fn(),
    errorSpy: vi.fn(),
    mockToaster: ({ children }: { children?: ReactNode }) => <div data-testid="toaster">{children}</div>
  }
})

vi.mock('sonner', () => ({
  Toaster: mockToaster,
  toast: Object.assign(toastSpy, { success: successSpy, error: errorSpy })
}))

const Wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>

describe('Toast', () => {
  beforeEach(() => {
    toastSpy.mockClear()
    successSpy.mockClear()
    errorSpy.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls base toast for info', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper })

    act(() => {
      result.current.showToast('Info message')
    })

    expect(toastSpy).toHaveBeenCalledWith('Info message', undefined)
    expect(successSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('calls success variant', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper })

    act(() => {
      result.current.showToast('Saved', 'All good', 'success')
    })

    expect(successSpy).toHaveBeenCalledWith('Saved', { description: 'All good' })
    expect(toastSpy).not.toHaveBeenCalled()
  })

  it('calls error variant', () => {
    const { result } = renderHook(() => useToast(), { wrapper: Wrapper })

    act(() => {
      result.current.showToast('Failed', 'Nope', 'error')
    })

    expect(errorSpy).toHaveBeenCalledWith('Failed', { description: 'Nope' })
    expect(toastSpy).not.toHaveBeenCalled()
  })

})
