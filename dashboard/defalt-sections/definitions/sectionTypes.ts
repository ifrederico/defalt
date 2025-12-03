export type SectionCategory = 'template'

export interface SectionConfigSchema {
  [key: string]: unknown
}

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

export interface RenderHtmlOptions {
  padding?: { top: number, bottom: number, left?: number, right?: number }
  pages?: PreviewPageData[]
}

export interface SectionDefinition<TConfig extends SectionConfigSchema = SectionConfigSchema> {
  id: string
  label: string
  description?: string
  category: SectionCategory
  /**
   * Optional structured settings schema to drive UI/validation.
   */
  settingsSchema?: SectionSettingSchema[]
  /**
   * Optional block schema for repeatable blocks.
   */
  blocksSchema?: SectionBlockSchema[]
  defaultVisibility: boolean
  defaultPadding: { top: number, bottom: number, left?: number, right?: number }
  usesUnifiedPadding?: boolean
  premium?: boolean
  createConfig: () => TConfig
  renderHtml: (
    config: TConfig,
    options?: RenderHtmlOptions
  ) => string
}

export interface SectionInstance<TConfig extends SectionConfigSchema = SectionConfigSchema> {
  id: string
  definitionId: string
  label: string
  category: SectionCategory
  config: TConfig
}

export type SectionSettingType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'color'
  | 'checkbox'
  | 'range'
  | 'select'
  | 'url'
  | 'header'
  | 'paragraph'

export type SectionSettingSchema =
  | ({
      type: Exclude<SectionSettingType, 'select' | 'range' | 'header' | 'paragraph'>
      id: string
      label: string
      default?: unknown
      info?: string
    })
  | ({
      type: 'select'
      id: string
      label: string
      default?: string
      options: Array<{ label: string, value: string }>
    })
  | ({
      type: 'range'
      id: string
      label: string
      min: number
      max: number
      step: number
      default: number
    })
  | ({
      type: 'header'
      id: string
      label: string
    })
  | ({
      type: 'paragraph'
      id: string
      label: string
    })

export interface SectionBlockSchema {
  type: string
  name: string
  limit?: number
  settings: SectionSettingSchema[]
}

export function escapeHtml(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    return ''
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitizeHref(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return '#'
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return '#'
  }
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('javascript:')) {
    return '#'
  }
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed
  }
  if (lower.startsWith('//')) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function sanitizeHexColor(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'transparent') {
    return normalized
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(normalized)) {
    if (normalized.length === 4) {
      const r = normalized[1]
      const g = normalized[2]
      const b = normalized[3]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return normalized
  }
  return fallback
}
