import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Handlebars from 'handlebars'
import { registerGhostHelpers } from './handlebars/helpers'
import {
  buildPreviewPosts,
  buildPreviewPages,
  buildTemplateContext,
  buildDataFrame,
  buildPagination,
  resolveSiteUrl,
  resolveSite,
  resolveNavigation,
  buildMeta,
  resolvePageNumber,
  type PageType,
  type PreviewPost,
  type PaginationInfo,
  type PreviewData
} from './handlebars/dataResolvers'
import { loadTemplates, filterTemplatesByVisibility, filterFooterPartial } from './handlebars/templateLoader'
import {
  injectHtmlIntoIframe,
  reorderTemplateInDOM,
  reorderFooterInDOM,
  highlightSection,
  highlightHoveredSection,
  scrollToSection,
  applyCustomCss,
  syncAnnouncementBars,
  syncTemplateSections,
  updateColorVariables,
  setupSectionSelection,
} from './handlebars/domManipulation'
import { applyHeaderCustomizations, type StickyHeaderMode } from './handlebars/headerCustomization'
import {
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig,
  type AnnouncementBarInstance
} from '@defalt/utils/config/themeConfig'
import { BASE_PATH } from '@defalt/utils/env/basePath'
import { sanitizeHexColor, sanitizeToken, sanitizeCustomCss } from '@defalt/utils/security/sanitizers'
import type { SectionInstance } from '@defalt/sections/engine'
import {
  renderSection,
  preloadTemplates,
  getSectionTemplatePath,
  getSectionDefinition,
  sectionDefinitions as engineSectionDefinitions,
  type AnnouncementBarSectionConfig
} from '@defalt/sections/engine'
import { formatInternalTag, toApiTagSlug, parseGhostCardIdSuffix } from '@defalt/sections/utils/tagUtils'

const resolveContainerPaddingX = (contentWidth: unknown) =>
  contentWidth === 'none' ? '0px' : 'var(--container-gap, 24px)'

const resolveImageColumns = (imageWidth: unknown) => {
  if (imageWidth === '2/3') return { imageColumn: '2fr', textColumn: '1fr' }
  if (imageWidth === '3/4') return { imageColumn: '3fr', textColumn: '1fr' }
  return { imageColumn: '1fr', textColumn: '1fr' }
}

const resolveImageAspectRatio = (imageAspect: unknown): string => {
  if (imageAspect === 'square') return '1 / 1'
  if (imageAspect === 'portrait') return '3 / 4'
  if (imageAspect === 'wide') return '16 / 9'
  if (imageAspect === 'tall') return '9 / 16'
  if (imageAspect === 'landscape') return '4 / 3'
  return ''
}

const toTagFilter = (internalTag: string) => `tag:${toApiTagSlug(internalTag)}`

const resolveHeroFallbackTag = (sectionId: string) => {
  const normalized = sectionId.trim().toLowerCase()
  const match = normalized.match(/^(?:hero-defalt|header-defalt|hero)(?:-(\d+))?$/)
  const suffix = match?.[1]
  return suffix ? `#hero-${suffix}` : '#hero'
}

const resolveImageWithTextFallbackTag = (sectionId: string) => {
  const normalized = sectionId.trim().toLowerCase()
  const match = normalized.match(/^image-with-text(?:-(\d+))?$/)
  const suffix = match?.[1]
  return suffix ? `#image-text-${suffix}` : '#image-text'
}

const resolveGhostCardsFallbackTag = (sectionId: string) => {
  const suffix = parseGhostCardIdSuffix(sectionId)
  if (suffix <= 1) return '#cards'
  return `#cards-${suffix}`
}

