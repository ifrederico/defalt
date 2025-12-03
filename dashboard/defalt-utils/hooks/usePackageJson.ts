import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { logError, logWarning } from '../logging/errorLogger.js'

// Get base path from Vite env, strip trailing slash for concatenation
const BASE_PATH = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')

export function usePackageJson() {
  const [packageJson, setPackageJsonState] = useState('')
  const hasOverrideRef = useRef(false)

  const setPackageJson = useCallback((value: string) => {
    hasOverrideRef.current = true
    setPackageJsonState(value)
  }, [])

  // Load package.json from theme
  useEffect(() => {
    const controller = new AbortController()
    let isActive = true
    const loadPackageJson = async () => {
      try {
        const response = await fetch(`${BASE_PATH}/themes/source-complete/package.json`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Failed to load package.json (${response.status})`)
        }
        const text = await response.text()
        if (!hasOverrideRef.current && isActive) {
          setPackageJsonState(text)
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        logError(error, { scope: 'usePackageJson.loadPackageJson' })
        if (!hasOverrideRef.current && isActive) {
          setPackageJsonState('{\n  "name": "source"\n}')
        }
      }
    }
    void loadPackageJson()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  const parsedPackageJson = useMemo<Record<string, unknown> | null>(() => {
    if (!packageJson) {
      return null
    }

    try {
      return JSON.parse(packageJson) as Record<string, unknown>
    } catch (error) {
      logError(error, { scope: 'usePackageJson.parse' })
      return null
    }
  }, [packageJson])

  const customConfig = useMemo<Record<string, Record<string, unknown>> | null>(() => {
    if (!parsedPackageJson) {
      return null
    }

    const config = (parsedPackageJson as Record<string, unknown>)['config']
    if (!config || typeof config !== 'object' || config === null) {
      return null
    }

    const custom = (config as Record<string, unknown>)['custom']
    if (!custom || typeof custom !== 'object' || custom === null) {
      return null
    }

    const entries: Record<string, Record<string, unknown>> = {}
    for (const [key, value] of Object.entries(custom)) {
      if (value && typeof value === 'object') {
        entries[key] = value as Record<string, unknown>
      }
    }

    return entries
  }, [parsedPackageJson])

  const getCustomField = useCallback((key: string) => {
    if (!customConfig) {
      return null
    }

    const field = customConfig[key]
    if (!field || typeof field !== 'object') {
      return null
    }

    return field
  }, [customConfig])

  const getCustomFieldRawValue = useCallback((key: string) => {
    const field = getCustomField(key)
    if (!field) {
      return undefined
    }

    const fieldRecord = field as Record<string, unknown>
    if (fieldRecord.value !== undefined) {
      return fieldRecord.value
    }

    return fieldRecord.default
  }, [getCustomField])

  const getCustomFieldOptions = useCallback((key: string) => {
    const field = getCustomField(key)
    if (!field) {
      return [] as string[]
    }

    const options = (field as Record<string, unknown>).options
    if (!Array.isArray(options)) {
      return []
    }

    return options.filter((option): option is string => typeof option === 'string')
  }, [getCustomField])

  const getStringFieldValue = useCallback((key: string, fallback = '') => {
    const raw = getCustomFieldRawValue(key)
    if (typeof raw === 'string') {
      return raw
    }

    if (typeof raw === 'number' || typeof raw === 'boolean') {
      return String(raw)
    }

    return fallback
  }, [getCustomFieldRawValue])

  const getBooleanFieldValue = useCallback((key: string, fallback = false) => {
    const raw = getCustomFieldRawValue(key)
    if (typeof raw === 'boolean') {
      return raw
    }

    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase()
      if (normalized === 'true') {
        return true
      }
      if (normalized === 'false') {
        return false
      }
    }

    if (typeof raw === 'number') {
      return raw !== 0
    }

    return fallback
  }, [getCustomFieldRawValue])

  const updatePackageJson = useCallback((updater: (data: Record<string, unknown>) => void) => {
    hasOverrideRef.current = true
    setPackageJsonState((prev) => {
      if (!prev) {
        logWarning('Attempted to update package.json before it was loaded.', { scope: 'usePackageJson.updatePackageJson' })
        return prev
      }

      let data: Record<string, unknown>

      try {
        data = JSON.parse(prev) as Record<string, unknown>
      } catch (error) {
        logError(error, { scope: 'usePackageJson.updatePackageJson.parse' })
        return prev
      }

      updater(data)
      return JSON.stringify(data, null, 4)
    })
  }, [])

  const setCustomFieldValue = useCallback((key: string, value: string | boolean, typeHint?: 'select' | 'text' | 'color' | 'boolean') => {
    updatePackageJson((data) => {
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
  }, [updatePackageJson])

  const navigationLayoutConfig = useMemo<Record<string, unknown> | null>(() => {
    const field = getCustomField('navigation_layout')
    return field ? field : null
  }, [getCustomField])

  const navigationLayoutOptions = useMemo<string[]>(() => {
    if (!navigationLayoutConfig) {
      return []
    }

    const options = navigationLayoutConfig['options']
    if (!Array.isArray(options)) {
      return []
    }

    return options.filter((option): option is string => typeof option === 'string')
  }, [navigationLayoutConfig])

  const navigationLayoutValue = useMemo(() => {
    if (!navigationLayoutConfig) {
      return ''
    }

    const defaultValue = navigationLayoutConfig['default']
    if (typeof defaultValue === 'string') {
      return defaultValue
    }

    const value = navigationLayoutConfig['value']
    if (typeof value === 'string') {
      return value
    }

    return ''
  }, [navigationLayoutConfig])

  const effectiveNavigationLayoutValue = useMemo(() => {
    if (navigationLayoutValue) {
      return navigationLayoutValue
    }

    return navigationLayoutOptions[0] ?? 'Logo in the middle'
  }, [navigationLayoutOptions, navigationLayoutValue])

  const headerSettingsError = useMemo(() => {
    if (!packageJson) {
      return 'package.json has not been loaded yet.'
    }

    if (!parsedPackageJson) {
      return 'Unable to parse package.json. Fix the JSON in the Code tab to edit header settings.'
    }

    if (!navigationLayoutConfig) {
      return 'Navigation layout setting is missing from package.json.'
    }

    if (navigationLayoutOptions.length === 0) {
      return 'Navigation layout setting has no options defined in package.json.'
    }

    return null
  }, [packageJson, parsedPackageJson, navigationLayoutConfig, navigationLayoutOptions])

  const handleHeaderNavigationLayoutChange = useCallback((nextValue: string) => {
    updatePackageJson((data) => {
      const configRaw = data['config']
      const config = (typeof configRaw === 'object' && configRaw !== null ? configRaw : {}) as Record<string, unknown>
      data['config'] = config

      const customRaw = config['custom']
      const custom = (typeof customRaw === 'object' && customRaw !== null ? customRaw : {}) as Record<string, unknown>
      config['custom'] = custom

      const navigationLayoutRaw = custom['navigation_layout']
      const navigationLayout = (typeof navigationLayoutRaw === 'object' && navigationLayoutRaw !== null ? navigationLayoutRaw : {}) as Record<string, unknown>
      custom['navigation_layout'] = navigationLayout

      navigationLayout['default'] = nextValue
    })
  }, [updatePackageJson])

  const headerAndFooterColorOptions = useMemo(() => getCustomFieldOptions('header_and_footer_color'), [getCustomFieldOptions])
  const headerAndFooterColorValue = useMemo(() => {
    const fallback = headerAndFooterColorOptions[0] ?? 'Background color'
    const value = getStringFieldValue('header_and_footer_color', fallback)
    return headerAndFooterColorOptions.includes(value) ? value : fallback
  }, [getStringFieldValue, headerAndFooterColorOptions])
  const handleHeaderAndFooterColorChange = useCallback((value: string) => {
    setCustomFieldValue('header_and_footer_color', value, 'select')
  }, [setCustomFieldValue])

  const titleFontOptions = useMemo(() => getCustomFieldOptions('title_font'), [getCustomFieldOptions])
  const titleFontValue = useMemo(() => {
    const fallback = titleFontOptions[0] ?? 'Modern sans-serif'
    const value = getStringFieldValue('title_font', fallback)
    return titleFontOptions.includes(value) ? value : fallback
  }, [getStringFieldValue, titleFontOptions])
  const handleTitleFontChange = useCallback((value: string) => {
    setCustomFieldValue('title_font', value, 'select')
  }, [setCustomFieldValue])

  const bodyFontOptions = useMemo(() => getCustomFieldOptions('body_font'), [getCustomFieldOptions])
  const bodyFontValue = useMemo(() => {
    const fallback = bodyFontOptions[0] ?? 'Modern sans-serif'
    const value = getStringFieldValue('body_font', fallback)
    return bodyFontOptions.includes(value) ? value : fallback
  }, [getStringFieldValue, bodyFontOptions])
  const handleBodyFontChange = useCallback((value: string) => {
    setCustomFieldValue('body_font', value, 'select')
  }, [setCustomFieldValue])


  const signupHeadingValue = useMemo(() => getStringFieldValue('signup_heading', ''), [getStringFieldValue])
  const handleSignupHeadingChange = useCallback((value: string) => {
    setCustomFieldValue('signup_heading', value, 'text')
  }, [setCustomFieldValue])

  const signupSubheadingValue = useMemo(() => getStringFieldValue('signup_subheading', ''), [getStringFieldValue])
  const handleSignupSubheadingChange = useCallback((value: string) => {
    setCustomFieldValue('signup_subheading', value, 'text')
  }, [setCustomFieldValue])

  const subheaderStyleOptions = useMemo(() => getCustomFieldOptions('header_style'), [getCustomFieldOptions])
  const subheaderStyleValue = useMemo(() => {
    const fallback = subheaderStyleOptions[0] ?? 'Landing'
    const value = getStringFieldValue('header_style', fallback)
    return subheaderStyleOptions.includes(value) ? value : fallback
  }, [getStringFieldValue, subheaderStyleOptions])
  const handleSubheaderStyleChange = useCallback((value: string) => {
    setCustomFieldValue('header_style', value, 'select')
  }, [setCustomFieldValue])

  const headerTextValue = useMemo(() => getStringFieldValue('header_text', ''), [getStringFieldValue])
  const handleHeaderTextChange = useCallback((value: string) => {
    setCustomFieldValue('header_text', value, 'text')
  }, [setCustomFieldValue])

  const backgroundImageEnabled = useMemo(() => getBooleanFieldValue('background_image', true), [getBooleanFieldValue])
  const handleBackgroundImageToggle = useCallback((value: boolean) => {
    setCustomFieldValue('background_image', value, 'boolean')
  }, [setCustomFieldValue])

  const showFeaturedPosts = useMemo(() => getBooleanFieldValue('show_featured_posts', false), [getBooleanFieldValue])
  const handleShowFeaturedPostsToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_featured_posts', value, 'boolean')
  }, [setCustomFieldValue])

  const postFeedStyleOptions = useMemo(() => getCustomFieldOptions('post_feed_style'), [getCustomFieldOptions])
  const postFeedStyleValue = useMemo(() => {
    const fallback = postFeedStyleOptions[0] ?? 'List'
    const value = getStringFieldValue('post_feed_style', fallback)
    return postFeedStyleOptions.includes(value) ? value : fallback
  }, [getStringFieldValue, postFeedStyleOptions])
  const handlePostFeedStyleChange = useCallback((value: string) => {
    setCustomFieldValue('post_feed_style', value, 'select')
  }, [setCustomFieldValue])

  const showImagesInFeed = useMemo(() => getBooleanFieldValue('show_images_in_feed', true), [getBooleanFieldValue])
  const handleShowImagesInFeedToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_images_in_feed', value, 'boolean')
  }, [setCustomFieldValue])

  const showAuthor = useMemo(() => getBooleanFieldValue('show_author', true), [getBooleanFieldValue])
  const handleShowAuthorToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_author', value, 'boolean')
  }, [setCustomFieldValue])

  const showPublishDate = useMemo(() => getBooleanFieldValue('show_publish_date', true), [getBooleanFieldValue])
  const handleShowPublishDateToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_publish_date', value, 'boolean')
  }, [setCustomFieldValue])

  const showPublicationInfoSidebar = useMemo(() => getBooleanFieldValue('show_publication_info_sidebar', false), [getBooleanFieldValue])
  const handleShowPublicationInfoSidebarToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_publication_info_sidebar', value, 'boolean')
  }, [setCustomFieldValue])

  const showPostMetadata = useMemo(() => getBooleanFieldValue('show_post_metadata', true), [getBooleanFieldValue])
  const handleShowPostMetadataToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_post_metadata', value, 'boolean')
  }, [setCustomFieldValue])

  const enableDropCapsOnPosts = useMemo(() => getBooleanFieldValue('enable_drop_caps_on_posts', false), [getBooleanFieldValue])
  const handleEnableDropCapsOnPostsToggle = useCallback((value: boolean) => {
    setCustomFieldValue('enable_drop_caps_on_posts', value, 'boolean')
  }, [setCustomFieldValue])

  const showRelatedArticles = useMemo(() => getBooleanFieldValue('show_related_articles', true), [getBooleanFieldValue])
  const handleShowRelatedArticlesToggle = useCallback((value: boolean) => {
    setCustomFieldValue('show_related_articles', value, 'boolean')
  }, [setCustomFieldValue])

  return {
    packageJson,
    setPackageJson,
    parsedPackageJson,
    navigationLayoutConfig,
    navigationLayoutOptions,
    navigationLayoutValue,
    effectiveNavigationLayoutValue,
    headerSettingsError,
    updatePackageJson,
    handleHeaderNavigationLayoutChange,
    headerAndFooterColorOptions,
    headerAndFooterColorValue,
    handleHeaderAndFooterColorChange,
    titleFontOptions,
    titleFontValue,
    handleTitleFontChange,
    bodyFontOptions,
    bodyFontValue,
    handleBodyFontChange,
    signupHeadingValue,
    handleSignupHeadingChange,
    signupSubheadingValue,
    handleSignupSubheadingChange,
    subheaderStyleOptions,
    subheaderStyleValue,
    handleSubheaderStyleChange,
    headerTextValue,
    handleHeaderTextChange,
    backgroundImageEnabled,
    handleBackgroundImageToggle,
    showFeaturedPosts,
    handleShowFeaturedPostsToggle,
    postFeedStyleOptions,
    postFeedStyleValue,
    handlePostFeedStyleChange,
    showImagesInFeed,
    handleShowImagesInFeedToggle,
    showAuthor,
    handleShowAuthorToggle,
    showPublishDate,
    handleShowPublishDateToggle,
    showPublicationInfoSidebar,
    handleShowPublicationInfoSidebarToggle,
    showPostMetadata,
    handleShowPostMetadataToggle,
    enableDropCapsOnPosts,
    handleEnableDropCapsOnPostsToggle,
    showRelatedArticles,
    handleShowRelatedArticlesToggle,
  }
}
