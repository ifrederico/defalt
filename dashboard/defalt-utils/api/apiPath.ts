/**
 * Get the API base path for fetch calls.
 * Uses VITE_BASE_PATH to handle deployments under subpaths (e.g., /app/).
 */

import { withBasePath } from '../env/basePath.js'

export function apiPath(endpoint: string): string {
  return withBasePath(endpoint)
}
