import { useCallback, useEffect, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import 'sonner/dist/styles.css'
import { getPendingToast, clearPendingToast, type ToastType } from './toastUtils'
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

  // Check for pending toasts after page reload
  useEffect(() => {
    const pendingToast = getPendingToast()
    if (pendingToast) {
      clearPendingToast()
      // Small delay to ensure page is fully loaded
      const timeoutId = setTimeout(() => {
        showToast(pendingToast.title, pendingToast.description, pendingToast.type)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [showToast])

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