interface HandlebarsRendererProps {
  accentColor: string
  backgroundColor: string
  pageLayout: 'narrow' | 'normal'
  currentPage: 'home' | 'about' | 'post' | 'page' | 'page2'
  previewData: PreviewData
  navigationLayout?: string
  stickyHeaderMode?: StickyHeaderMode
  showSearch?: boolean
  typographyCase?: 'default' | 'uppercase'
  sectionPadding?: Record<string, { top: number, bottom: number }>
  sectionMargins?: Record<string, { top?: number, bottom?: number }>
  hiddenSections?: Record<string, boolean>
  templateOrder?: string[]
  footerOrder?: string[]
  onLoadingChange?: (isLoading: boolean) => void
  onNavigate?: (href: string) => boolean
  customCss?: string
  customTemplateSections?: SectionInstance[]
  aiSections?: Array<{ id: string, html: string, name?: string, hidden?: boolean }>
  customSettingsOverrides?: Record<string, unknown>
  announcementBars?: AnnouncementBarInstance[]
  selectedSectionId?: string | null
  hoveredSectionId?: string | null
  scrollToSectionId?: string | null
  onScrollComplete?: () => void
  onSectionSelect?: (sectionId: string) => void
}

export function HandlebarsRenderer({
  accentColor,
  backgroundColor,
  pageLayout,
  currentPage,
  previewData,
  navigationLayout = 'Logo in the middle',
  stickyHeaderMode = 'Always',
  showSearch = true,
  typographyCase = 'default',
  sectionPadding = {},
  sectionMargins = {},
  hiddenSections = {},
  templateOrder = ['subheader', 'featured', 'cta', 'main'],
  footerOrder = ['footer_bar', 'footer_signup'],
  onLoadingChange,
  onNavigate,
  customCss,
  customTemplateSections = [],
  aiSections = [],
  customSettingsOverrides,
  announcementBars = [],
  selectedSectionId,
  hoveredSectionId,
  scrollToSectionId,
  onScrollComplete,
  onSectionSelect
}: HandlebarsRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const templateOrderRef = useRef(templateOrder)
  const footerOrderRef = useRef(footerOrder)
  const sectionSelectionCleanupRef = useRef<(() => void) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [templates, setTemplates] = useState<Record<string, string> | null>(null)

  const sanitizedAccentColor = useMemo(
    () => sanitizeHexColor(accentColor, '#AC1E3E'),
    [accentColor]
  )
  const sanitizedBackgroundColor = useMemo(
    () => sanitizeHexColor(backgroundColor, '#ffffff'),
    [backgroundColor]
  )
  const sanitizedNavigationLayout = useMemo(() => {
    const sanitized = sanitizeToken(navigationLayout)
    return sanitized || 'Logo in the middle'
  }, [navigationLayout])
  const sanitizedCustomCss = useMemo(
    () => sanitizeCustomCss(customCss),
    [customCss]
  )
  const sanitizedAnnouncementBars = useMemo(() => {
    const fallbackAnnouncement = DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0]
    return announcementBars.map((entry) => {
      const bar = normalizeAnnouncementBarConfig(entry.bar ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG, DEFAULT_ANNOUNCEMENT_BAR_CONFIG)
      const content = normalizeAnnouncementContentConfig(entry.content ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG, DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG, entry.bar)
      const announcements = content.announcements.length > 0
        ? content.announcements
        : [fallbackAnnouncement]
      return {
        id: entry.id,
        hidden: entry.hidden === true,
        bar,
        content: {
          ...content,
          announcements: announcements.slice(0, 1)
        }
      }
    })
  }, [announcementBars])
  const subheaderStyleForPreview = useMemo(() => {
    const overrideStyle = typeof customSettingsOverrides?.header_style === 'string'
      ? String(customSettingsOverrides.header_style)
      : undefined
    const dataHeader = (previewData as Record<string, unknown> | undefined)?.header
    const previewStyle = dataHeader && typeof dataHeader === 'object' && dataHeader !== null
      ? (dataHeader as Record<string, unknown>).layout
      : undefined
    if (typeof overrideStyle === 'string' && overrideStyle.length) {
      return overrideStyle
    }
    if (typeof previewStyle === 'string' && previewStyle.length) {
      return previewStyle
    }
    return 'Landing'
  }, [customSettingsOverrides, previewData])
  const showFeaturedForPreview = useMemo(() => {
    // Featured posts only apply to Magazine and Highlight layouts
    const isMagazineOrHighlight = subheaderStyleForPreview === 'Magazine' || subheaderStyleForPreview === 'Highlight'

    if (!isMagazineOrHighlight) {
      return false
    }

    // For Magazine/Highlight: use toggle value or default to true
    const override = customSettingsOverrides?.show_featured_posts
    if (typeof override === 'boolean') {
      return override
    }
    return true
  }, [customSettingsOverrides, subheaderStyleForPreview])
  const customSettings = useMemo(
    () => ({
      ...customSettingsOverrides,
      show_featured_posts: showFeaturedForPreview
    }),
    [customSettingsOverrides, showFeaturedForPreview]
  )

  // For Highlight layout, featured is embedded in the header, not a separate section
  // So we filter it out from the template order to prevent it from appearing standalone
  const filteredTemplateOrder = useMemo(() => {
    if (subheaderStyleForPreview === 'Highlight') {
      return templateOrder.filter(id => id !== 'featured')
    }
    return templateOrder
  }, [templateOrder, subheaderStyleForPreview])

  // Build preview pages from Ghost API data (for custom sections like Ghost Cards)
  const previewPages = useMemo(() => buildPreviewPages(previewData), [previewData])

  // Preload section templates on mount
  const [templatesReady, setTemplatesReady] = useState(false)
  useEffect(() => {
    const templates = engineSectionDefinitions
      .filter((def): def is (typeof def & { templatePath: string }) => typeof def.templatePath === 'string' && def.templatePath.length > 0)
      .map(def => ({ sectionId: def.id, templatePath: def.templatePath }))

    if (templates.length === 0) {
      setTemplatesReady(true)
      return
    }

    preloadTemplates(templates)
      .then(() => setTemplatesReady(true))
      .catch((err) => {
        console.warn('[HandlebarsRenderer] Failed to preload section templates:', err)
        setTemplatesReady(true) // Continue anyway, will fall back to legacy
      })
  }, [])

  // Render custom sections using the new engine (async)
  const [renderedTemplateSections, setRenderedTemplateSections] = useState<
    Array<{ id: string; definitionId: string; html: string; hidden: boolean }>
  >([])

  useEffect(() => {
    if (!templatesReady) return

    let cancelled = false

    const renderSections = async () => {
      const results: Array<{ id: string; definitionId: string; html: string; hidden: boolean }> = []

      for (const section of customTemplateSections) {
        if (cancelled) return

        const templatePath = getSectionTemplatePath(section.definitionId)
        const sectionDef = getSectionDefinition(section.definitionId)
        const paddingControls = sectionDef?.paddingControls ?? (sectionDef?.showPaddingControls === false ? 'none' : 'vertical')
        const shouldUseGlobalPadding = paddingControls !== 'none'
        const padding = shouldUseGlobalPadding ? sectionPadding[section.id] : undefined

        let html: string

        if (templatePath) {
          // Use the new engine with HBS templates
          try {
            const baseConfig = section.config as Record<string, unknown>
            const contentWidth = baseConfig.contentWidth
            const containerPaddingX = resolveContainerPaddingX(contentWidth)

            const renderConfig: Record<string, unknown> = {
              ...baseConfig,
              sectionId: section.id,
              containerPaddingX
            }

            if (section.definitionId === 'hero') {
              const rawTag = baseConfig.tag
              const internalTag = formatInternalTag(rawTag) || resolveHeroFallbackTag(section.id)
              const imageOnRight = baseConfig.invert === true || baseConfig.imagePosition === 'right'
              const { imageColumn, textColumn } = resolveImageColumns(baseConfig.imageWidth)
              const imageAspectRatio = resolveImageAspectRatio(baseConfig.imageAspect)
              renderConfig.internalTag = internalTag
              renderConfig.tagFilter = toTagFilter(internalTag)
              renderConfig.imageOnRight = imageOnRight
              renderConfig.imageColumn = imageColumn
              renderConfig.textColumn = textColumn
              renderConfig.imageAspectRatio = imageAspectRatio
            }

            if (section.definitionId === 'image-with-text') {
              const rawTag = baseConfig.tag
              const internalTag = formatInternalTag(rawTag) || resolveImageWithTextFallbackTag(section.id)
              const imageOnRight = baseConfig.invert === true || baseConfig.imagePosition === 'right'
              const { imageColumn, textColumn } = resolveImageColumns(baseConfig.imageWidth)
              const imageAspectRatio = resolveImageAspectRatio(baseConfig.imageAspect)
              renderConfig.internalTag = internalTag
              renderConfig.tagFilter = toTagFilter(internalTag)
              renderConfig.imageOnRight = imageOnRight
              renderConfig.imageColumn = imageColumn
              renderConfig.textColumn = textColumn
              renderConfig.imageAspectRatio = imageAspectRatio
            }

	            if (section.definitionId === 'ghostCards') {
	              const rawTag = baseConfig.tag
	              const internalTag = formatInternalTag(rawTag) || resolveGhostCardsFallbackTag(section.id)
	              const tagFilter = toTagFilter(internalTag)
	              renderConfig.internalTag = internalTag
	              renderConfig.tagFilter = tagFilter
	            }

	            if (section.definitionId === 'ghostGrid') {
	              const left = formatInternalTag(baseConfig.tagLeft) || '#grid-left'
	              const right = formatInternalTag(baseConfig.tagRight) || '#grid-right'
	              const leftFilter = toTagFilter(left)
	              const rightFilter = toTagFilter(right)
              renderConfig.internalTagLeft = left
              renderConfig.internalTagRight = right
	              renderConfig.leftTagFilter = leftFilter
	              renderConfig.rightTagFilter = rightFilter
	              renderConfig.anyTagFilter = `${leftFilter},${rightFilter}`
	            }

	            renderConfig.isPreview = true
	            renderConfig.placeholderImageUrl = `${BASE_PATH}/sections/placeholder.jpg`

	            html = await renderSection(
	              section.definitionId,
	              templatePath,
	              renderConfig,
	              { padding, pages: previewPages }
            )
          } catch (err) {
            console.warn(`[HandlebarsRenderer] Failed to render ${section.definitionId}:`, err)
            html = `<section class="gd-section-error">Failed to render section: ${section.definitionId}</section>`
          }
        } else {
          // No template path found for this section
          console.warn(`[HandlebarsRenderer] No template path found for section: ${section.definitionId}`)
          html = `<section class="gd-section-error">Unknown section: ${section.definitionId}</section>`
        }

        results.push({
          id: section.id,
          definitionId: section.definitionId,
          html,
          hidden: Boolean(hiddenSections[section.id])
        })
      }

      if (!cancelled) {
        setRenderedTemplateSections(results)
      }
    }

    void renderSections()

    return () => {
      cancelled = true
    }
  }, [templatesReady, customTemplateSections, hiddenSections, sectionPadding, previewPages])

  const mergedCustomSections = useMemo(
    () => [
      ...renderedTemplateSections,
      ...aiSections.map((section) => ({
        id: section.id,
        definitionId: 'ai',
        html: section.html,
        hidden: Boolean(hiddenSections[section.id]),
      }))
    ],
    [renderedTemplateSections, aiSections, hiddenSections]
  )

  const [renderedAnnouncementBars, setRenderedAnnouncementBars] = useState<Array<{ id: string; html: string; hidden: boolean }>>([])

  useEffect(() => {
    if (!templatesReady) return

    let cancelled = false

    const renderAnnouncementBars = async () => {
      const templatePath = getSectionTemplatePath('announcement-bar')
      if (!templatePath) {
        console.warn('[HandlebarsRenderer] No template path for announcement-bar')
        if (!cancelled) {
          setRenderedAnnouncementBars([])
        }
        return
      }

      try {
        if (!cancelled) {
          const results = await Promise.all(
            sanitizedAnnouncementBars.map(async (bar) => {
              const config = {
                tag: bar.bar.tag,
                sectionId: bar.id,
                width: bar.bar.width,
                backgroundColor: bar.bar.backgroundColor,
                textColor: bar.bar.textColor,
                paddingTop: bar.bar.paddingTop,
                paddingBottom: bar.bar.paddingBottom,
                dividerThickness: bar.bar.dividerThickness,
                dividerColor: bar.bar.dividerColor,
                announcements: bar.content.announcements
              } satisfies AnnouncementBarSectionConfig & { sectionId: string }

              try {
                const html = await renderSection(
                  'announcement-bar',
                  templatePath,
                  config as unknown as Record<string, unknown>,
                  { padding: { top: config.paddingTop, bottom: config.paddingBottom } }
                )
                return { id: bar.id, html, hidden: bar.hidden }
              } catch (err) {
                console.warn('[HandlebarsRenderer] Failed to render announcement-bar:', err)
                return { id: bar.id, html: '', hidden: bar.hidden }
              }
            })
          )

          if (!cancelled) {
            setRenderedAnnouncementBars(results)
          }
        }
      } catch (err) {
        console.warn('[HandlebarsRenderer] Failed to render announcement-bar:', err)
      }
    }

    void renderAnnouncementBars()

    return () => {
      cancelled = true
    }
  }, [templatesReady, sanitizedAnnouncementBars])

  const resolvedHiddenSections = useMemo(() => {
    const resolved = { ...hiddenSections }
    const mainHidden = Boolean(hiddenSections.main)

    if (mainHidden) {
      if (currentPage === 'about' || currentPage === 'page') {
        resolved.page = true
        resolved['page-content'] = true
      }
      if (currentPage === 'post') {
        resolved.post = true
        resolved['post-article'] = true
        resolved['post-article-header'] = true
        resolved['post-article-title'] = true
        resolved['post-article-tag'] = true
        resolved['post-article-content'] = true
      }
    }

    return resolved
  }, [hiddenSections, currentPage])

  const sectionIdsForPreview = useMemo(() => {
    const normalizeSectionId = (id: string) => {
      const lower = id.toLowerCase()
      if (lower === 'footer_bar' || lower === 'footer-bar') return 'footerBar'
      if (lower === 'footer_signup' || lower === 'footer-signup') return 'footerSignup'
      return id
    }

    const ids = new Set<string>(['header', 'footer'])
    sanitizedAnnouncementBars.forEach((bar) => ids.add(normalizeSectionId(bar.id)))
    filteredTemplateOrder.forEach((id) => ids.add(normalizeSectionId(id)))
    footerOrder.forEach((id) => ids.add(normalizeSectionId(id)))
    renderedTemplateSections.forEach((section) => ids.add(normalizeSectionId(section.id)))
    aiSections.forEach((section) => ids.add(normalizeSectionId(section.id)))
    return Array.from(ids)
  }, [filteredTemplateOrder, footerOrder, renderedTemplateSections, aiSections, sanitizedAnnouncementBars])

  // Keep refs in sync with latest values using useLayoutEffect
  // to ensure they update synchronously before inject effect runs
  useLayoutEffect(() => {
    templateOrderRef.current = filteredTemplateOrder
  }, [filteredTemplateOrder])

  useLayoutEffect(() => {
    footerOrderRef.current = footerOrder
  }, [footerOrder])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      setRenderedHtml('')
      setTemplates(null)

      try {
        const loadedTemplates = await loadTemplates(currentPage)
        if (cancelled) {
          return
        }
        setTemplates(loadedTemplates)
      } catch (err) {
        if (cancelled) {
          return
        }
        console.error('Error loading templates:', err)
        setError(err instanceof Error ? err.message : 'Failed to load templates')
        setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [currentPage])

  // Memoize filtered templates to prevent unnecessary re-renders
  const filteredTemplates = useMemo(() => {
    if (!templates) return null
    return filterTemplatesByVisibility(templates, resolvedHiddenSections)
  }, [templates, resolvedHiddenSections])

  useEffect(() => {
    if (!filteredTemplates) {
      return
    }

    const loadAndRenderTheme = async () => {
      try {
        setError(null)

        // Re-register footer partial with filtered content based on visibility
        // This ensures toggling visibility works in both directions (hide AND show)
        try {
          const footerPath = `${BASE_PATH}/themes/source-complete/partials/components/footer.hbs`
          const response = await fetch(footerPath)
          if (response.ok) {
            const footerContent = await response.text()
            const filteredFooter = filterFooterPartial(footerContent, resolvedHiddenSections)
            Handlebars.registerPartial('components/footer', filteredFooter)
          }
        } catch (err) {
          console.warn('Failed to filter footer partial:', err)
        }

        const siteUrl = resolveSiteUrl(previewData)
        const posts = buildPreviewPosts(previewData, siteUrl)
        const pages = buildPreviewPages(previewData)

        // Prepare helper dependencies
        const siteMeta = resolveSite(previewData, siteUrl)
        const navigationMenus = resolveNavigation(previewData, siteUrl)
        const postsPerPage = previewData?.config?.posts_per_page ?? 12
        const pageNumber = resolvePageNumber(currentPage as PageType)
        const pagination = buildPagination(pageNumber, posts.length, postsPerPage)
        const meta = buildMeta(previewData, siteMeta, currentPage as PageType, siteUrl)
        const baseBodyClass = (() => {
          const classes: string[] = []

          if (currentPage === 'post') {
            classes.push('post-template')
          } else if (currentPage === 'about') {
            classes.push('page-template')
          } else {
            classes.push('home-template')
            if (pagination.page > 1) {
              classes.push('paged')
            }
          }

          // Body class visibility logic removed - sections are now conditionally rendered
          return classes.join(' ')
        })()

        // Register Ghost helpers
        registerGhostHelpers(
          sanitizedAccentColor,
          sanitizedBackgroundColor,
          pageLayout,
          posts,
          pages,
          navigationMenus,
          siteMeta,
          meta,
          baseBodyClass
        )

        // Render the theme
        const html = renderTheme(
          filteredTemplates,
          previewData,
          currentPage,
          posts,
          sanitizedAccentColor,
          sanitizedBackgroundColor,
          pageLayout,
          sanitizedNavigationLayout,
          siteUrl,
          pageNumber,
          customSettings
        )
        setRenderedHtml(html)
        setIsLoading(false)
      } catch (err) {
        console.error('Error rendering theme:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    void loadAndRenderTheme()
  }, [filteredTemplates, sanitizedAccentColor, sanitizedBackgroundColor, pageLayout, sanitizedNavigationLayout, currentPage, previewData, resolvedHiddenSections, customSettings])

  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  // Track if initial injection has happened
  const hasInjectedRef = useRef(false)

  // Effect to inject HTML ONLY when renderedHtml changes (full iframe write)
  useEffect(() => {
    if (!renderedHtml) {
      return
    }
    hasInjectedRef.current = true
    injectHtmlIntoIframe(renderedHtml, iframeRef, {
      templateOrder: templateOrderRef.current,
      footerOrder: footerOrderRef.current,
	      headerOptions: {
	        stickyHeaderMode,
	        showSearch,
	        typographyCase,
	        sectionPadding,
	        sectionMargins,
	        subheaderStyle: subheaderStyleForPreview,
	        showFeaturedPosts: showFeaturedForPreview,
	      },
	      announcementBars: renderedAnnouncementBars,
	      customCss: sanitizedCustomCss,
	      customSections: mergedCustomSections,
	      sectionIds: onSectionSelect ? sectionIdsForPreview : undefined,
      onSelectSection: onSectionSelect,
      selectedSectionId: selectedSectionId ?? null,
      onNavigate,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only full inject on renderedHtml change
  }, [renderedHtml])

  // Effect for incremental header/style updates (no full iframe rewrite)
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    const win = doc.defaultView
    const update = () => {
	      applyHeaderCustomizations(doc, {
	        stickyHeaderMode,
	        showSearch,
	        typographyCase,
	        sectionPadding,
	        sectionMargins,
	        subheaderStyle: subheaderStyleForPreview,
	        showFeaturedPosts: showFeaturedForPreview,
	      })
	      syncAnnouncementBars(doc, renderedAnnouncementBars)
	      applyCustomCss(doc, sanitizedCustomCss)
	    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
	  }, [stickyHeaderMode, showSearch, typographyCase, sectionPadding, sectionMargins, subheaderStyleForPreview, showFeaturedForPreview, renderedAnnouncementBars, sanitizedCustomCss])

  // Effect for incremental color/layout updates (no full iframe rewrite)
  // This prevents scroll jumps when only colors change
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    const win = doc.defaultView
    const update = () => {
      updateColorVariables(doc, sanitizedAccentColor, sanitizedBackgroundColor, pageLayout)
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [sanitizedAccentColor, sanitizedBackgroundColor, pageLayout])

  // Effect to sync custom sections (e.g., after reset or adding/removing sections)
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    const win = doc.defaultView
    const update = () => {
      syncTemplateSections(doc, mergedCustomSections)
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [mergedCustomSections])

  // Separate effect to reorder template when templateOrder changes (without re-rendering)
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    const win = doc.defaultView
    if (win) {
      win.requestAnimationFrame(() => reorderTemplateInDOM(doc, filteredTemplateOrder))
    } else {
      reorderTemplateInDOM(doc, filteredTemplateOrder)
    }
  }, [filteredTemplateOrder])

  // Separate effect to reorder footer when footerOrder changes (without re-rendering)
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    const win = doc.defaultView
    if (win) {
      win.requestAnimationFrame(() => reorderFooterInDOM(doc, footerOrder))
    } else {
      reorderFooterInDOM(doc, footerOrder)
    }
  }, [footerOrder])

  // Effect to update section selection callback when it changes
  // This prevents stale closures where the old callback captures outdated state
  useEffect(() => {
    if (!hasInjectedRef.current) return
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || doc.readyState !== 'complete') return

    // Clean up previous section selection handlers
    if (sectionSelectionCleanupRef.current) {
      sectionSelectionCleanupRef.current()
      sectionSelectionCleanupRef.current = null
    }

    // Set up new section selection with updated callback
    if (onSectionSelect && sectionIdsForPreview.length > 0) {
      sectionSelectionCleanupRef.current = setupSectionSelection(doc, sectionIdsForPreview, onSectionSelect)
    }
  }, [onSectionSelect, sectionIdsForPreview])

  // Track previous selection to determine if we should scroll
  const prevSelectedSectionIdRef = useRef<string | null>(null)

  // Effect to highlight selected section
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    const win = doc.defaultView

    // Only scroll when selection actually changes, not on padding/margin updates
    const selectionChanged = prevSelectedSectionIdRef.current !== selectedSectionId
    prevSelectedSectionIdRef.current = selectedSectionId ?? null

    // Wait for document to be ready
    const applyHighlight = () => {
      highlightSection(doc, selectedSectionId ?? null, { scroll: selectionChanged })
    }

    let cleanupLoad: (() => void) | null = null

    if (doc.readyState === 'complete') {
      if (win) {
        win.requestAnimationFrame(applyHighlight)
      } else {
        applyHighlight()
      }
    } else {
      const handleLoad = () => applyHighlight()
      iframe.addEventListener('load', handleLoad, { once: true })
      cleanupLoad = () => iframe.removeEventListener('load', handleLoad)
    }

    if (win) {
      win.addEventListener('resize', applyHighlight)
    }

    return () => {
      cleanupLoad?.()
      if (win) {
        win.removeEventListener('resize', applyHighlight)
      }
    }
  }, [selectedSectionId])

  // Effect to highlight hovered section from sidebar
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const applyHoverHighlight = () => {
      highlightHoveredSection(doc, hoveredSectionId ?? null)
    }

    if (doc.readyState === 'complete') {
      applyHoverHighlight()
    } else {
      iframe.addEventListener('load', applyHoverHighlight, { once: true })
      return () => iframe.removeEventListener('load', applyHoverHighlight)
    }
  }, [hoveredSectionId])

  // Effect to scroll to section on delayed hover (1.5s like Shopify)
  useEffect(() => {
    if (!scrollToSectionId) return

    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const doScroll = () => {
      scrollToSection(doc, scrollToSectionId)
      onScrollComplete?.()
    }

    if (doc.readyState === 'complete') {
      doScroll()
    } else {
      iframe.addEventListener('load', doScroll, { once: true })
      return () => iframe.removeEventListener('load', doScroll)
    }
  }, [scrollToSectionId, onScrollComplete])

  // Cleanup section selection handlers on unmount
  useEffect(() => {
    return () => {
      if (sectionSelectionCleanupRef.current) {
        sectionSelectionCleanupRef.current()
        sectionSelectionCleanupRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: 'rgba(255,255,255,0.9)', color: 'red' }}>
          <p>Error loading theme: {error}</p>
        </div>
      )}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px 4px 0 0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <iframe
          ref={iframeRef}
          title="Theme preview"
          style={{
            position: 'absolute',
            width: '115%',
            height: '115%',
            border: 'none',
            backgroundColor: '#ffffff',
            transform: 'scale(0.86957)',
            transformOrigin: 'top left'
          }}
        />
      </div>
    </div>
  )
}

