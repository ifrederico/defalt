/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GHOST_URL?: string
  readonly VITE_GHOST_CONTENT_KEY?: string
  readonly VITE_APP_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_DEV_BYPASS_AUTH?: string
  readonly VITE_SUPPORT_TIP_URL?: string
  readonly VITE_AUTH_SECRET?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
