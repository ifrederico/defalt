import { useState, useEffect, useMemo, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { X, Loader2 } from 'lucide-react'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { fetchGhostTags } from '@defalt/utils/ghost/client'
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
  postCount: number | null
  isThemeTag: boolean
}

export function TagsModal({ open, onOpenChange }: TagsModalProps) {
  const [view, setView] = useState<'public' | 'internal'>('internal')
  const [ghostTags, setGhostTags] = useState<GhostTagWithCount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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

    // Announcement bars use tag field
    for (const bar of announcementBars) {
      if (bar.bar.tag) {
        const formatted = formatInternalTag(bar.bar.tag)
        if (formatted) tags.add(formatted)
      }
    }

    return Array.from(tags).sort()
  }, [customSections, announcementBars])

  // Fetch Ghost tags
  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchGhostTags({ include: 'count.posts' })
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

  // Fetch on open
  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open, fetchTags])

  // Build internal tags list (theme tags + ghost internal tags)
  const internalTags = useMemo((): InternalTagDisplay[] => {
    const ghostInternalMap = new Map(
      ghostTags
        .filter(t => t.visibility === 'internal')
        .map(t => [t.name, t])
    )

    // Start with theme tags
    const themeTags: InternalTagDisplay[] = sectionTags.map(tag => {
      const ghostTag = ghostInternalMap.get(tag)
      return {
        name: tag,
        slug: toApiTagSlug(tag),
        postCount: ghostTag?.count?.posts ?? null,
        isThemeTag: true
      }
    })

    // Add ghost internal tags that aren't theme tags
    const themeTagNames = new Set(sectionTags)
    const ghostOnlyTags: InternalTagDisplay[] = ghostTags
      .filter(t => t.visibility === 'internal' && !themeTagNames.has(t.name))
      .map(t => ({
        name: t.name,
        slug: t.slug,
        postCount: t.count?.posts ?? null,
        isThemeTag: false
      }))

    return [...themeTags, ...ghostOnlyTags]
  }, [sectionTags, ghostTags])

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
        <Dialog.Content className="fixed left-1/2 top-[10%] z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-surface shadow-xl focus:outline-none data-[state=open]:animate-contentShow">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Tags
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              View tags used by your theme and from your Ghost blog
            </Dialog.Description>
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

          <div className="p-6">
            {/* Toggle */}
            <ToggleGroup.Root
              type="single"
              value={view}
              onValueChange={handleViewChange}
              className="inline-flex items-center gap-0.5 rounded-md bg-subtle p-0.5 mb-4"
              aria-label="Tag type"
            >
              <ToggleGroup.Item
                value="internal"
                className="px-3 py-1.5 rounded font-md text-foreground transition-colors focus:outline-none data-[state=on]:bg-surface data-[state=on]:shadow-sm data-[state=off]:hover:bg-subtle/80"
              >
                Internal tags
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="public"
                className="px-3 py-1.5 rounded font-md text-foreground transition-colors focus:outline-none data-[state=on]:bg-surface data-[state=on]:shadow-sm data-[state=off]:hover:bg-subtle/80"
              >
                Public tags
              </ToggleGroup.Item>
            </ToggleGroup.Root>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-secondary" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-error text-sm mb-2">{error}</p>
                  <button
                    type="button"
                    onClick={fetchTags}
                    className="text-sm text-secondary hover:text-foreground underline"
                  >
                    Retry
                  </button>
                </div>
              ) : view === 'internal' ? (
                <InternalTagsList
                  tags={internalTags}
                  isConnected={isConnected}
                  hasSectionTags={sectionTags.length > 0}
                />
              ) : (
                <PublicTagsList tags={publicTags} isConnected={isConnected} />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function InternalTagsList({
  tags,
  isConnected,
  hasSectionTags
}: {
  tags: InternalTagDisplay[]
  isConnected: boolean
  hasSectionTags: boolean
}) {
  if (tags.length === 0) {
    if (!hasSectionTags) {
      return (
        <p className="text-secondary text-sm py-4">
          No internal tags. Add sections like Ghost Cards or Ghost Grid to see their required tags here.
        </p>
      )
    }
    return <p className="text-secondary text-sm py-4">No internal tags found</p>
  }

  return (
    <div>
      {!isConnected && hasSectionTags && (
        <p className="text-secondary text-xs mb-3">
          Connect to Ghost to see post counts
        </p>
      )}
      {tags.map((tag, index) => (
        <div
          key={tag.name}
          className={`py-3 ${index < tags.length - 1 ? 'border-b border-border' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{tag.name}</span>
            {tag.isThemeTag && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-subtle text-secondary">
                Theme
              </span>
            )}
          </div>
          <div className="text-secondary text-sm">{tag.slug}</div>
          <div className="text-secondary text-sm">
            {tag.postCount !== null
              ? `${tag.postCount} post${tag.postCount !== 1 ? 's' : ''}`
              : isConnected
                ? 'Not found'
                : '–'}
          </div>
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
      <p className="text-secondary text-sm py-4">
        Connect to Ghost to view public tags
      </p>
    )
  }

  if (tags.length === 0) {
    return <p className="text-secondary text-sm py-4">No public tags found</p>
  }

  return (
    <div>
      {tags.map((tag, index) => (
        <div
          key={tag.id}
          className={`py-3 ${index < tags.length - 1 ? 'border-b border-border' : ''}`}
        >
          <div className="font-semibold text-foreground">{tag.name}</div>
          <div className="text-secondary text-sm">{tag.slug}</div>
          <div className="text-secondary text-sm">
            {tag.count?.posts !== undefined
              ? `${tag.count.posts} post${tag.count.posts !== 1 ? 's' : ''}`
              : '–'}
          </div>
        </div>
      ))}
    </div>
  )
}