// Helper to render the theme
function renderTheme(
  templates: Record<string, string>,
  previewData: PreviewData,
  currentPage: string,
  posts: PreviewPost[],
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal',
  navigationLayout: string,
  siteUrl: string,
  pageNumber: number,
  customSettingsOverrides: Record<string, unknown>
): string {
  // Compile templates
  const defaultTemplate = Handlebars.compile(templates.default)
  const postsPerPage = previewData?.config?.posts_per_page ?? 12
  const pagination = buildPagination(pageNumber, posts.length, postsPerPage)
  const pagedPosts = posts  // Show all posts on every page in preview mode
  const renderContext = buildTemplateContext(previewData, currentPage, pagedPosts, siteUrl, pagination)
  const dataFrame = buildDataFrame(
    previewData,
    pagedPosts,
    accentColor,
    backgroundColor,
    pageLayout,
    navigationLayout,
    siteUrl,
    currentPage,
    customSettingsOverrides
  )

  let pageTemplate: HandlebarsTemplateDelegate | null = null
  if (currentPage === 'home' && templates.home) {
    pageTemplate = Handlebars.compile(templates.home)
  } else if (currentPage === 'page2' && templates.index) {
    pageTemplate = Handlebars.compile(templates.index)
  } else if (currentPage === 'about' && templates.page) {
    pageTemplate = Handlebars.compile(templates.page)
  } else if (currentPage === 'post' && templates.post) {
    pageTemplate = Handlebars.compile(templates.post)
  }

  if (!pageTemplate) {
    return ''
  }

  // Render page content
  const pageContent = pageTemplate(renderContext, { data: dataFrame })

  // Inject page content into default layout
  const fullHtml = defaultTemplate({
    ...renderContext,
    body: pageContent
  }, { data: dataFrame })

  return fullHtml
}

// Export types for use in other files
export type { PageType, PreviewPost, PaginationInfo, StickyHeaderMode }
