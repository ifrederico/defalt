/**
 * Preview Types
 *
 * Types shared between preview rendering + section utilities.
 *
 * IMPORTANT: Keep this file free of `import.meta.glob` imports so it can be used
 * from Node-side tooling (exportTheme, Vite plugin) without pulling in the
 * section registry.
 */

export interface PreviewPageData {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  html?: string
  excerpt?: string
  custom_excerpt?: string
  tags?: Array<{ name?: string; slug?: string; visibility?: string }>
}

