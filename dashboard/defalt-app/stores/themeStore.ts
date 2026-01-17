import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'
import { getBasePath } from '@defalt/utils/env/basePath'
import { logError, logWarning } from '@defalt/utils/logging/errorLogger'

// =============================================================================
// Types
// =============================================================================

interface ThemeState {
  packageJson: string
  basePackageJson: string
  hasOverride: boolean
  isLoaded: boolean
}

interface ThemeActions {
  initialize: () => Promise<void>
  setPackageJson: (value: string) => void
  resetPackageJson: () => void
  updatePackageJson: (updater: (data: Record<string, unknown>) => void) => void
  setCustomFieldValue: (key: string, value: string | boolean, typeHint?: 'select' | 'text' | 'color' | 'boolean') => void
}

type ThemeStore = ThemeState & ThemeActions

// =============================================================================
// Helpers - Pure functions for JSON parsing
// =============================================================================

function parsePackageJson(json: string): Record<string, unknown> | null {
  if (!json) return null
  try {
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function getCustomConfig(parsed: Record<string, unknown> | null): Record<string, Record<string, unknown>> | null {
  if (!parsed) return null
  const config = parsed['config']
  if (!config || typeof config !== 'object') return null
  const custom = (config as Record<string, unknown>)['custom']
  if (!custom || typeof custom !== 'object') return null

  const entries: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(custom as Record<string, unknown>)) {
    if (value && typeof value === 'object') {
      entries[key] = value as Record<string, unknown>
    }
  }
  return entries
}

function getFieldRawValue(customConfig: Record<string, Record<string, unknown>> | null, key: string): unknown {
  if (!customConfig) return undefined
  const field = customConfig[key]
  if (!field) return undefined
  return field.value !== undefined ? field.value : field.default
}

function getFieldOptions(customConfig: Record<string, Record<string, unknown>> | null, key: string): string[] {
  if (!customConfig) return []
  const field = customConfig[key]
  if (!field) return []
  const options = field.options
  if (!Array.isArray(options)) return []
  return options.filter((opt): opt is string => typeof opt === 'string')
}

function getStringValue(customConfig: Record<string, Record<string, unknown>> | null, key: string, defaultValue = ''): string {
  const raw = getFieldRawValue(customConfig, key)
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
  return defaultValue
}

function getBooleanValue(customConfig: Record<string, Record<string, unknown>> | null, key: string, defaultValue = false): boolean {
  const raw = getFieldRawValue(customConfig, key)
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  if (typeof raw === 'number') return raw !== 0
  return defaultValue
}

// =============================================================================
// Store
// =============================================================================

export const useThemeStore = create<ThemeStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    packageJson: '',
    basePackageJson: '',
    hasOverride: false,
    isLoaded: false,

    // Actions
    initialize: async () => {
      try {
        const response = await fetch(`${getBasePath()}/themes/source-complete/package.json`)
        if (!response.ok) throw new Error(`Failed to load package.json (${response.status})`)
        const text = await response.text()
        set({ packageJson: text, basePackageJson: text, isLoaded: true })
      } catch (error) {
        logError(error, { scope: 'themeStore.initialize' })
        const defaultJson = '{\n  "name": "source"\n}'
        set({ packageJson: defaultJson, basePackageJson: defaultJson, isLoaded: true })
      }
    },

    setPackageJson: (value) => {
      set({ packageJson: value, hasOverride: true })
    },

    resetPackageJson: () => {
      const { basePackageJson } = get()
      set({ packageJson: basePackageJson || '{\n  "name": "source"\n}', hasOverride: false })
    },

    updatePackageJson: (updater) => {
      const { packageJson } = get()
      if (!packageJson) {
        logWarning('Attempted to update package.json before loaded', { scope: 'themeStore.updatePackageJson' })
        return
      }
      try {
        const data = JSON.parse(packageJson) as Record<string, unknown>
        updater(data)
        set({ packageJson: JSON.stringify(data, null, 4), hasOverride: true })
      } catch (error) {
        logError(error, { scope: 'themeStore.updatePackageJson' })
      }
    },

    setCustomFieldValue: (key, value, typeHint) => {
      get().updatePackageJson((data) => {
        const configRaw = data['config']
        const config = (typeof configRaw === 'object' && configRaw !== null
          ? { ...(configRaw as Record<string, unknown>) }
          : {}) as Record<string, unknown>
        data['config'] = config

        const customRaw = config['custom']
        const custom = (typeof customRaw === 'object' && customRaw !== null
          ? { ...(customRaw as Record<string, unknown>) }
          : {}) as Record<string, unknown>
        config['custom'] = custom

        const fieldRaw = custom[key]
        const field = (typeof fieldRaw === 'object' && fieldRaw !== null
          ? { ...(fieldRaw as Record<string, unknown>) }
          : {}) as Record<string, unknown>

        if (typeHint && typeof field['type'] !== 'string') {
          field['type'] = typeHint
        }
        field['default'] = value
        custom[key] = field
      })
    },
  }))
)

