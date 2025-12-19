import { useCallback, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import 'sonner/dist/styles.css'
import type { ToastType } from '../types/toast'
import { ToastContext } from './ToastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const options = description ? { description } : undefined
    if (type === 'success') {
      toast.success(title, options)
      return
    }
    if (type === 'error') {
      toast.error(title, options)
      return
    }
    toast(title, options)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="bottom-left"
        duration={3000}
        theme="light"
        toastOptions={{
          classNames: {
            toast: 'bg-surface text-foreground border border-border shadow-md',
            description: 'text-secondary',
            success: '[&_svg]:text-success',
            error: '[&_svg]:text-error'
          }
        }}
      />
    </ToastContext.Provider>
  )
}
