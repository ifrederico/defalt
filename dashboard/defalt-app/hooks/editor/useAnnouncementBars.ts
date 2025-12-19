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

const ensureSingleAnnouncement = (content: AnnouncementContentConfig): AnnouncementContentConfig => {
  const fallbackAnnouncement = DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0]
  const first = content.announcements[0] ?? fallbackAnnouncement
  return {
    ...content,
    announcements: [{ ...first }]
  }
}

export function useAnnouncementBars({
  executeCommand,
  markAsDirty,
  showToast
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
      return ensureSingleAnnouncement({
        announcements: parsed.announcements
      } satisfies AnnouncementContentConfig)
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

    // Tag uses simple pattern: #announcement, #announcement-2, etc.
    // Tag is now on the block level (each announcement can have its own tag)
    const tagSuffix = prevBars.length > 0 ? `-${prevBars.length + 1}` : ''
    const tag = `#announcement${tagSuffix}`

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
      const normalizedCandidate = ensureSingleAnnouncement(nextCandidate)
      const parsed = parseUnifiedConfig(prevBars[idx].bar, normalizedCandidate)
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

      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement',
          applyState: () => setAnnouncementBars(nextBars),
          revertState: () => setAnnouncementBars(prevBars),
          markDirty: markAsDirty
        })
      )
    },
    [announcementBarsRef, executeCommand, markAsDirty, parseUnifiedConfig, setAnnouncementBars, showToast, toContentConfig]
  )

  const hydrateAnnouncementBars = useCallback(
    (data: AnnouncementBarsHydrationData) => {
      const rawBars = Array.isArray(data.announcementBars) ? data.announcementBars : []
      const seenIds = new Set<string>()
      const fallbackAnnouncement = DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.announcements[0]

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

        // Generate simple tag: #announcement, #announcement-2, etc.
        const idMatch = id.match(/^announcement-bar(?:-(\d+))?$/)
        const tagSuffix = idMatch?.[1] ? `-${idMatch[1]}` : ''
        const defaultTag = `#announcement${tagSuffix}`

        const defaultBar = { ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG }
        const normalizedBar = normalizeAnnouncementBarConfig(bar.bar ?? defaultBar, defaultBar)
        // Ensure the block has a tag (use existing or default)
        const blockTag = bar.content?.announcements?.[0]?.tag || defaultTag
        const normalizedContent = ensureSingleAnnouncement(
          normalizeAnnouncementContentConfig(
            bar.content ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
            DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG
          )
        )

        const parsed = parseUnifiedConfig(normalizedBar, normalizedContent)
        const finalBar = toBarConfig(parsed)
        const finalContent = toContentConfig(parsed)

        if (!finalBar || !finalContent) {
          hadInvalid = true
          return {
            id,
            hidden: bar.hidden === true,
            bar: defaultBar,
            content: ensureSingleAnnouncement({
              ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
              announcements: [{ ...(fallbackAnnouncement as AnnouncementBlock), tag: blockTag }]
            })
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
