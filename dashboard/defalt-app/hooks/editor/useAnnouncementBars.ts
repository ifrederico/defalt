import { useCallback } from 'react'
import {
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig,
  type AnnouncementBarConfig,
  type AnnouncementContentConfig,
  type AnnouncementBarInstance,
  type AnnouncementBlock
} from '@defalt/utils/config/themeConfig'
import { collectTagSources, findTagCollision, resolveAnnouncementBlockTag } from '@defalt/utils/config/sectionRegistry'
import { useSyncedState } from '@defalt/utils/hooks'
import { announcementBarConfigSchema } from '@defalt/sections/engine'
import { AnnouncementCommand } from '@defalt/utils/history/commands'
import type {
  AnnouncementBarsParams,
  AnnouncementBarsReturn,
  AnnouncementBarsHydrationData
} from './types'

const cloneAnnouncementBars = (bars: AnnouncementBarInstance[]): AnnouncementBarInstance[] =>
  bars.map((bar) => ({
    id: bar.id,
    hidden: bar.hidden,
    bar: { ...bar.bar },
    content: {
      ...bar.content,
      announcements: Array.isArray(bar.content.announcements)
        ? bar.content.announcements.map((announcement) => ({ ...announcement }))
        : []
    }
  }))

export function useAnnouncementBars({
  executeCommand,
  markAsDirty,
  showToast,
  tagStateRef
}: AnnouncementBarsParams): AnnouncementBarsReturn {
  const [announcementBars, setAnnouncementBars, announcementBarsRef] = useSyncedState<AnnouncementBarInstance[]>([])

  const parseUnifiedConfig = useCallback(
    (barConfig: AnnouncementBarConfig, contentConfig: AnnouncementContentConfig) => {
      const result = announcementBarConfigSchema.safeParse({
        ...barConfig,
        ...contentConfig
      })
      return result.success ? result.data : null
    },
    []
  )

  const toBarConfig = useCallback((parsed: ReturnType<typeof parseUnifiedConfig>) => {
    if (!parsed) return null
    return {
      width: parsed.width,
      backgroundColor: parsed.backgroundColor,
      textColor: parsed.textColor,
      dividerThickness: parsed.dividerThickness,
      dividerColor: parsed.dividerColor,
      paddingTop: parsed.paddingTop,
      paddingBottom: parsed.paddingBottom
    } satisfies AnnouncementBarConfig
  }, [])

  const toContentConfig = useCallback(
    (parsed: ReturnType<typeof parseUnifiedConfig>) => {
      if (!parsed) return null
      return {
        announcements: parsed.announcements
      } satisfies AnnouncementContentConfig
    },
    []
  )

  const addAnnouncementBar = useCallback(() => {
    const prevBars = cloneAnnouncementBars(announcementBarsRef.current)
    const existingIds = new Set(prevBars.map((bar) => bar.id))

    let id = 'announcement-bar'
    let suffix = 2
    while (existingIds.has(id)) {
      id = `announcement-bar-${suffix}`
      suffix += 1
    }

    // Tag uses bar + block index pattern (e.g. #announcement, #announcement-2, #announcement-2-1).
    // Tag is on the block level (each announcement can have its own tag).
    const tag = resolveAnnouncementBlockTag(id, 0)

    const nextBars = [
      ...prevBars,
      {
        id,
        hidden: false,
        bar: { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG },
        content: {
          announcements: [{ ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0], tag }]
        }
      }
    ]

    executeCommand(
      new AnnouncementCommand({
        label: 'Add announcement bar',
        applyState: () => setAnnouncementBars(nextBars),
        revertState: () => setAnnouncementBars(prevBars),
        markDirty: markAsDirty
      })
    )

    return id
  }, [announcementBarsRef, executeCommand, markAsDirty, setAnnouncementBars])

  const removeAnnouncementBar = useCallback(
    (id: string) => {
      const prevBars = cloneAnnouncementBars(announcementBarsRef.current)
      if (!prevBars.some((bar) => bar.id === id)) {
        return
      }

      const nextBars = prevBars.filter((bar) => bar.id !== id)

      executeCommand(
        new AnnouncementCommand({
          label: 'Remove announcement bar',
          applyState: () => setAnnouncementBars(nextBars),
          revertState: () => setAnnouncementBars(prevBars),
          markDirty: markAsDirty
        })
      )
    },
    [announcementBarsRef, executeCommand, markAsDirty, setAnnouncementBars]
  )

  const toggleAnnouncementBarHidden = useCallback(
    (id: string, forceHidden?: boolean) => {
      const prevBars = cloneAnnouncementBars(announcementBarsRef.current)
      const idx = prevBars.findIndex((bar) => bar.id === id)
      if (idx === -1) {
        return
      }

      const previous = prevBars[idx]
      const nextHidden = typeof forceHidden === 'boolean' ? forceHidden : !previous.hidden
      if (previous.hidden === nextHidden) {
        return
      }

      const nextBars = cloneAnnouncementBars(announcementBarsRef.current)
      nextBars[idx] = { ...nextBars[idx], hidden: nextHidden }

      executeCommand(
        new AnnouncementCommand({
          label: nextHidden ? 'Hide announcement bar' : 'Show announcement bar',
          applyState: () => setAnnouncementBars(nextBars),
          revertState: () => setAnnouncementBars(prevBars),
          markDirty: markAsDirty
        })
      )
    },
    [announcementBarsRef, executeCommand, markAsDirty, setAnnouncementBars]
  )

  const updateAnnouncementBarConfig = useCallback(
    (id: string, updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => {
      const prevBars = cloneAnnouncementBars(announcementBarsRef.current)
      const idx = prevBars.findIndex((bar) => bar.id === id)
      if (idx === -1) {
        return
      }

      const previous = prevBars[idx].bar
      const nextCandidate = normalizeAnnouncementBarConfig(updater(previous), previous)
      const parsed = parseUnifiedConfig(nextCandidate, prevBars[idx].content)
      const next = toBarConfig(parsed)
      if (!next) {
        showToast('Invalid settings', 'Could not update announcement bar.', 'error')
        return
      }
      if (JSON.stringify(previous) === JSON.stringify(next)) {
        return
      }

      const nextBars = cloneAnnouncementBars(announcementBarsRef.current)
      nextBars[idx] = { ...nextBars[idx], bar: next }

      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement bar',
          applyState: () => setAnnouncementBars(nextBars),
          revertState: () => setAnnouncementBars(prevBars),
          markDirty: markAsDirty
        })
      )
    },
    [announcementBarsRef, executeCommand, markAsDirty, parseUnifiedConfig, setAnnouncementBars, showToast, toBarConfig]
  )

  const updateAnnouncementContentConfig = useCallback(
    (id: string, updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => {
      const prevBars = cloneAnnouncementBars(announcementBarsRef.current)
      const idx = prevBars.findIndex((bar) => bar.id === id)
      if (idx === -1) {
        return
      }

      const previous = prevBars[idx].content
      const nextCandidate = normalizeAnnouncementContentConfig(
        updater(previous),
        previous
      )
      const parsed = parseUnifiedConfig(prevBars[idx].bar, nextCandidate)
      const next = toContentConfig(parsed)
      if (!next) {
        showToast('Invalid settings', 'Could not update announcement content.', 'error')
        return
      }
      if (JSON.stringify(previous) === JSON.stringify(next)) {
        return
      }

      const nextBars = cloneAnnouncementBars(announcementBarsRef.current)
      nextBars[idx] = { ...nextBars[idx], content: next }

      if (tagStateRef) {
        const sources = collectTagSources(
          tagStateRef.current?.customSections ?? {},
          nextBars
        )
        const collision = findTagCollision(sources)
        if (collision) {
          const labels = collision.sources.map((source) => source.label).join(', ')
          showToast(
            'Tag already used',
            `${collision.tag} is already used by ${labels}.`,
            'error'
          )
          return
        }
      }

      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement',
          applyState: () => setAnnouncementBars(nextBars),
          revertState: () => setAnnouncementBars(prevBars),
          markDirty: markAsDirty
        })
      )
    },
    [announcementBarsRef, executeCommand, markAsDirty, parseUnifiedConfig, setAnnouncementBars, showToast, toContentConfig, tagStateRef]
  )

  const hydrateAnnouncementBars = useCallback(
    (data: AnnouncementBarsHydrationData) => {
      const rawBars = Array.isArray(data.announcementBars) ? data.announcementBars : []
      const seenIds = new Set<string>()
      let hadInvalid = false

      const nextBars: AnnouncementBarInstance[] = rawBars.map((bar) => {
        const baseId = typeof bar.id === 'string' && bar.id.trim().length ? bar.id.trim() : 'announcement-bar'
        let id = baseId
        if (seenIds.has(id)) {
          let suffix = 2
          let candidate = `${id}-${suffix}`
          while (seenIds.has(candidate)) {
            suffix += 1
            candidate = `${id}-${suffix}`
          }
          id = candidate
        }
        seenIds.add(id)

        const defaultBar = { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG }
        const normalizedBar = normalizeAnnouncementBarConfig(bar.bar ?? defaultBar, defaultBar)
        const normalizedContent = normalizeAnnouncementContentConfig(
          bar.content ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
          DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG
        )
        const ensuredAnnouncements = (normalizedContent.announcements ?? []).map((block, index) => ({
          ...block,
          tag: block.tag || resolveAnnouncementBlockTag(id, index)
        }))
        const contentWithTags: AnnouncementContentConfig = {
          ...normalizedContent,
          announcements: ensuredAnnouncements
        }

        const parsed = parseUnifiedConfig(normalizedBar, contentWithTags)
        const finalBar = toBarConfig(parsed)
        const finalContent = toContentConfig(parsed)

        if (!finalBar || !finalContent) {
          hadInvalid = true
          return {
            id,
            hidden: bar.hidden === true,
            bar: defaultBar,
            content: {
              ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
              announcements: [
                {
                  ...(DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0] as AnnouncementBlock),
                  tag: resolveAnnouncementBlockTag(id, 0)
                }
              ]
            }
          }
        }

        return {
          id,
          hidden: bar.hidden === true,
          bar: finalBar,
          content: finalContent
        }
      })

      if (hadInvalid) {
        showToast('Invalid saved settings', 'Announcement bars reset to defaults.', 'error')
      }

      setAnnouncementBars(nextBars)
    },
    [parseUnifiedConfig, setAnnouncementBars, showToast, toBarConfig, toContentConfig]
  )

  return {
    announcementBars,
    announcementBarsRef,
    addAnnouncementBar,
    removeAnnouncementBar,
    toggleAnnouncementBarHidden,
    updateAnnouncementBarConfig,
    updateAnnouncementContentConfig,
    hydrateAnnouncementBars,
    setAnnouncementBars
  }
}
