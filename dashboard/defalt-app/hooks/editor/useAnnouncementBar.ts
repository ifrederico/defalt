import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  normalizeAnnouncementBarConfig,
  normalizeAnnouncementContentConfig,
  type AnnouncementBarConfig,
  type AnnouncementContentConfig
} from '@defalt/utils/config/themeConfig'
import { AnnouncementCommand } from '@defalt/utils/history/commands'
import type {
  AnnouncementBarParams,
  AnnouncementBarReturn,
  AnnouncementBarHydrationData
} from './types'

export function useAnnouncementBar({
  executeCommand,
  markAsDirty
}: AnnouncementBarParams): AnnouncementBarReturn {
  const [announcementBarConfig, setAnnouncementBarConfig] = useState<AnnouncementBarConfig>({
    ...DEFAULT_ANNOUNCEMENT_BAR_CONFIG
  })
  const [announcementContentConfig, setAnnouncementContentConfig] = useState<AnnouncementContentConfig>({
    ...DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG
  })

  const announcementBarConfigRef = useRef(announcementBarConfig)
  const announcementContentConfigRef = useRef(announcementContentConfig)
  // Track the config state before preview started (for commit)
  const announcementBarPreviewStartRef = useRef<AnnouncementBarConfig | null>(null)

  useEffect(() => {
    announcementBarConfigRef.current = announcementBarConfig
  }, [announcementBarConfig])

  useEffect(() => {
    announcementContentConfigRef.current = announcementContentConfig
  }, [announcementContentConfig])

  const updateAnnouncementBarConfig = useCallback(
    (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => {
      const previous = announcementBarConfigRef.current
      const next = normalizeAnnouncementBarConfig(updater(previous), previous)
      if (JSON.stringify(previous) === JSON.stringify(next)) {
        return
      }
      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement bar',
          applyState: () => setAnnouncementBarConfig(next),
          revertState: () => setAnnouncementBarConfig(previous),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, markAsDirty]
  )

  const updateAnnouncementContentConfig = useCallback(
    (updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => {
      const previous = announcementContentConfigRef.current
      const next = normalizeAnnouncementContentConfig(updater(previous), previous)
      if (JSON.stringify(previous) === JSON.stringify(next)) {
        return
      }
      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement content',
          applyState: () => setAnnouncementContentConfig(next),
          revertState: () => setAnnouncementContentConfig(previous),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, markAsDirty]
  )

  // Preview update - changes state without creating history entry
  const previewAnnouncementBarConfig = useCallback(
    (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => {
      const current = announcementBarConfigRef.current
      // Capture the state before preview started (only on first preview call)
      if (announcementBarPreviewStartRef.current === null) {
        announcementBarPreviewStartRef.current = current
      }
      const next = normalizeAnnouncementBarConfig(updater(current), current)
      setAnnouncementBarConfig(next)
    },
    []
  )

  // Commit - creates history entry comparing preview start state vs current
  const commitAnnouncementBarConfig = useCallback(() => {
    const previous = announcementBarPreviewStartRef.current
    const next = announcementBarConfigRef.current
    // Reset preview start ref
    announcementBarPreviewStartRef.current = null
    // Only create history if there was a previous state and it changed
    if (previous && JSON.stringify(previous) !== JSON.stringify(next)) {
      executeCommand(
        new AnnouncementCommand({
          label: 'Update announcement bar',
          applyState: () => setAnnouncementBarConfig(next),
          revertState: () => setAnnouncementBarConfig(previous),
          markDirty: markAsDirty
        })
      )
    }
  }, [executeCommand, markAsDirty])

  const hydrateAnnouncementBar = useCallback((data: AnnouncementBarHydrationData) => {
    setAnnouncementBarConfig(data.announcementBarConfig)
    setAnnouncementContentConfig(data.announcementContentConfig)
  }, [])

  return {
    announcementBarConfig,
    announcementContentConfig,
    announcementBarConfigRef,
    announcementContentConfigRef,
    updateAnnouncementBarConfig,
    updateAnnouncementContentConfig,
    previewAnnouncementBarConfig,
    commitAnnouncementBarConfig,
    hydrateAnnouncementBar,
    setAnnouncementBarConfig,
    setAnnouncementContentConfig
  }
}
