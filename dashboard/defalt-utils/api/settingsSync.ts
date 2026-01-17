import { apiPath } from './apiPath'
import { getCachedCsrfToken } from '../security/csrf'

export type CloudSettings = {
  ghost_api_url: string | null
  ghost_content_key: string | null
}

export async function fetchSettings(): Promise<CloudSettings> {
  const response = await fetch(apiPath('/api/settings'), {
    credentials: 'include'
  })
  if (!response.ok) {
    if (response.status === 401) return { ghost_api_url: null, ghost_content_key: null }
    throw new Error('Failed to fetch settings')
  }
  return response.json()
}

export async function saveSettings(url: string, contentKey: string): Promise<CloudSettings> {
  const csrfToken = getCachedCsrfToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }
  const response = await fetch(apiPath('/api/settings'), {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      ghost_api_url: url || null,
      ghost_content_key: contentKey || null
    })
  })
  if (!response.ok) {
    throw new Error('Failed to save settings')
  }
  return response.json()
}

export async function clearSettings(): Promise<void> {
  const csrfToken = getCachedCsrfToken()
  const headers: Record<string, string> = {}
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }
  const response = await fetch(apiPath('/api/settings'), {
    method: 'DELETE',
    headers,
    credentials: 'include'
  })
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to clear settings')
  }
}
