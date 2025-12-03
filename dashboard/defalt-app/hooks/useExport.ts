import { useState, useRef, useCallback, type ChangeEvent } from 'react'
import {
  loadPersistedThemeDocument,
  normalizeThemeDocument,
  type ThemeDocument
} from '@defalt/utils/config/themeConfig'
import { safeParseWorkspaceBackup } from '@defalt/utils/config/themeValidation'
import { logError, logWarning } from '@defalt/utils/logging/errorLogger'
import { apiPath } from '@defalt/utils/api/apiPath'
import { trackEvent } from '@defalt/utils/analytics/umami'

const BACKUP_VERSION = 2 as const
const EXPORT_TIMEOUT_MS = 60000

type NormalizedWorkspaceBackup = {
  version: number
  exportedAt: string
  document: ThemeDocument
}

type ToastType = 'success' | 'error' | 'info'

type UseExportParams = {
  hasUnsavedChanges: boolean
  applyWorkspaceBackup: (document: ThemeDocument) => void
  showToast: (title: string, description?: string, type?: ToastType) => void
  showError: (title: string, message: string) => void
  ensureCsrfToken: () => Promise<string>
  onShowUpgradeModal?: () => void
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

  const record = isPlainObject(raw) ? raw : null
  if (record?.document && isPlainObject(record.document)) {
    try {
      const versionValue = typeof record.version === 'number' ? record.version : BACKUP_VERSION
      const exportedAtValue = typeof record.exportedAt === 'string'
        ? record.exportedAt
        : new Date().toISOString()
      return {
        version: versionValue,
        exportedAt: exportedAtValue,
        document: normalizeThemeDocument(record.document)
      }
    } catch (error) {
      logWarning('Failed to normalize legacy backup document', { scope: 'useExport.parseWorkspaceBackup.legacy', error })
      return null
    }
  }

  if (record) {
    try {
      return {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        document: normalizeThemeDocument(record)
      }
    } catch {
      return null
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
  const [isDownloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
  const [isConfigDownloadConfirmOpen, setConfigDownloadConfirmOpen] = useState(false)
  const [isImportDialogOpen, setImportDialogOpen] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<{ data: NormalizedWorkspaceBackup, fileName: string } | null>(null)
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
      setConfigDownloadConfirmOpen(true)
      return
    }
    void performConfigDownload()
  }, [hasUnsavedChanges, performConfigDownload])

  const confirmConfigDownload = useCallback(() => {
    setConfigDownloadConfirmOpen(false)
    void performConfigDownload()
  }, [performConfigDownload])

  const cancelConfigDownload = useCallback(() => {
    setConfigDownloadConfirmOpen(false)
  }, [])

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

  const confirmThemeDownload = useCallback(() => {
    setDownloadConfirmOpen(false)
    void performThemeDownload()
  }, [performThemeDownload])

  const cancelThemeDownload = useCallback(() => {
    setDownloadConfirmOpen(false)
  }, [])

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
      setPendingBackup({ data: backup, fileName: file.name })
      setImportDialogOpen(true)
    } catch (error) {
      logError(error, { scope: 'useExport.handleBackupFileChange' })
      showError('File Read Error', 'Could not read the selected file.')
    }
  }, [showError])

  const confirmImportBackup = useCallback(() => {
    if (!pendingBackup) {
      setImportDialogOpen(false)
      return
    }
    try {
      applyWorkspaceBackup(pendingBackup.data.document)
      setImportDialogOpen(false)
      setPendingBackup(null)
    } catch (error) {
      logError(error, { scope: 'useExport.confirmImportBackup' })
      showError('Import Failed', 'Could not apply the selected backup.')
      setImportDialogOpen(false)
      setPendingBackup(null)
    }
  }, [applyWorkspaceBackup, pendingBackup, showError])

  const cancelImportBackup = useCallback(() => {
    setImportDialogOpen(false)
    setPendingBackup(null)
  }, [])

  return {
    isDownloading,
    isDownloadConfirmOpen,
    setDownloadConfirmOpen,
    isConfigDownloadConfirmOpen,
    setConfigDownloadConfirmOpen,
    isImportDialogOpen,
    setImportDialogOpen,
    pendingBackup,
    fileInputRef,
    handleThemeDownloadRequest: requestThemeDownload,
    handleConfirmThemeDownload: confirmThemeDownload,
    handleCancelThemeDownload: cancelThemeDownload,
    handleDownloadBackup: requestConfigDownload,
    handleConfirmConfigDownload: confirmConfigDownload,
    handleCancelConfigDownload: cancelConfigDownload,
    handleUploadConfigClick: triggerUpload,
    handleBackupFileChange,
    handleConfirmImportBackup: confirmImportBackup,
    handleCancelImportBackup: cancelImportBackup
  }
}
