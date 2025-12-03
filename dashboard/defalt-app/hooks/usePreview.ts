import { useState, useMemo, useCallback, useEffect } from 'react'
import { previewHomeData, previewAboutData, previewPostData } from '@defalt/rendering/preview-data/dataPreview'
import type { PreviewData } from '@defalt/rendering/custom-source/handlebars/dataResolvers'
import {
  fetchGhostPosts,
  fetchGhostPages,
  fetchGhostSettings,
  hasGhostCredentials,
  transformGhostPostsToHomeData,
  transformGhostPostToPostData,
  transformGhostPageToPageData
} from '@defalt/utils/ghost'
import { logError } from '@defalt/utils/logging/errorLogger'

const GHOST_FETCH_TIMEOUT_MS = 20000
const DATA_SOURCE_KEY = 'ghost-data-source'

function getStoredDataSource(): string | null {
  try {
    return localStorage.getItem(DATA_SOURCE_KEY)
  } catch {
    return null
  }
}

function setStoredDataSource(source: string): void {
  try {
    localStorage.setItem(DATA_SOURCE_KEY, source)
  } catch {
    // Storage may be unavailable in private browsing
  }
}

export type PreviewPage = 'home' | 'about' | 'post' | 'page2'
export type PreviewDataSource = 'placeholder' | 'ghost'

const previewDataMap: Record<PreviewPage, PreviewData> = {
  home: previewHomeData as PreviewData,
  about: previewAboutData as PreviewData,
  post: previewPostData as PreviewData,
  page2: previewHomeData as PreviewData
}

export type GhostPostItem = {
  id: string
  title: string
  slug: string
}

export type PreviewZoom = 50 | 75 | 100 | 125 | 150

