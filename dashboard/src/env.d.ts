/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GHOST_URL?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_DEV_BYPASS_AUTH?: string
  readonly VITE_UMAMI_WEBSITE_ID?: string
  readonly VITE_UMAMI_HOST?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
