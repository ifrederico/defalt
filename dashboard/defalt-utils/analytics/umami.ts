import '../types/umami.d.ts'

const DEFAULT_UMAMI_HOST = 'https://cloud.umami.is'

type EventName =
  | 'editor-loaded'
  | 'section-changed'
  | 'export-clicked'
  | 'export-completed'
  | 'export-failed'
  | 'premium-blocked'
  | 'upgrade-clicked'

let initialized = false

export function initUmami(): void {
  if (initialized) return
  if (import.meta.env.DEV) return

  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  if (!websiteId) return

  const host = import.meta.env.VITE_UMAMI_HOST || DEFAULT_UMAMI_HOST
  const script = document.createElement('script')
  script.defer = true
  script.src = `${host}/script.js`
  script.dataset.websiteId = websiteId
  document.head.appendChild(script)

  initialized = true
}

export function trackEvent(
  event: EventName,
  data?: Record<string, string | number | boolean>
): void {
  if (import.meta.env.DEV) return
  window.umami?.track(event, data)
}