// =============================================================================
// Selectors - Derived values computed from packageJson
// =============================================================================

const selectParsed = (state: ThemeStore) => parsePackageJson(state.packageJson)
const selectCustomConfig = (state: ThemeStore) => getCustomConfig(selectParsed(state))

// Header & Footer Color
export const useHeaderAndFooterColorOptions = () => useThemeStore(
  useShallow((s) => getFieldOptions(selectCustomConfig(s), 'header_and_footer_color'))
)
export const useHeaderAndFooterColorValue = () => useThemeStore((s) => {
  const options = getFieldOptions(selectCustomConfig(s), 'header_and_footer_color')
  const defaultOpt = options[0] ?? 'Background color'
  const value = getStringValue(selectCustomConfig(s), 'header_and_footer_color', defaultOpt)
  return options.includes(value) ? value : defaultOpt
})

// Title Font
export const useTitleFontOptions = () => useThemeStore(
  useShallow((s) => getFieldOptions(selectCustomConfig(s), 'title_font'))
)
export const useTitleFontValue = () => useThemeStore((s) => {
  const options = getFieldOptions(selectCustomConfig(s), 'title_font')
  const defaultOpt = options[0] ?? 'Modern sans-serif'
  const value = getStringValue(selectCustomConfig(s), 'title_font', defaultOpt)
  return options.includes(value) ? value : defaultOpt
})

// Body Font
export const useBodyFontOptions = () => useThemeStore(
  useShallow((s) => getFieldOptions(selectCustomConfig(s), 'body_font'))
)
export const useBodyFontValue = () => useThemeStore((s) => {
  const options = getFieldOptions(selectCustomConfig(s), 'body_font')
  const defaultOpt = options[0] ?? 'Modern sans-serif'
  const value = getStringValue(selectCustomConfig(s), 'body_font', defaultOpt)
  return options.includes(value) ? value : defaultOpt
})

// Signup
export const useSignupHeadingValue = () => useThemeStore((s) => getStringValue(selectCustomConfig(s), 'signup_heading', ''))
export const useSignupSubheadingValue = () => useThemeStore((s) => getStringValue(selectCustomConfig(s), 'signup_subheading', ''))

// Header Style
export const useHeaderStyleOptions = () => useThemeStore(
  useShallow((s) => getFieldOptions(selectCustomConfig(s), 'header_style'))
)
export const useHeaderStyleValue = () => useThemeStore((s) => {
  const options = getFieldOptions(selectCustomConfig(s), 'header_style')
  const defaultOpt = options[0] ?? 'Landing'
  const value = getStringValue(selectCustomConfig(s), 'header_style', defaultOpt)
  return options.includes(value) ? value : defaultOpt
})

// Header Text
export const useHeaderTextValue = () => useThemeStore((s) => getStringValue(selectCustomConfig(s), 'header_text', ''))