export function usePreview() {
  const [previewPage, setPreviewPage] = useState<PreviewPage>('home')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>(100)
  const [previewIsLoading, setPreviewIsLoading] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)
  const [dataSource, setDataSource] = useState<PreviewDataSource>('placeholder')
  const [ghostData, setGhostData] = useState<PreviewData | null>(null)
  const [ghostDataLoading, setGhostDataLoading] = useState(false)
  const [ghostDataError, setGhostDataError] = useState<string | null>(null)
  const [hasGhostCreds, setHasGhostCreds] = useState(false)
  const [ghostRefreshKey, setGhostRefreshKey] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [lastGhostFetch, setLastGhostFetch] = useState<Date | null>(null)

  // Post/page selection for preview
  const [selectedPostIndex, setSelectedPostIndex] = useState(0)
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [availablePosts, setAvailablePosts] = useState<GhostPostItem[]>([])
  const [availablePages, setAvailablePages] = useState<GhostPostItem[]>([])

  // Check if user has Ghost credentials on mount and load data source preference
  useEffect(() => {
    let isMounted = true

    // Check localStorage first for immediate loading state
    const storedSource = getStoredDataSource()
    if (storedSource === 'ghost') {
      // Show loading immediately if we know we'll be fetching ghost data
      setGhostDataLoading(true)
    }

    const checkCredentials = async () => {
      try {
        const hasCreds = await hasGhostCredentials()
        if (isMounted) {
          setHasGhostCreds(hasCreds)
          if (storedSource === 'ghost' && hasCreds) {
            setDataSource('ghost')
          } else if (hasCreds && storedSource === null) {
            // Auto-switch to ghost if credentials exist and no preference set
            setDataSource('ghost')
            setGhostDataLoading(true)
            setStoredDataSource('ghost')
          } else {
            // No ghost data to fetch, stop loading
            setGhostDataLoading(false)
          }
          setIsInitializing(false)
        }
      } catch (error) {
        logError(error, { scope: 'usePreview.checkCredentials' })
        if (isMounted) {
          setGhostDataLoading(false)
          setIsInitializing(false)
        }
      }
    }
    void checkCredentials()
    return () => {
      isMounted = false
    }
  }, [])

  // Listen for data source changes from Account Settings
  useEffect(() => {
    const handleSourceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: 'ghost' | 'placeholder' }>
      const nextSource = customEvent.detail.source
      if (nextSource === 'placeholder') {
        setDataSource(nextSource)
        setGhostData(null)
        setGhostDataError(null)
        setGhostDataLoading(false)
      } else if (dataSource !== 'ghost') {
        // Only trigger loading if actually switching to ghost
        setDataSource(nextSource)
        setGhostDataLoading(true)
        setGhostData(null)
        setGhostDataError(null)
      }
      // If already 'ghost', ignore - already connected
    }

    const handleRefresh = () => {
      if (dataSource === 'ghost') {
        setGhostDataLoading(true)
        setGhostDataError(null)
        setGhostData(null)
        setGhostRefreshKey((k) => k + 1)
      }
    }

    window.addEventListener('ghost-data-source-change', handleSourceChange)
    window.addEventListener('ghost-data-refresh', handleRefresh)

    return () => {
      window.removeEventListener('ghost-data-source-change', handleSourceChange)
      window.removeEventListener('ghost-data-refresh', handleRefresh)
    }
  }, [dataSource])

  // Fetch Ghost data when data source changes to 'ghost' or when page changes
  useEffect(() => {
    if (dataSource !== 'ghost') {
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GHOST_FETCH_TIMEOUT_MS)

    const fetchData = async () => {
      setGhostDataLoading(true)
      setGhostDataError(null)

      try {
        // Fetch settings, posts, pages (all for selector), and pages (with internal tags) in parallel
        const [settingsResponse, postsResponse, allPagesResponse, internalPagesResponse] = await Promise.all([
          fetchGhostSettings(),
          // Include html for post content rendering
          fetchGhostPosts({ limit: 15, include: 'authors,tags,html' }),
          // Fetch all pages for page preview selector
          fetchGhostPages({ limit: 50, include: 'html' }).catch(() => ({ pages: [] })),
          // Fetch pages with internal tags for Ghost Cards, Image with Text, Ghost Grid sections
          // Using tag:[slug1,slug2] syntax for OR matching
          fetchGhostPages({
            limit: 50,
            include: 'tags,html',
            filter: 'tag:[hash-announcement-bar,hash-ghost-card,hash-ghost-card-2,hash-ghost-card-3,hash-ghost-card-4,hash-ghost-card-5,hash-image-with-text,hash-image-with-text-2,hash-image-with-text-3,hash-image-with-text-4,hash-image-with-text-5,hash-ghost-grid-1,hash-ghost-grid-2,hash-ghost-grid-3,hash-ghost-grid-4,hash-ghost-grid-5,hash-ghost-grid-6,hash-ghost-grid-7,hash-ghost-grid-8,hash-ghost-grid-9,hash-ghost-grid-10]'
          }).catch(() => ({ pages: [] }))
        ])

        if (controller.signal.aborted) return

        const settings = settingsResponse.settings

        // Store available posts for selection dropdown
        if (postsResponse.posts && postsResponse.posts.length > 0) {
          const postItems: GhostPostItem[] = postsResponse.posts.map((p) => ({
            id: p.id,
            title: p.title || 'Untitled',
            slug: p.slug || ''
          }))
          setAvailablePosts(postItems)
        }

        // Store available pages for selection dropdown (actual Ghost pages)
        if (allPagesResponse.pages && allPagesResponse.pages.length > 0) {
          const pageItems: GhostPostItem[] = allPagesResponse.pages.map((p) => ({
            id: p.id,
            title: p.title || 'Untitled',
            slug: p.slug || ''
          }))
          setAvailablePages(pageItems)
        }

        // Transform based on page type
        let transformedData: PreviewData

        if (previewPage === 'home' || previewPage === 'page2') {
          transformedData = transformGhostPostsToHomeData(postsResponse, settings)
        } else if (previewPage === 'post') {
          // Use selected post for preview
          const safeIndex = Math.min(selectedPostIndex, postsResponse.posts.length - 1)
          const selectedPost = postsResponse.posts[Math.max(0, safeIndex)]
          if (selectedPost) {
            // Get related posts excluding the selected one (up to 4)
            const relatedPosts = postsResponse.posts.filter((_, i) => i !== safeIndex).slice(0, 4)
            transformedData = transformGhostPostToPostData(selectedPost, relatedPosts, settings)
          } else {
            throw new Error('No posts found in your Ghost blog')
          }
        } else if (previewPage === 'about') {
          // Use selected page for preview (from actual Ghost pages)
          const pagesArray = allPagesResponse.pages || []
          if (pagesArray.length > 0) {
            const safeIndex = Math.min(selectedPageIndex, pagesArray.length - 1)
            const selectedPage = pagesArray[Math.max(0, safeIndex)]
            transformedData = transformGhostPageToPageData(selectedPage, settings)
          } else {
            throw new Error('No pages found in your Ghost blog')
          }
        } else {
          transformedData = transformGhostPostsToHomeData(postsResponse, settings)
        }

        // Add pages with internal tags for section previews
        if (internalPagesResponse.pages && internalPagesResponse.pages.length > 0) {
          transformedData = {
            ...transformedData,
            pages: internalPagesResponse.pages.map((page) => ({
              id: page.id,
              title: page.title || 'Untitled',
              slug: page.slug || '',
              url: page.url || '',
              feature_image: page.feature_image ?? undefined,
              feature_image_alt: page.feature_image_alt ?? undefined,
              html: page.html ?? undefined,
              excerpt: page.excerpt ?? undefined,
              custom_excerpt: page.custom_excerpt ?? undefined,
              tags: page.tags
            }))
          }
        }

        setGhostData(transformedData)
        setGhostDataError(null)
        setLastGhostFetch(new Date())
      } catch (error) {
        // Ignore if aborted (cleanup or timeout)
        if (controller.signal.aborted) {
          // Only show timeout error if it was a timeout (not cleanup)
          if (error instanceof Error && error.name === 'AbortError') {
            setGhostDataError('Ghost data fetch timed out. Please try again.')
          }
          return
        }
        logError(error, { scope: 'usePreview.fetchGhostData' })
        const message = error instanceof Error ? error.message : 'Failed to fetch Ghost data'
        setGhostDataError(message)
        // Fall back to placeholder data on error
        setDataSource('placeholder')
      } finally {
        clearTimeout(timeoutId)
        if (!controller.signal.aborted) {
          setGhostDataLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [dataSource, previewPage, ghostRefreshKey, selectedPostIndex, selectedPageIndex])

  const previewData = useMemo(() => {
    if (dataSource === 'ghost' && ghostData) {
      return ghostData
    }
    return previewDataMap[previewPage]
  }, [dataSource, ghostData, previewPage])

  const previewBaseUrl = useMemo(() => {
    const siteUrl = (previewData as Record<string, unknown>)?.site as Record<string, unknown> | undefined
    const baseUrl = siteUrl?.base_url
    if (typeof baseUrl === 'string' && baseUrl.length > 0) {
      return baseUrl
    }
    return 'https://source-newsletter.ghost.io/'
  }, [previewData])

  const previewBaseOrigin = useMemo(() => {
    try {
      return new URL(previewBaseUrl).origin
    } catch {
      return null
    }
  }, [previewBaseUrl])

  const previewFrameStyle = useMemo(() => {
    if (previewDevice === 'mobile') {
      return { width: '100%', maxWidth: '420px' }
    }
    return { width: '100%', maxWidth: '1280px' }
  }, [previewDevice])

  const handleRendererLoading = useCallback((loading: boolean) => {
    setPreviewIsLoading(loading)
    setIframeReady(!loading)
  }, [])

  const refreshPreview = useCallback(() => {
    setPreviewRefreshKey((value) => value + 1)
    setPreviewIsLoading(true)
    setIframeReady(false)
  }, [])

  // Manual refresh for Ghost data - clears cache and refetches
  const refreshGhostData = useCallback(() => {
    if (dataSource === 'ghost') {
      setGhostDataLoading(true)
      setGhostDataError(null)
      setGhostData(null)
      setGhostRefreshKey((k) => k + 1)
    }
  }, [dataSource])

  // Reset to placeholder data
  const resetToPlaceholder = useCallback(() => {
    setDataSource('placeholder')
    setGhostData(null)
    setGhostDataError(null)
  }, [])

  const handlePreviewNavigate = useCallback((href: string) => {
    if (!href) {
      return false
    }

    try {
      const base = previewBaseUrl || window.location.origin
      const url = new URL(href, base)

      if (previewBaseOrigin && url.origin !== previewBaseOrigin) {
        return false
      }

      const normalizedPath = url.pathname.replace(/\/+$/, '') || '/'

      // Sync selection when using Ghost data
      if (dataSource === 'ghost') {
        const slugFromPath = normalizedPath.split('/').filter(Boolean).pop() || ''
        const pageIndex = availablePages.findIndex((p) => p.slug === slugFromPath)
        if (pageIndex !== -1) {
          setSelectedPageIndex(pageIndex)
          setPreviewPage('about')
          return true
        }
        const postIndex = availablePosts.findIndex((p) => p.slug === slugFromPath)
        if (postIndex !== -1) {
          setSelectedPostIndex(postIndex)
          setPreviewPage('post')
          return true
        }
      }

      if (normalizedPath === '/') {
        setPreviewPage('home')
        return true
      }

      if (normalizedPath === '/about') {
        setPreviewPage('about')
        return true
      }

      if (normalizedPath === '/page/2') {
        setPreviewPage('page2')
        return true
      }

      setPreviewPage('post')
      return true
    } catch {
      return false
    }
  }, [previewBaseOrigin, previewBaseUrl, dataSource, availablePages, availablePosts, setSelectedPageIndex, setSelectedPostIndex])

  return {
    previewPage,
    setPreviewPage,
    previewDevice,
    setPreviewDevice,
    previewZoom,
    setPreviewZoom,
    previewIsLoading,
    setPreviewIsLoading,
    iframeReady,
    setIframeReady,
    previewRefreshKey,
    refreshPreview,
    previewTheme: previewPage,
    previewData,
    previewFrameStyle,
    previewBaseUrl,
    previewBaseOrigin,
    handleRendererLoading,
    handlePreviewNavigate,
    // Ghost data source
    dataSource,
    setDataSource,
    hasGhostCreds,
    ghostDataLoading,
    ghostDataError,
    refreshGhostData,
    resetToPlaceholder,
    isInitializing,
    lastGhostFetch,
    // Post/page selection for preview
    selectedPostIndex,
    setSelectedPostIndex,
    selectedPageIndex,
    setSelectedPageIndex,
    availablePosts,
    availablePages
  }
}
