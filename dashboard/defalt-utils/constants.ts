export const TIMING = {
  AUTOSAVE_DEBOUNCE_MS: 500,
  SAVE_STATUS_DISPLAY_MS: 2000
}

export const STORAGE_KEYS = {
  // Ghost connection & data source
  GHOST_CONNECTION: 'defalt:ghost-connection',
  DATA_SOURCE: 'ghost-data-source',
  AI_SECTIONS: 'defalt-ai-sections',
  // Workspace state
  CLOUD_LOADED: 'ghost-theme-editor:cloud-loaded',
  LOGIN_TOAST_SHOWN: 'ghost-theme-editor:login-toast-shown',
  PENDING_TOAST: 'ghost-theme-editor:pending-toast',
  CSRF_TOKEN: 'ghost-theme-editor:csrf-token'
}

export const EVENTS = {
  DATA_SOURCE_CHANGE: 'ghost-data-source-change'
}

export const WORKSPACE_STORAGE_PREFIX = 'ghost-theme-editor'

// Preview fallback URL for placeholder data and URL resolution
export const PREVIEW_FALLBACK_URL = 'https://source-newsletter.ghost.io'