// Boolean toggles
export const useBackgroundImageEnabled = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'background_image', false))
export const useShowFeaturedPosts = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_featured_posts', false))
export const useShowImagesInFeed = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_images_in_feed', true))
export const useShowAuthor = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_author', true))
export const useShowPublishDate = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_publish_date', true))
export const useShowPublicationInfoSidebar = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_publication_info_sidebar', false))
export const useShowPostMetadata = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_post_metadata', true))
export const useEnableDropCapsOnPosts = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'enable_drop_caps_on_posts', false))
export const useShowRelatedArticles = () => useThemeStore((s) => getBooleanValue(selectCustomConfig(s), 'show_related_articles', true))

// Post Feed Style
export const usePostFeedStyleOptions = () => useThemeStore(
  useShallow((s) => getFieldOptions(selectCustomConfig(s), 'post_feed_style'))
)
export const usePostFeedStyleValue = () => useThemeStore((s) => {
  const options = getFieldOptions(selectCustomConfig(s), 'post_feed_style')
  const defaultOpt = options[0] ?? 'List'
  const value = getStringValue(selectCustomConfig(s), 'post_feed_style', defaultOpt)
  return options.includes(value) ? value : defaultOpt
})

// Raw values
export const usePackageJson = () => useThemeStore((s) => s.packageJson)
export const useIsThemeLoaded = () => useThemeStore((s) => s.isLoaded)

// =============================================================================
// Actions - Stable references (don't subscribe to state changes)
// =============================================================================

// Stable action object - created once, uses getState internally
export const themeActions = {
  initialize: () => useThemeStore.getState().initialize(),
  setPackageJson: (v: string) => useThemeStore.getState().setPackageJson(v),
  resetPackageJson: () => useThemeStore.getState().resetPackageJson(),
  setCustomFieldValue: (key: string, value: string | boolean, typeHint?: 'select' | 'text' | 'color' | 'boolean') =>
    useThemeStore.getState().setCustomFieldValue(key, value, typeHint),
  setHeaderAndFooterColor: (v: string) => useThemeStore.getState().setCustomFieldValue('header_and_footer_color', v, 'select'),
  setTitleFont: (v: string) => useThemeStore.getState().setCustomFieldValue('title_font', v, 'select'),
  setBodyFont: (v: string) => useThemeStore.getState().setCustomFieldValue('body_font', v, 'select'),
  setSignupHeading: (v: string) => useThemeStore.getState().setCustomFieldValue('signup_heading', v, 'text'),
  setSignupSubheading: (v: string) => useThemeStore.getState().setCustomFieldValue('signup_subheading', v, 'text'),
  setHeaderStyle: (v: string) => useThemeStore.getState().setCustomFieldValue('header_style', v, 'select'),
  setHeaderText: (v: string) => useThemeStore.getState().setCustomFieldValue('header_text', v, 'text'),
  setBackgroundImageEnabled: (v: boolean) => useThemeStore.getState().setCustomFieldValue('background_image', v, 'boolean'),
  setShowFeaturedPosts: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_featured_posts', v, 'boolean'),
  setPostFeedStyle: (v: string) => useThemeStore.getState().setCustomFieldValue('post_feed_style', v, 'select'),
  setShowImagesInFeed: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_images_in_feed', v, 'boolean'),
  setShowAuthor: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_author', v, 'boolean'),
  setShowPublishDate: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_publish_date', v, 'boolean'),
  setShowPublicationInfoSidebar: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_publication_info_sidebar', v, 'boolean'),
  setShowPostMetadata: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_post_metadata', v, 'boolean'),
  setEnableDropCapsOnPosts: (v: boolean) => useThemeStore.getState().setCustomFieldValue('enable_drop_caps_on_posts', v, 'boolean'),
  setShowRelatedArticles: (v: boolean) => useThemeStore.getState().setCustomFieldValue('show_related_articles', v, 'boolean'),
}

// Hook for components - returns the stable themeActions object
export const useThemeActions = () => themeActions
