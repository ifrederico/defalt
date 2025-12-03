/**
 * Get the API base path for fetch calls.
 * Uses VITE_BASE_PATH to handle deployments under subpaths (e.g., /app/).
 */

// Access import.meta.env safely for both browser and Node contexts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEnvVar = (key: string): string => ((import.meta as any).env?.[key] ?? '') as string

const BASE_PATH = getEnvVar('VITE_BASE_PATH').replace(/\/$/, '')

export function apiPath(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${BASE_PATH}${normalizedEndpoint}`
}
