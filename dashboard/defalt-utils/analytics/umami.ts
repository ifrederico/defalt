import '../types/umami.d.ts'

type EventName =
  | 'editor-loaded'
  | 'section-changed'
  | 'export-clicked'
  | 'export-completed'
  | 'export-failed'
  | 'premium-blocked'
  | 'upgrade-clicked'

export function trackEvent(
  event: EventName,
  data?: Record<string, string | number | boolean>
): void {
  if (import.meta.env.DEV) return
  window.umami?.track(event, data)
}
