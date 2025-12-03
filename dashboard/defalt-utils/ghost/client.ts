/**
 * Ghost API Client
 *
 * Fetches data from Ghost Content API using credentials stored in localStorage.
 */

import type {
  GhostPostsResponse,
  GhostPagesResponse,
  GhostSettingsResponse,
  GhostTagsResponse,
  GhostAuthorsResponse
} from './types'

const STORAGE_KEY = 'defalt:ghost-connection'

export class GhostApiError extends Error {
  statusCode?: number
  details?: string

  constructor(message: string, statusCode?: number, details?: string) {
    super(message)
    this.name = 'GhostApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

type GhostCredentials = {
  url: string
  contentKey: string
}

function getCredentials(): GhostCredentials | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GhostCredentials>
      if (parsed.url && parsed.contentKey) {
        return {
          url: parsed.url.replace(/\/+$/, ''),
          contentKey: parsed.contentKey
        }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

const FETCH_TIMEOUT_MS = 15000

async function ghostFetch<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
  const creds = getCredentials()
  if (!creds) {
    throw new GhostApiError('Ghost credentials not configured')
  }

  const searchParams = new URLSearchParams()
  searchParams.set('key', creds.contentKey)

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${creds.url}/ghost/api/content/${endpoint}/?${searchParams.toString()}`,
      {
        signal: controller.signal,
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new GhostApiError(
        `Ghost API error: ${response.statusText}`,
        response.status
      )
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GhostApiError('Request timed out', 408)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchGhostPosts(params?: Record<string, unknown>): Promise<GhostPostsResponse> {
  return ghostFetch<GhostPostsResponse>('posts', params)
}

export async function fetchGhostPages(params?: Record<string, unknown>): Promise<GhostPagesResponse> {
  return ghostFetch<GhostPagesResponse>('pages', params)
}

export async function fetchGhostSettings(): Promise<GhostSettingsResponse> {
  return ghostFetch<GhostSettingsResponse>('settings')
}

export async function fetchGhostTags(params?: Record<string, unknown>): Promise<GhostTagsResponse> {
  return ghostFetch<GhostTagsResponse>('tags', params)
}

export async function fetchGhostAuthors(params?: Record<string, unknown>): Promise<GhostAuthorsResponse> {
  return ghostFetch<GhostAuthorsResponse>('authors', params)
}

export async function hasGhostCredentials(): Promise<boolean> {
  return getCredentials() !== null
}
