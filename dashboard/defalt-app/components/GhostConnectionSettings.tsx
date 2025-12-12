import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppButton, TextInput } from '@defalt/ui'
import { useAuth } from '../hooks/useAuth'
import { fetchSettings, saveSettings, clearSettings } from '@defalt/utils/api/settingsSync'

const STORAGE_KEY = 'defalt:ghost-connection'
const CONNECTION_TIMEOUT_MS = 10000

type ConnectionStatus = 'idle' | 'saving' | 'success' | 'error'

type GhostCredentials = {
  url: string
  contentKey: string
}

function saveToLocalStorage(credentials: GhostCredentials): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
  } catch {
    // Storage may be unavailable in private browsing
  }
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage may be unavailable in private browsing
  }
}

function setDataSourcePreference(source: 'ghost' | 'placeholder'): void {
  try {
    localStorage.setItem('ghost-data-source', source)
  } catch {
    // Storage may be unavailable in private browsing
  }
}

function loadFromLocalStorage(): GhostCredentials {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GhostCredentials>
      return {
        url: parsed.url ?? '',
        contentKey: parsed.contentKey ?? ''
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { url: '', contentKey: '' }
}

export function GhostConnectionSettings() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [contentKey, setContentKey] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const hasLoadedFromCloudRef = useRef(false)

  // Load saved credentials on mount (localStorage first, then cloud)
  useEffect(() => {
    const creds = loadFromLocalStorage()
    if (creds.url && creds.contentKey) {
      setUrl(creds.url)
      setContentKey(creds.contentKey)
    }
  }, [])

  // Load from cloud if authenticated and no localStorage credentials
  useEffect(() => {
    if (!user || hasLoadedFromCloudRef.current) return
    hasLoadedFromCloudRef.current = true

    const localCreds = loadFromLocalStorage()
    if (localCreds.url && localCreds.contentKey) return

    fetchSettings()
      .then((cloudSettings) => {
        if (cloudSettings.ghost_api_url && cloudSettings.ghost_content_key) {
          const creds = { url: cloudSettings.ghost_api_url, contentKey: cloudSettings.ghost_content_key }
          saveToLocalStorage(creds)
          setUrl(creds.url)
          setContentKey(creds.contentKey)
          setDataSourcePreference('ghost')
          window.dispatchEvent(new CustomEvent('ghost-data-source-change', { detail: { source: 'ghost' } }))
        }
      })
      .catch(() => {
        // Cloud prefill is optional; ignore failures and fall back to local/manual entry.
      })
  }, [user])

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    setStatus('idle')
  }, [])

  const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContentKey(e.target.value)
    setStatus('idle')
  }, [])

  const handleSave = useCallback(async () => {
    if (!url || !contentKey) {
      setStatus('error')
      setErrorMessage('URL and Content API Key are required')
      return
    }

    const normalizedUrl = url.replace(/\/+$/, '')
    const credentials = { url: normalizedUrl, contentKey }

    setStatus('saving')
    setErrorMessage('')
    setIsSaving(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS)

    try {
      const response = await fetch(`${normalizedUrl}/ghost/api/content/settings/?key=${contentKey}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as { settings?: unknown }
      if (!data.settings) {
        throw new Error('Invalid response from Ghost API')
      }

      // Connection successful - save credentials
      saveToLocalStorage(credentials)
      setUrl(normalizedUrl)

      // Save to cloud if authenticated
      if (user) {
        saveSettings(normalizedUrl, contentKey).catch(() => {
          toast.error('Cloud sync failed', { description: 'Settings saved locally only.' })
        })
      }

      setStatus('success')

      // Notify preview to switch to Ghost data
      setDataSourcePreference('ghost')
      window.dispatchEvent(new CustomEvent('ghost-data-source-change', { detail: { source: 'ghost' } }))
    } catch (err) {
      setStatus('error')
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMessage('Connection timed out')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Connection failed')
      }
    } finally {
      clearTimeout(timeoutId)
      setIsSaving(false)
    }
  }, [url, contentKey, user])

  const handleClear = useCallback(() => {
    clearLocalStorage()

    // Clear from cloud if authenticated
    if (user) {
      clearSettings().catch(() => {
        toast.error('Cloud sync failed', { description: 'Settings cleared locally only.' })
      })
    }

    setUrl('')
    setContentKey('')
    setStatus('idle')
    setErrorMessage('')

    // Notify preview to switch back to placeholder data
    setDataSourcePreference('placeholder')
    window.dispatchEvent(new CustomEvent('ghost-data-source-change', { detail: { source: 'placeholder' } }))
  }, [user])

  const hasCredentials = url.length > 0 || contentKey.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-foreground mb-1">Ghost Content API</h3>
        <p className="text-sm text-secondary">Connect your Ghost site to preview with real content</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ghost-url" className="block text-sm font-medium text-foreground">
            Ghost URL
          </label>
          <TextInput
            id="ghost-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://your-site.ghost.io"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ghost-key" className="block text-sm font-medium text-foreground">
            Content API Key
          </label>
          <TextInput
            id="ghost-key"
            type="text"
            value={contentKey}
            onChange={handleKeyChange}
            placeholder="abc123def456..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-secondary">
            Found in Ghost Admin → Settings → Integrations → Add custom integration
          </p>
        </div>
      </div>

      {/* Error indicator */}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-error">
          <XCircle size={16} />
          <span className="text-sm">{errorMessage || 'Connection failed'}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <AppButton
          variant="dark"
          onClick={handleSave}
          disabled={!url || !contentKey || isSaving}
          className="w-[68px] h-[35px]"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            'Save'
          )}
        </AppButton>
        {hasCredentials && (
          <AppButton variant="light" onClick={handleClear} disabled={isSaving}>
            Clear
          </AppButton>
        )}
        {status === 'success' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-secondary">
            <CheckCircle size={14} className="text-success" />
            Connected
          </span>
        )}
      </div>
    </div>
  )
}
