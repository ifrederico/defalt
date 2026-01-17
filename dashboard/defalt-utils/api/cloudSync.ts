import { z } from 'zod'
import { apiPath } from './apiPath'
import type { ThemeDocument } from '../config/themeConfig'
import { getCachedCsrfToken } from '../security/csrf'

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

/**
 * Schema for validating CloudTheme responses from API
 * The theme_json is validated separately when used
 */
const cloudThemeSchema = z.object({
  id: z.string(),
  ghost_member_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  theme_json: z.unknown(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
})

const cloudThemesArraySchema = z.array(cloudThemeSchema)

/**
 * Safely parse CloudTheme array from API response
 */
function parseCloudThemes(data: unknown): CloudTheme[] {
  const result = cloudThemesArraySchema.safeParse(data)
  if (!result.success) {
    console.warn('[cloudSync] Invalid API response:', result.error.format())
    return []
  }
  return result.data as CloudTheme[]
}

/**
 * Safely parse single CloudTheme from API response
 */
function parseCloudTheme(data: unknown): CloudTheme | null {
  const result = cloudThemeSchema.safeParse(data)
  if (!result.success) {
    console.warn('[cloudSync] Invalid API response:', result.error.format())
    return null
  }
  return result.data as CloudTheme
}

export type CloudResult<T> = { success: true; data: T } | { success: false; error: string }

export async function fetchUserThemes(): Promise<CloudResult<CloudTheme[]>> {
  try {
    const response = await fetch(apiPath('/api/themes'), {
      credentials: 'include'
    })
    if (!response.ok) {
      if (response.status === 401) return { success: true, data: [] }
      return { success: false, error: 'Failed to fetch themes' }
    }
    const json: unknown = await response.json()
    const data = parseCloudThemes(json)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function fetchActiveTheme(): Promise<CloudResult<CloudTheme | null>> {
  const result = await fetchUserThemes()
  if (!result.success) return result
  const active = result.data.find(t => t.is_active) ?? result.data[0] ?? null
  return { success: true, data: active }
}

export async function createTheme(document: ThemeDocument, name?: string): Promise<CloudResult<CloudTheme>> {
  try {
    const csrfToken = getCachedCsrfToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }
    const response = await fetch(apiPath('/api/themes'), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        name: name || 'My Theme',
        theme_json: document
      })
    })
    if (!response.ok) {
      return { success: false, error: 'Failed to create theme' }
    }
    const json: unknown = await response.json()
    const data = parseCloudTheme(json)
    if (!data) {
      return { success: false, error: 'Invalid response from server' }
    }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateTheme(id: string, document: ThemeDocument): Promise<CloudResult<CloudTheme>> {
  try {
    const csrfToken = getCachedCsrfToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }
    const response = await fetch(apiPath(`/api/themes/${id}`), {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ theme_json: document })
    })
    if (!response.ok) {
      return { success: false, error: 'Failed to update theme' }
    }
    const json: unknown = await response.json()
    const data = parseCloudTheme(json)
    if (!data) {
      return { success: false, error: 'Invalid response from server' }
    }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function saveThemeToCloud(document: ThemeDocument): Promise<CloudResult<CloudTheme>> {
  const existing = await fetchActiveTheme()
  if (!existing.success) return existing
  if (existing.data) {
    return updateTheme(existing.data.id, document)
  }
  return createTheme(document)
}

export async function loadThemeFromCloud(): Promise<CloudResult<ThemeDocument | null>> {
  const result = await fetchActiveTheme()
  if (!result.success) return result
  return { success: true, data: result.data?.theme_json ?? null }
}
