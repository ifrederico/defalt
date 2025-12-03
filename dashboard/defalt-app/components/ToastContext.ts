import { createContext, useContext } from 'react'
import type { ToastType } from './toastUtils'

export interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
