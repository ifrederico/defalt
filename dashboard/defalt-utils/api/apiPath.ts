/**
 * Get the API base path for fetch calls.
 * Uses VITE_BASE_PATH to handle deployments under subpaths (e.g., /app/).
 */

// Type definition for Vite's import.meta.env
interface ViteImportMeta {
  env?: Record<string, string | undefined>
}

const getEnvVar = (key: string): string => {
  const meta = import.meta as ViteImportMeta
  return meta.env?.[key] ?? ''
}

const BASE_PATH = getEnvVar('VITE_BASE_PATH').replace(/\/$/, '')

export function apiPath(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${BASE_PATH}${normalizedEndpoint}`
}
