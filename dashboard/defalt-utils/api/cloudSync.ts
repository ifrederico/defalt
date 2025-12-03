import { apiPath } from './apiPath'
import type { ThemeDocument } from '../config/themeConfig'

export type CloudTheme = {
  id: string
  ghost_member_id: string
  name: string
  description: string | null
  theme_json: ThemeDocument
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function fetchUserThemes(): Promise<CloudTheme[]> {
  const response = await fetch(apiPath('/api/themes'), {
    credentials: 'include'
  })
  if (!response.ok) {
    if (response.status === 401) return []
    throw new Error('Failed to fetch themes')
  }
  return response.json()
}

export async function fetchActiveTheme(): Promise<CloudTheme | null> {
  const themes = await fetchUserThemes()
  return themes.find(t => t.is_active) ?? themes[0] ?? null
}

export async function createTheme(document: ThemeDocument, name?: string): Promise<CloudTheme> {
  const response = await fetch(apiPath('/api/themes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name || 'My Theme',
      theme_json: document
    })
  })
  if (!response.ok) {
    throw new Error('Failed to create theme')
  }
  return response.json()
}

export async function updateTheme(id: string, document: ThemeDocument): Promise<CloudTheme> {
  const response = await fetch(apiPath(`/api/themes/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ theme_json: document })
  })
  if (!response.ok) {
    throw new Error('Failed to update theme')
  }
  return response.json()
}

export async function saveThemeToCloud(document: ThemeDocument): Promise<CloudTheme> {
  const existing = await fetchActiveTheme()
  if (existing) {
    return updateTheme(existing.id, document)
  }
  return createTheme(document)
}

export async function loadThemeFromCloud(): Promise<ThemeDocument | null> {
  const theme = await fetchActiveTheme()
  return theme?.theme_json ?? null
}
