import { apiPath } from './apiPath'

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
  const response = await fetch(apiPath('/api/settings'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch(apiPath('/api/settings'), {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to clear settings')
  }
}
