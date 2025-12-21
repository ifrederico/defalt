import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
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
  injectHtmlIntoFrame,
  reorderTemplateInDOM,
  reorderFooterInDOM,
  scrollToSection,
  applyCustomCss,
  syncAnnouncementBars,
  syncTemplateSections,
  updateColorVariables,
  setupSectionSelection,
  setupPreviewNavigation,
  syncSelectedSectionAttribute,
} from './handlebars/domManipulation'
import { applyHeaderCustomizations, type HeaderCustomizationOptions, type StickyHeaderMode } from './handlebars/headerCustomization'
import {
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig,
  type AnnouncementBarInstance
} from '@defalt/utils/config/themeConfig'
import { getBasePath } from '@defalt/utils/env/basePath'
import { sanitizeHexColor, sanitizeToken, sanitizeCustomCss } from '@defalt/utils/security/sanitizers'
import type { SectionInstance } from '@defalt/sections/engine'
import {
  renderSection,
  preloadTemplates,
  getSectionTemplatePath,
  getSectionDefinition,
  sectionDefinitions as engineSectionDefinitions
} from '@defalt/sections/engine'
import { formatInternalTag } from '@defalt/sections/utils/tagUtils'
import {
  resolveContainerPaddingX,
  resolveGhostCardsDefaultTag,
  resolveHeroDefaultTag,
  resolveImageAspectRatio,
  resolveImageColumns,
  resolveImageWithTextDefaultTag,
  toTagFilter
} from '../derived/sectionDerived'
import { getFooterOrder, getTemplateOrder } from '@defalt/utils/config/sectionRegistry'
import { AutoFrame } from '../components/AutoFrame'
import { EditorStyles } from '../components/AutoFrame/EditorStyles'
import { useFrame } from '../components/AutoFrame/useFrame'
import { SelectionOverlay } from '../components/SelectionOverlay'
import { SectionActionBar } from '../components/SectionActionBar'

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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
  sectionPadding?: Record<string, { top: number, bottom: number, left?: number, right?: number }>
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
  onDuplicateSection?: (sectionId: string) => void
  onRemoveSection?: (sectionId: string) => void
  onToggleSectionVisibility?: (sectionId: string) => void
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
  templateOrder = getTemplateOrder('home'),
  footerOrder = getFooterOrder(),
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
  onSectionSelect,
  onDuplicateSection,
  onRemoveSection,
  onToggleSectionVisibility
}: HandlebarsRendererProps) {
  const templateOrderRef = useRef(templateOrder)
  const footerOrderRef = useRef(footerOrder)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [templates, setTemplates] = useState<Record<string, string> | null>(null)
  const [frameHoverSectionId, setFrameHoverSectionId] = useState<string | null>(null)

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
    const defaultAnnouncement = DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0]
    return announcementBars.map((entry) => {
      const bar = normalizeAnnouncementBarConfig(entry.bar ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG, DEFAULT_ANNOUNCEMENT_BAR_CONFIG)
      const content = normalizeAnnouncementContentConfig(entry.content ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG, DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG)
      const announcements = content.announcements.length > 0
        ? content.announcements
        : [defaultAnnouncement]
      return {
        id: entry.id,
        hidden: entry.hidden === true,
        bar,
        content: {
          ...content,
          announcements
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
        setTemplatesReady(true) // Continue anyway; templates load on demand
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
        const paddingControls = sectionDef?.paddingControls ?? 'vertical'
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
              const tags = isPlainRecord(baseConfig.tags) ? baseConfig.tags : {}
              const rawTag = tags.primary
              const internalTag = formatInternalTag(rawTag) || resolveHeroDefaultTag(section.id)
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
              const tags = isPlainRecord(baseConfig.tags) ? baseConfig.tags : {}
              const rawTag = tags.primary
              const internalTag = formatInternalTag(rawTag) || resolveImageWithTextDefaultTag(section.id)
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
	              const tags = isPlainRecord(baseConfig.tags) ? baseConfig.tags : {}
	              const rawTag = tags.primary
	              const internalTag = formatInternalTag(rawTag) || resolveGhostCardsDefaultTag(section.id)
	              const tagFilter = toTagFilter(internalTag)
	              renderConfig.internalTag = internalTag
	              renderConfig.tagFilter = tagFilter
	            }

	            if (section.definitionId === 'ghostGrid') {
	              const tags = isPlainRecord(baseConfig.tags) ? baseConfig.tags : {}
	              const left = formatInternalTag(tags.left) || '#grid-left'
	              const right = formatInternalTag(tags.right) || '#grid-right'
	              const leftFilter = toTagFilter(left)
	              const rightFilter = toTagFilter(right)
              renderConfig.internalTagLeft = left
              renderConfig.internalTagRight = right
	              renderConfig.leftTagFilter = leftFilter
	              renderConfig.rightTagFilter = rightFilter
	              renderConfig.anyTagFilter = `${leftFilter},${rightFilter}`
	            }

	            renderConfig.isPreview = true
	            renderConfig.placeholderImageUrl = `${getBasePath()}/sections/placeholder.jpg`

	            html = await renderSection(
	              section.definitionId,
	              templatePath,
	              renderConfig,
	              { padding, pages: previewPages, applyInlinePadding: false }
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
              // Compute tagFilter for each announcement block
              const announcementsWithTagFilter = bar.content.announcements.map((announcement) => ({
                ...announcement,
                tagFilter: toTagFilter(formatInternalTag(announcement.tag) || '#announcement')
              }))

              const config = {
                sectionId: bar.id,
                width: bar.bar.width,
                backgroundColor: bar.bar.backgroundColor,
                textColor: bar.bar.textColor,
                paddingTop: bar.bar.paddingTop,
                paddingBottom: bar.bar.paddingBottom,
                dividerThickness: bar.bar.dividerThickness,
                dividerColor: bar.bar.dividerColor,
                announcements: announcementsWithTagFilter,
                isPreview: true
              }

              try {
                const html = await renderSection(
                  'announcement-bar',
                  templatePath,
                  config as unknown as Record<string, unknown>,
                  { padding: { top: config.paddingTop, bottom: config.paddingBottom }, pages: previewPages }
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
  }, [templatesReady, sanitizedAnnouncementBars, previewPages])

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
    const normalizeSectionId = (id: string) => id

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
          const footerPath = `${getBasePath()}/themes/source-complete/partials/components/footer.hbs`
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

  const headerOptions = useMemo(() => ({
    stickyHeaderMode,
    showSearch,
    typographyCase,
    sectionPadding,
    sectionMargins,
    subheaderStyle: subheaderStyleForPreview,
    showFeaturedPosts: showFeaturedForPreview,
  }), [stickyHeaderMode, showSearch, typographyCase, sectionPadding, sectionMargins, subheaderStyleForPreview, showFeaturedForPreview])
  const resolvedHoverSectionId = hoveredSectionId ?? frameHoverSectionId
  const overlayLayoutKey = useMemo(() => ({
    sectionPadding,
    sectionMargins,
    announcementBars: renderedAnnouncementBars,
  }), [sectionPadding, sectionMargins, renderedAnnouncementBars])

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
        <AutoFrame
          title="Theme preview"
          style={{ position: 'relative', width: '100%', height: '100%' }}
          iframeStyle={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#ffffff',
            transform: 'none',
            transformOrigin: 'top left'
          }}
        >
          <EditorStyles />
          <PreviewFrameContent
            renderedHtml={renderedHtml}
            templateOrderRef={templateOrderRef}
            footerOrderRef={footerOrderRef}
            headerOptions={headerOptions}
            announcementBars={renderedAnnouncementBars}
            customCss={sanitizedCustomCss}
            customSections={mergedCustomSections}
            selectedSectionId={selectedSectionId ?? null}
            filteredTemplateOrder={filteredTemplateOrder}
            footerOrder={footerOrder}
            sectionIdsForPreview={sectionIdsForPreview}
            onSectionSelect={onSectionSelect}
            onFrameHoverChange={setFrameHoverSectionId}
            scrollToSectionId={scrollToSectionId ?? null}
            onScrollComplete={onScrollComplete}
            onNavigate={onNavigate}
            accentColor={sanitizedAccentColor}
            backgroundColor={sanitizedBackgroundColor}
            pageLayout={pageLayout}
          />
          <SelectionOverlay
            selectedSectionId={selectedSectionId ?? null}
            hoveredSectionId={resolvedHoverSectionId ?? null}
            renderKey={renderedHtml}
            layoutKey={overlayLayoutKey}
          />
          <SectionActionBar
            selectedSectionId={selectedSectionId ?? null}
            hiddenSections={hiddenSections}
            customSectionIds={customTemplateSections.map((section) => section.id)}
            aiSectionIds={aiSections.map((section) => section.id)}
            onToggleVisibility={onToggleSectionVisibility}
            onDuplicateSection={onDuplicateSection}
            onRemoveSection={onRemoveSection}
            renderKey={renderedHtml}
            layoutKey={overlayLayoutKey}
          />
        </AutoFrame>
      </div>
    </div>
  )
}

type PreviewFrameContentProps = {
  renderedHtml: string
  templateOrderRef: MutableRefObject<string[]>
  footerOrderRef: MutableRefObject<string[]>
  headerOptions: HeaderCustomizationOptions
  announcementBars: Array<{ id: string; html: string; hidden: boolean }>
  customCss?: string
  customSections: Array<{ id: string; html: string; hidden: boolean }>
  selectedSectionId: string | null
  filteredTemplateOrder: string[]
  footerOrder: string[]
  sectionIdsForPreview: string[]
  onSectionSelect?: (sectionId: string) => void
  onFrameHoverChange?: (sectionId: string | null) => void
  scrollToSectionId: string | null
  onScrollComplete?: () => void
  onNavigate?: (href: string) => boolean
  accentColor: string
  backgroundColor: string
  pageLayout: 'narrow' | 'normal'
}

function PreviewFrameContent({
  renderedHtml,
  templateOrderRef,
  footerOrderRef,
  headerOptions,
  announcementBars,
  customCss,
  customSections,
  selectedSectionId,
  filteredTemplateOrder,
  footerOrder,
  sectionIdsForPreview,
  onSectionSelect,
  onFrameHoverChange,
  scrollToSectionId,
  onScrollComplete,
  onNavigate,
  accentColor,
  backgroundColor,
  pageLayout,
}: PreviewFrameContentProps) {
  const { document: frameDocument, frameRoot } = useFrame()
  const hasInjectedRef = useRef(false)
  const sectionSelectionCleanupRef = useRef<(() => void) | null>(null)
  const previewNavigationCleanupRef = useRef<(() => void) | null>(null)
  const prevSelectedSectionIdRef = useRef<string | null>(null)

  useEffect(() => {
    hasInjectedRef.current = false
  }, [frameDocument, frameRoot])

  useEffect(() => {
    if (!renderedHtml || !frameDocument || !frameRoot) {
      return
    }
    hasInjectedRef.current = true
    injectHtmlIntoFrame(renderedHtml, frameDocument, frameRoot, {
      templateOrder: templateOrderRef.current,
      footerOrder: footerOrderRef.current,
      headerOptions,
      announcementBars,
      customCss,
      customSections,
      selectedSectionId: selectedSectionId ?? null,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-inject on HTML changes
  }, [renderedHtml, frameDocument, frameRoot])

  useEffect(() => {
    if (!frameDocument) {
      return
    }
    if (previewNavigationCleanupRef.current) {
      previewNavigationCleanupRef.current()
      previewNavigationCleanupRef.current = null
    }
    previewNavigationCleanupRef.current = setupPreviewNavigation(frameDocument, onNavigate)
    return () => {
      if (previewNavigationCleanupRef.current) {
        previewNavigationCleanupRef.current()
        previewNavigationCleanupRef.current = null
      }
    }
  }, [frameDocument, onNavigate])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    const update = () => {
      applyHeaderCustomizations(frameDocument, headerOptions)
      syncAnnouncementBars(frameDocument, announcementBars)
      applyCustomCss(frameDocument, customCss)
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [frameDocument, headerOptions, announcementBars, customCss])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    const update = () => {
      updateColorVariables(frameDocument, accentColor, backgroundColor, pageLayout)
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [frameDocument, accentColor, backgroundColor, pageLayout])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    const update = () => {
      syncTemplateSections(frameDocument, customSections)
      applyHeaderCustomizations(frameDocument, headerOptions)
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [frameDocument, customSections, headerOptions])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    if (win) {
      win.requestAnimationFrame(() => reorderTemplateInDOM(frameDocument, filteredTemplateOrder))
    } else {
      reorderTemplateInDOM(frameDocument, filteredTemplateOrder)
    }
  }, [frameDocument, filteredTemplateOrder])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    if (win) {
      win.requestAnimationFrame(() => reorderFooterInDOM(frameDocument, footerOrder))
    } else {
      reorderFooterInDOM(frameDocument, footerOrder)
    }
  }, [frameDocument, footerOrder])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument || !renderedHtml) return

    if (sectionSelectionCleanupRef.current) {
      sectionSelectionCleanupRef.current()
      sectionSelectionCleanupRef.current = null
    }

    if (onSectionSelect && sectionIdsForPreview.length > 0) {
      sectionSelectionCleanupRef.current = setupSectionSelection(frameDocument, sectionIdsForPreview, onSectionSelect, onFrameHoverChange)
    }

    return () => {
      if (sectionSelectionCleanupRef.current) {
        sectionSelectionCleanupRef.current()
        sectionSelectionCleanupRef.current = null
      }
    }
  }, [frameDocument, renderedHtml, onSectionSelect, onFrameHoverChange, sectionIdsForPreview])

  useEffect(() => {
    if (!frameDocument) return
    syncSelectedSectionAttribute(frameDocument, selectedSectionId ?? null)
  }, [frameDocument, selectedSectionId])

  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return

    const selectionChanged = prevSelectedSectionIdRef.current !== selectedSectionId
    prevSelectedSectionIdRef.current = selectedSectionId ?? null

    if (!selectionChanged || !selectedSectionId) {
      return
    }

    scrollToSection(frameDocument, selectedSectionId)
  }, [frameDocument, selectedSectionId])

  useEffect(() => {
    if (!frameDocument || !scrollToSectionId || !hasInjectedRef.current) return
    scrollToSection(frameDocument, scrollToSectionId)
    onScrollComplete?.()
  }, [frameDocument, scrollToSectionId, onScrollComplete])

  return null
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
