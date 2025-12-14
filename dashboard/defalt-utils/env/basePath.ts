/**
 * Vite base-path helpers.
 *
 * VITE_BASE_PATH can be set to deploy under a subpath (e.g. "/app/").
 */

// Type definition for Vite's import.meta.env
interface ViteImportMeta {
  env?: Record<string, string | undefined>
}

const getEnvVar = (key: string): string => {
  const meta = import.meta as ViteImportMeta
  return meta.env?.[key] ?? ''
}

/**
 * Base path without trailing slash ("" for root).
 */
export const BASE_PATH = getEnvVar('VITE_BASE_PATH').replace(/\/$/, '')

/**
 * Base path with trailing slash ("/" for root).
 */
export const BASE_PATH_WITH_TRAILING_SLASH = BASE_PATH ? `${BASE_PATH}/` : '/'

/**
 * Prefixes an absolute/relative path with BASE_PATH.
 */
export function withBasePath(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${BASE_PATH}${normalized}`
}

