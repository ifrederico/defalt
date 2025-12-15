import { useState, useEffect, useMemo, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { X, Loader2 } from 'lucide-react'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { fetchGhostTags, fetchGhostPages, fetchGhostPosts } from '@defalt/utils/ghost/client'
import { formatInternalTag, toApiTagSlug } from '@defalt/sections/utils/tagUtils'
import type { GhostTag } from '@defalt/utils/ghost/types'

type TagsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type GhostTagWithCount = GhostTag & {
  count?: { posts: number }
}

type InternalTagDisplay = {
  name: string
  slug: string
  isFound: boolean
  itemCount: number | null
  isThemeTag: boolean
}

export function TagsModal({ open, onOpenChange }: TagsModalProps) {
  const [view, setView] = useState<'public' | 'internal'>('internal')
  const [ghostTags, setGhostTags] = useState<GhostTagWithCount[]>([])
  const [loading, setLoading] = useState(false)
  const [countsLoading, setCountsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [internalTagTotals, setInternalTagTotals] = useState<Record<string, number>>({})

  const { customSections, announcementBars } = useWorkspaceContext()

  // Extract tags from sections
  const sectionTags = useMemo(() => {
    const tags = new Set<string>()

    // Custom sections use tag field
    for (const section of Object.values(customSections)) {
      const config = section.config as Record<string, unknown>
      if (config.tag) {
        const formatted = formatInternalTag(config.tag)
        if (formatted) tags.add(formatted)
      }
      // tagLeft/tagRight for ghost-grid
      if (config.tagLeft) {
        const formatted = formatInternalTag(config.tagLeft)
        if (formatted) tags.add(formatted)
      }
      if (config.tagRight) {
        const formatted = formatInternalTag(config.tagRight)
        if (formatted) tags.add(formatted)
      }
    }

    // Announcement bars - tags are on blocks (each announcement can have its own tag)
    for (const bar of announcementBars) {
      for (const announcement of bar.content.announcements) {
        if (announcement.tag) {
          const formatted = formatInternalTag(announcement.tag)
          if (formatted) tags.add(formatted)
        }
      }
    }

    return Array.from(tags).sort()
  }, [customSections, announcementBars])

  // Fetch Ghost tags
  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchGhostTags({ include: 'count.posts', limit: 100 })
      setGhostTags(response.tags as GhostTagWithCount[])
      setIsConnected(true)
    } catch (err) {
      if (err instanceof Error && err.message.includes('not configured')) {
        setIsConnected(false)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch tags')
      }
      setGhostTags([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch post+page totals for internal tags (Ghost tag counts don't include pages).
  useEffect(() => {
    if (!open || view !== 'internal' || !isConnected) {
      setCountsLoading((prev) => (prev ? false : prev))
      setInternalTagTotals((prev) => (Object.keys(prev).length > 0 ? {} : prev))
      return
    }

    const internalGhostTags = ghostTags.filter((tag) => tag.visibility === 'internal')
    if (internalGhostTags.length === 0) {
      setCountsLoading((prev) => (prev ? false : prev))
      setInternalTagTotals((prev) => (Object.keys(prev).length > 0 ? {} : prev))
      return
    }

    let cancelled = false

    const slugsToCount = new Set(internalGhostTags.map((tag) => tag.slug))

    const fetchTotals = async () => {
      setCountsLoading(true)
      try {
        const results = await Promise.all(
          Array.from(slugsToCount).map(async (slug) => {
            const filter = `tag:${slug}`
            const [postsResponse, pagesResponse] = await Promise.all([
              fetchGhostPosts({ limit: 1, filter, fields: 'id' }).catch(() => null),
              fetchGhostPages({ limit: 1, filter, fields: 'id' }).catch(() => null)
            ])

            const posts = postsResponse?.meta?.pagination?.total ?? 0
            const pages = pagesResponse?.meta?.pagination?.total ?? 0
            return { slug, total: posts + pages }
          })
        )

        if (cancelled) {
          return
        }

        const nextTotals: Record<string, number> = {}
        results.forEach((result) => {
          nextTotals[result.slug] = result.total
        })
        setInternalTagTotals(nextTotals)
      } finally {
        if (!cancelled) {
          setCountsLoading(false)
        }
      }
    }

    void fetchTotals()

    return () => {
      cancelled = true
    }
  }, [open, view, isConnected, ghostTags])

  // Fetch on open
  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open, fetchTags])

  // Build internal tags list (theme tags + ghost internal tags)
  const internalTags = useMemo((): InternalTagDisplay[] => {
    const internalGhostTags = ghostTags.filter((tag) => tag.visibility === 'internal')
    const ghostInternalBySlug = new Map(internalGhostTags.map((tag) => [tag.slug, tag]))

    // Start with theme tags
    const themeTags: InternalTagDisplay[] = sectionTags.map(tag => {
      const slug = toApiTagSlug(tag)
      const isFound = ghostInternalBySlug.has(slug)
      return {
        name: tag,
        slug,
        isFound,
        itemCount: isFound ? (internalTagTotals[slug] ?? null) : null,
        isThemeTag: true
      }
    })

    // Add ghost internal tags that aren't theme tags
    const themeTagSlugs = new Set(sectionTags.map((tag) => toApiTagSlug(tag)))
    const ghostOnlyTags: InternalTagDisplay[] = ghostTags
      .filter(t => t.visibility === 'internal' && !themeTagSlugs.has(t.slug))
      .map(t => ({
        name: t.name,
        slug: t.slug,
        isFound: true,
        itemCount: internalTagTotals[t.slug] ?? null,
        isThemeTag: false
      }))

    return [...themeTags, ...ghostOnlyTags]
  }, [sectionTags, ghostTags, internalTagTotals])

  const publicTags = useMemo(() =>
    ghostTags.filter(t => t.visibility === 'public'),
    [ghostTags]
  )

  const handleViewChange = (value: string) => {
    if (value === 'public' || value === 'internal') {
      setView(value)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-[2px] data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
        <Dialog.Content className="fixed left-1/2 top-[10%] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-surface shadow-xl focus:outline-none data-[state=open]:animate-contentShow">
          {/* Header with title and toggle */}
          <div className="flex items-center justify-between px-6 py-4">
            <Dialog.Title className="text-xl font-bold text-foreground">
              Tags
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              View tags used by your theme and from your Ghost blog
            </Dialog.Description>
            <div className="flex items-center gap-3">
              <ToggleGroup.Root
                type="single"
                value={view}
                onValueChange={handleViewChange}
                className="inline-flex items-center gap-0.5 rounded-md bg-subtle p-0.5"
                aria-label="Tag type"
              >
                <ToggleGroup.Item
                  value="public"
                  className="font-md px-3 py-1.5 rounded text-foreground transition-colors focus:outline-none data-[state=on]:bg-surface data-[state=on]:shadow-sm data-[state=off]:text-secondary data-[state=off]:hover:text-foreground"
                >
                  Public tags
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="internal"
                  className="font-md px-3 py-1.5 rounded text-foreground transition-colors focus:outline-none data-[state=on]:bg-surface data-[state=on]:shadow-sm data-[state=off]:text-secondary data-[state=off]:hover:text-foreground"
                >
                  Internal tags
                </ToggleGroup.Item>
              </ToggleGroup.Root>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-md flex items-center justify-center text-secondary hover:bg-subtle transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-secondary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 px-6">
                <p className="font-sm text-error mb-2">{error}</p>
                <button
                  type="button"
                  onClick={fetchTags}
                  className="font-sm text-secondary hover:text-foreground underline"
                >
                  Retry
                </button>
              </div>
            ) : view === 'internal' ? (
              <InternalTagsList
                tags={internalTags}
                isConnected={isConnected}
                countsLoading={countsLoading}
                hasSectionTags={sectionTags.length > 0}
              />
            ) : (
              <PublicTagsList tags={publicTags} isConnected={isConnected} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Column header component
function TableHeader({ countLabel }: { countLabel: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border sticky top-0 bg-surface">
      <span className="font-xs text-secondary uppercase tracking-wide">Tag</span>
      <span className="font-xs text-secondary uppercase tracking-wide">Slug</span>
      <span className="font-xs text-secondary uppercase tracking-wide text-right w-[120px]">{countLabel}</span>
    </div>
  )
}

function InternalTagsList({
  tags,
  isConnected,
  countsLoading,
  hasSectionTags
}: {
  tags: InternalTagDisplay[]
  isConnected: boolean
  countsLoading: boolean
  hasSectionTags: boolean
}) {
  if (tags.length === 0) {
    if (!hasSectionTags) {
      return (
        <p className="font-sm text-secondary py-8 px-6 text-center">
          No internal tags. Add sections to see their required tags.
        </p>
      )
    }
    return <p className="font-sm text-secondary py-8 px-6 text-center">No internal tags found</p>
  }

  return (
    <div>
      <TableHeader countLabel="No. of items" />
      {tags.map((tag, index) => (
        <div
          key={tag.slug}
          className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-6 py-4 ${index < tags.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="font-md font-bold text-foreground flex items-center justify-between gap-2">
            <span>{tag.name}</span>
            {tag.isThemeTag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-subtle text-secondary font-normal">
                Theme
              </span>
            )}
          </span>
          <span className="font-sm text-secondary">{tag.slug}</span>
          <span className="font-sm text-secondary text-right w-[120px] tabular-nums">
            {!isConnected
              ? '–'
              : !tag.isFound
                ? 'Not found'
                : tag.itemCount !== null
                  ? `${tag.itemCount} item${tag.itemCount !== 1 ? 's' : ''}`
                  : countsLoading
                    ? '…'
                    : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}

function PublicTagsList({
  tags,
  isConnected
}: {
  tags: GhostTagWithCount[]
  isConnected: boolean
}) {
  if (!isConnected) {
    return (
      <p className="font-sm text-secondary py-8 px-6 text-center">
        Connect to Ghost to view public tags
      </p>
    )
  }

  if (tags.length === 0) {
    return <p className="font-sm text-secondary py-8 px-6 text-center">No public tags found</p>
  }

  return (
    <div>
      <TableHeader countLabel="No. of posts" />
      {tags.map((tag, index) => (
        <div
          key={tag.id}
          className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-6 py-4 ${index < tags.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="font-md font-bold text-foreground">{tag.name}</span>
          <span className="font-sm text-secondary">{tag.slug}</span>
          <span className="font-sm text-secondary text-right w-[120px] tabular-nums">
            {tag.count?.posts !== undefined
              ? `${tag.count.posts} post${tag.count.posts !== 1 ? 's' : ''}`
              : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}
