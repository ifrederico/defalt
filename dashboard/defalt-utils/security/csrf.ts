import { CSRF_ENDPOINT, CSRF_TOKEN_STORAGE_KEY } from './constants.js'
import { logError } from '../logging/errorLogger.js'
import { isAbortError } from '../helpers/errorHelpers.js'

const readStoredToken = (): string | null => {
  try {
    if (typeof window === 'undefined') {
      return null
    }
    return window.sessionStorage?.getItem(CSRF_TOKEN_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

const writeStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    if (!token) {
      window.sessionStorage?.removeItem(CSRF_TOKEN_STORAGE_KEY)
      return
    }
    window.sessionStorage?.setItem(CSRF_TOKEN_STORAGE_KEY, token)
  } catch {
    // Ignore quota errors
  }
}

export const getCachedCsrfToken = (): string | null => readStoredToken()

export async function requestCsrfToken(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(CSRF_ENDPOINT, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json'
      },
      signal
    })

    if (!response.ok) {
      throw new Error(`CSRF request failed: ${response.status}`)
    }

    const payload = await response.json() as { token?: string }
    const token = typeof payload.token === 'string' ? payload.token.trim() : ''
    writeStoredToken(token || null)
    return token || null
  } catch (error) {
    if (!isAbortError(error)) {
      logError(error, { scope: 'csrf.requestCsrfToken' })
    }
    writeStoredToken(null)
    return null
  }
}

export const persistCsrfToken = (token: string | null): void => {
  writeStoredToken(token)
}
