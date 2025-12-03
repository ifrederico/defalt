import { logError } from '@defalt/utils/logging/errorLogger'
import { STORAGE_KEYS } from '@defalt/utils/constants'

export type ToastType = 'success' | 'error' | 'info'

export interface PendingToast {
  title: string
  description?: string
  type: ToastType
}

export function queueToastForAfterReload(title: string, description?: string, type: ToastType = 'success') {
  try {
    const pendingToast: PendingToast = { title, description, type }
    sessionStorage.setItem(STORAGE_KEYS.PENDING_TOAST, JSON.stringify(pendingToast))
  } catch (error) {
    logError(error, { scope: 'toastUtils.queue' })
  }
}

export function getPendingToast(): PendingToast | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PENDING_TOAST)
    if (!stored) return null
    return JSON.parse(stored) as PendingToast
  } catch (error) {
    logError(error, { scope: 'toastUtils.getPending' })
    return null
  }
}

export function clearPendingToast() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_TOAST)
  } catch (error) {
    logError(error, { scope: 'toastUtils.clearPending' })
  }
}
