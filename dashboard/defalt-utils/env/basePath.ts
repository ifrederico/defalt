/// <reference types="vite/client" />
/**
 * Vite base-path helpers using import.meta.env.BASE_URL.
 *
 * Uses Vite's native BASE_URL (set from vite.config.ts `base` option) rather
 * than manually parsing VITE_BASE_PATH. This is the single source of truth.
 *
 * BASE_URL is guaranteed by Vite:
 * - Always a string (never undefined)
 * - Always ends with a trailing slash
 * - Matches the resolved `base` from vite.config.ts
 *
 * IMPORTANT: Uses lazy evaluation to avoid accessing import.meta.env during
 * Vite config loading (before env vars are injected).
 */

// Cached values - computed on first access
let _basePath: string | null = null
let _basePathWithSlash: string | null = null

/**
 * Get the base path without trailing slash ("" for root).
 */
export function getBasePath(): string {
  if (_basePath === null) {
    // BASE_URL always ends with '/', remove it for consistency
    const baseUrl = import.meta.env.BASE_URL ?? '/'
    _basePath = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')
  }
  return _basePath
}

/**
 * Base path without trailing slash ("" for root).
 * Exported as function reference for lazy evaluation.
 */
export const BASE_PATH = getBasePath

/**
 * Get base path with trailing slash ("/" for root).
 */
export function getBasePathWithTrailingSlash(): string {
  if (_basePathWithSlash === null) {
    // BASE_URL already has trailing slash
    _basePathWithSlash = import.meta.env.BASE_URL ?? '/'
  }
  return _basePathWithSlash
}

/**
 * Exported as function reference for lazy evaluation.
 */
export const BASE_PATH_WITH_TRAILING_SLASH = getBasePathWithTrailingSlash

/**
 * Prefixes an absolute/relative path with BASE_PATH.
 */
export function withBasePath(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getBasePath()}${normalized}`
}

