import { useState, useRef, useCallback, type ChangeEvent } from 'react'
import {
  loadPersistedThemeDocument,
  normalizeThemeDocument,
  type ThemeDocument
} from '@defalt/utils/config/themeConfig'
import { safeParseWorkspaceBackup } from '@defalt/utils/config/themeValidation'
import { logError } from '@defalt/utils/logging/errorLogger'
import { apiPath } from '@defalt/utils/api/apiPath'
import { trackEvent } from '@defalt/utils/analytics/umami'
import type { ToastType } from '../types/toast'

const BACKUP_VERSION = 2 as const
const EXPORT_TIMEOUT_MS = 60000

type NormalizedWorkspaceBackup = {
  version: number
  exportedAt: string
  document: ThemeDocument
}

type UseExportParams = {
  hasUnsavedChanges: boolean
  applyWorkspaceBackup: (document: ThemeDocument) => void
  showToast: (title: string, description?: string, type?: ToastType) => void
  showError: (title: string, message: string) => void
  ensureCsrfToken: () => Promise<string>
  onShowUpgradeModal?: () => void
}

const parseWorkspaceBackup = (raw: unknown): NormalizedWorkspaceBackup | null => {
  const parsed = safeParseWorkspaceBackup(raw)
  if (parsed) {
    const version = typeof parsed.version === 'number' ? parsed.version : BACKUP_VERSION
    return {
      version,
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      document: normalizeThemeDocument(parsed.document as ThemeDocument)
    }
  }
  return null
}

export function useExport({
  hasUnsavedChanges,
  applyWorkspaceBackup,
  showToast,
  showError,
  ensureCsrfToken,
  onShowUpgradeModal
}: UseExportParams) {
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const performConfigDownload = useCallback(async () => {
    try {
      const themeDocument = loadPersistedThemeDocument()
      const backup: NormalizedWorkspaceBackup = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        document: themeDocument
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `defalt-config-${timestamp}.json`
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('Config downloaded successfully', undefined, 'success')
    } catch (error) {
      logError(error, { scope: 'useExport.performConfigDownload' })
      showError('Backup Failed', 'Could not create a config backup. Please try again.')
    }
  }, [showError, showToast])

  const requestConfigDownload = useCallback(() => {
    if (hasUnsavedChanges) {
      return
    }
    void performConfigDownload()
  }, [hasUnsavedChanges, performConfigDownload])

  const performThemeDownload = useCallback(async () => {
    if (isDownloading) {
      return
    }
    trackEvent('export-clicked')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS)
    try {
      setIsDownloading(true)
      const themeDocument = loadPersistedThemeDocument()
      const activeCsrfToken = await ensureCsrfToken()

      const response = await fetch(apiPath('/api/theme/export'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': activeCsrfToken
        },
        body: JSON.stringify({ document: themeDocument }),
        signal: controller.signal
      })

      if (!response.ok) {
        // Try to parse error as JSON first
        let errorMessage = `Failed to export theme: ${response.status} ${response.statusText}`
        let errorCode: string | undefined
        try {
          const errorData = await response.json()
          if (typeof errorData.error === 'string') {
            errorCode = errorData.error
          }
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message
          } else if (errorCode) {
            errorMessage = errorCode
          }
        } catch {
          // If JSON parse fails, use default message
        }

        logError(new Error(errorMessage), { scope: 'useExport.performThemeDownload.response', status: response.status })

        // If premium access denied, show upgrade modal
        if (response.status === 403 && errorCode === 'Premium feature access denied') {
          trackEvent('premium-blocked')
          onShowUpgradeModal?.()
          return
        }

        throw new Error(errorMessage)
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase()
      if (!contentType.includes('zip')) {
        // Try to extract a helpful message instead of downloading garbage
        try {
          const errorData = await response.clone().json()
          const message = (errorData && typeof errorData.message === 'string')
            ? errorData.message
            : (errorData && typeof errorData.error === 'string' ? errorData.error : null)
          if (message) {
            throw new Error(message)
          }
        } catch {
          try {
            const text = await response.clone().text()
            if (text && text.length < 400) {
              throw new Error(text)
            }
          } catch {
            // fall through
          }
        }
        throw new Error('Unexpected export response (expected zip).')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = 'defalt-custom.zip'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
      trackEvent('export-completed')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logError(error, { scope: 'useExport.performThemeDownload.timeout' })
        trackEvent('export-failed')
        showError('Download Timed Out', 'Export took too long. Please try again.')
        return
      }
      logError(error, { scope: 'useExport.performThemeDownload' })
      trackEvent('export-failed')
      showError('Download Failed', `Failed to download theme: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      clearTimeout(timeoutId)
      setIsDownloading(false)
    }
  }, [ensureCsrfToken, isDownloading, showError, onShowUpgradeModal])

  const requestThemeDownload = useCallback(() => {
    void performThemeDownload()
  }, [performThemeDownload])

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleBackupFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const backup = parseWorkspaceBackup(parsed)
      if (!backup) {
        showError('Invalid Backup File', 'Selected file is not a valid Defalt config backup.')
        return
      }
      try {
        applyWorkspaceBackup(backup.document)
      } catch (error) {
        logError(error, { scope: 'useExport.applyWorkspaceBackup' })
        showError('Import Failed', 'Could not apply the selected backup.')
      }
    } catch (error) {
      logError(error, { scope: 'useExport.handleBackupFileChange' })
      showError('File Read Error', 'Could not read the selected file.')
    }
  }, [applyWorkspaceBackup, showError])

  return {
    isDownloading,
    fileInputRef,
    handleThemeDownloadRequest: requestThemeDownload,
    handleDownloadBackup: requestConfigDownload,
    handleUploadConfigClick: triggerUpload,
    handleBackupFileChange
  }
}
