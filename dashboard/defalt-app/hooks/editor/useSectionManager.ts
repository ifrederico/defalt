import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  SECTION_ID_MAP,
  type SectionPadding
} from '@defalt/utils/config/themeConfig'
import {
  buildSectionInstance,
  getSectionDefinition,
  listDefinitionsByCategory,
  type SectionInstance,
  type SectionConfigSchema
} from '@defalt/sections/engine'
import { parseGhostCardIdSuffix, parseGhostCardTagSuffix } from '@defalt/sections/utils/tagUtils'
import { SECTION_ICON_MAP } from '@defalt/utils/config/sectionIcons'
import { sanitizeNumericValue, resolveNumericValue } from '@defalt/utils/helpers/numericHelpers'
import { deepClone } from '@defalt/utils/helpers/deepClone'
import {
  footerItemsDefault,
  getTemplateDefaults,
  HERO_ID_PREFIX,
  type SidebarItem
} from '@defalt/utils/config/configStateDefaults'
import { logError } from '@defalt/utils/logging/errorLogger'
import {
  ReorderCommand,
  VisibilityCommand,
  AddSectionCommand,
  RemoveSectionCommand,
  PaddingCommand,
  MarginCommand,
  CustomSectionCommand,
  HeaderCommand
} from '@defalt/utils/history/commands'
import type {
  SectionManagerParams,
  SectionManagerReturn,
  SectionHydrationData,
  PaddingUpdateResult,
  MarginUpdateResult
} from './types'

const CUSTOM_SECTION_BASE_ID: Record<string, string> = {
  hero: HERO_ID_PREFIX,
  ghostCards: 'ghost-cards',
  ghostGrid: 'ghost-grid'
}

const SUBHEADER_SECTION_ID = 'subheader'
const SUBHEADER_PADDING_DEFAULT = 160
const SUBHEADER_MARGIN_DEFAULT = 40
const SUBHEADER_MARGIN_STYLES = new Set(['Highlight', 'Magazine'])
const SUBHEADER_PADDING_STYLES = new Set(['Landing', 'Search'])

const GHOST_CARD_TAG_BASE = '#ghost-card'

const generateCustomSectionId = (definitionId: string, existingIds: Set<string>) => {
  const baseId = CUSTOM_SECTION_BASE_ID[definitionId] ?? definitionId
  let attempt = baseId
  let suffix = 2
  while (existingIds.has(attempt)) {
    attempt = `${baseId}-${suffix}`
    suffix += 1
  }
  return attempt
}

const getNextGhostCardsSuffix = (sections: Record<string, SectionInstance>) => {
  let maxSuffix = 0
  Object.values(sections).forEach((section) => {
    if (section.definitionId !== 'ghostCards') {
      return
    }
    const currentTag = (section.config as { ghostPageTag?: unknown })?.ghostPageTag
    maxSuffix = Math.max(
      maxSuffix,
      parseGhostCardIdSuffix(section.id),
      parseGhostCardTagSuffix(currentTag)
    )
  })
  return maxSuffix + 1
}

const buildGhostCardsInstanceMeta = (
  sections: Record<string, SectionInstance>,
  existingIds: Set<string>
) => {
  let suffix = getNextGhostCardsSuffix(sections)
  let instanceId = suffix === 1 ? 'ghost-cards' : `ghost-cards-${suffix}`

  while (existingIds.has(instanceId)) {
    suffix += 1
    instanceId = suffix === 1 ? 'ghost-cards' : `ghost-cards-${suffix}`
  }

  return {
    instanceId,
    ghostPageTag: suffix === 1 ? GHOST_CARD_TAG_BASE : `${GHOST_CARD_TAG_BASE}-${suffix}`
  }
}

const cloneSidebarItems = (items: SidebarItem[]) => items.map((item) => ({ ...item }))

const cloneVisibilityState = (state: Record<string, boolean>) => ({ ...state })

const cloneSectionPaddingState = (state: Record<string, SectionPadding>) => {
  const next: Record<string, SectionPadding> = {}
  Object.entries(state).forEach(([key, value]) => {
    next[key] = { ...value }
  })
  return next
}

const cloneSectionMarginState = (state: Record<string, { top?: number; bottom?: number }>) => {
  const next: Record<string, { top?: number; bottom?: number }> = {}
  Object.entries(state).forEach(([key, value]) => {
    next[key] = { ...value }
  })
  return next
}

const arePaddingStatesEqual = (
  a: Record<string, SectionPadding>,
  b: Record<string, SectionPadding>
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const currentA = a[key]
    const currentB = b[key]
    if (!currentA && !currentB) {
      continue
    }
    if (!currentA || !currentB) {
      return false
    }
    if (
      currentA.top !== currentB.top ||
      currentA.bottom !== currentB.bottom ||
      (currentA.left ?? 0) !== (currentB.left ?? 0) ||
      (currentA.right ?? 0) !== (currentB.right ?? 0)
    ) {
      return false
    }
  }
  return true
}

const areMarginStatesEqual = (
  a: Record<string, { top?: number; bottom?: number }>,
  b: Record<string, { top?: number; bottom?: number }>
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const currentA = a[key]
    const currentB = b[key]
    if (!currentA && !currentB) {
      continue
    }
    if (!currentA || !currentB) {
      return false
    }
    if (
      (currentA.top ?? 0) !== (currentB.top ?? 0) ||
      (currentA.bottom ?? 0) !== (currentB.bottom ?? 0)
    ) {
      return false
    }
  }
  return true
}

const cloneCustomSectionsState = (sections: Record<string, SectionInstance>) => {
  const next: Record<string, SectionInstance> = {}
  Object.entries(sections).forEach(([key, section]) => {
    next[key] = {
      ...section,
      config: deepClone(section.config)
    }
  })
  return next
}

const reorderSidebarItems = (items: SidebarItem[], startIndex: number, endIndex: number) => {
  if (startIndex === endIndex) {
    return null
  }
  const next = cloneSidebarItems(items)
  if (startIndex < 0 || startIndex >= next.length) {
    return null
  }
  const [moved] = next.splice(startIndex, 1)
  if (!moved) {
    return null
  }
  const clampedTarget = Math.max(0, Math.min(endIndex, next.length))
  next.splice(clampedTarget, 0, moved)
  return next
}

// Use centralized utilities from numericHelpers
const sanitizePadding = (value: number | undefined) => sanitizeNumericValue(value, 0, 0)
const sanitizeMarginValue = (value: number | undefined) => resolveNumericValue(value, undefined, 0)

export function useSectionManager({
  executeCommand,
  markAsDirty,
  showToast,
  currentPageRef,
  getHistoryPageId
}: SectionManagerParams): SectionManagerReturn {
  const currentPage = currentPageRef.current

  // State
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    'announcement-bar': false
  })
  const [footerItems, setFooterItems] = useState<SidebarItem[]>(footerItemsDefault)
  const [templateItems, setTemplateItems] = useState<SidebarItem[]>(() =>
    getTemplateDefaults(currentPage)
  )
  const [sectionPadding, setSectionPadding] = useState<
    Record<string, { top: number; bottom: number; left?: number; right?: number }>
  >({})
  const [sectionMargins, setSectionMargins] = useState<
    Record<string, { top?: number; bottom?: number }>
  >({})
  const [customSections, setCustomSections] = useState<Record<string, SectionInstance>>({})

  // Refs
  const footerItemsRef = useRef(footerItems)
  const templateItemsRef = useRef(templateItems)
  const sectionVisibilityRef = useRef(sectionVisibility)
  const sectionPaddingRef = useRef(sectionPadding)
  const sectionMarginsRef = useRef(sectionMargins)
  const customSectionsRef = useRef(customSections)
  const hasGhostGridRef = useRef(false)
  const pendingGhostGridRef = useRef(false)
  const subheaderMarginCacheRef = useRef<{ top?: number; bottom?: number } | null>(null)
  const pendingPaddingCommandsRef = useRef<
    Record<string, { previousState: Record<string, SectionPadding> }>
  >({})
  const pendingMarginCommandsRef = useRef<
    Record<string, { previousState: Record<string, { top?: number; bottom?: number }> }>
  >({})

  // Sync refs with state
  useEffect(() => {
    footerItemsRef.current = footerItems
  }, [footerItems])

  useEffect(() => {
    templateItemsRef.current = templateItems
  }, [templateItems])

  useEffect(() => {
    sectionVisibilityRef.current = sectionVisibility
  }, [sectionVisibility])

  useEffect(() => {
    sectionPaddingRef.current = sectionPadding
  }, [sectionPadding])

  useEffect(() => {
    sectionMarginsRef.current = sectionMargins
  }, [sectionMargins])

  useEffect(() => {
    customSectionsRef.current = customSections
  }, [customSections])

  // Clear pending commands on page change
  useEffect(() => {
    pendingPaddingCommandsRef.current = {}
    pendingMarginCommandsRef.current = {}
  }, [currentPage])

  useEffect(() => {
    return () => {
      pendingPaddingCommandsRef.current = {}
      pendingMarginCommandsRef.current = {}
    }
  }, [])

  // Track ghost grid presence
  useEffect(() => {
    const hasGhostGrid = Object.values(customSections).some(
      (section) => section.definitionId === 'ghostGrid'
    )
    hasGhostGridRef.current = hasGhostGrid
    if (!hasGhostGrid) {
      pendingGhostGridRef.current = false
    }
  }, [customSections])

  // Memoized values
  const templateDefinitions = useMemo(() => listDefinitionsByCategory('template'), [])
  const definitionIconMap = SECTION_ICON_MAP

  const memoizedTemplateOrder = useMemo(
    () => templateItems.map((item) => SECTION_ID_MAP[item.id] || item.id),
    [templateItems]
  )

  const memoizedFooterOrder = useMemo(
    () => footerItems.map((item) => SECTION_ID_MAP[item.id] || item.id),
    [footerItems]
  )

  const customTemplateSectionList = useMemo(() => Object.values(customSections), [customSections])

  // Visibility functions
  const setSectionVisibilityState = useCallback(
    (id: string, hidden: boolean, options?: { silent?: boolean }) => {
      const prevVisibility = cloneVisibilityState(sectionVisibilityRef.current)
      if (prevVisibility[id] === hidden) {
        return
      }
      const nextVisibility = { ...prevVisibility, [id]: hidden }
      if (options?.silent) {
        setSectionVisibility(nextVisibility)
        return
      }
      executeCommand(
        new VisibilityCommand({
          pageId: getHistoryPageId(),
          sectionId: id,
          applyState: () => setSectionVisibility(nextVisibility),
          revertState: () => setSectionVisibility(prevVisibility),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  const toggleSectionVisibility = useCallback(
    (id: string, forceHidden?: boolean, options?: { silent?: boolean }) => {
      const prevVisibility = cloneVisibilityState(sectionVisibilityRef.current)
      const nextHidden = typeof forceHidden === 'boolean' ? forceHidden : !prevVisibility[id]
      if (prevVisibility[id] === nextHidden) {
        return
      }
      const nextVisibility = { ...prevVisibility, [id]: nextHidden }
      if (options?.silent) {
        setSectionVisibility(nextVisibility)
        return
      }
      executeCommand(
        new VisibilityCommand({
          pageId: getHistoryPageId(),
          sectionId: id,
          applyState: () => setSectionVisibility(nextVisibility),
          revertState: () => setSectionVisibility(prevVisibility),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  const syncFeaturedSectionVisibility = useCallback(
    (shouldShow: boolean, options?: { silent?: boolean }) => {
      if (currentPageRef.current !== 'home') {
        return
      }
      const hasFeaturedSection = templateItemsRef.current.some((item) => item.id === 'featured')
      if (!hasFeaturedSection) {
        return
      }
      setSectionVisibilityState('featured', !shouldShow, options)
    },
    [currentPageRef, setSectionVisibilityState]
  )

  // Reorder functions
  const reorderFooterItems = useCallback(
    (startIndex: number, endIndex: number) => {
      const sourceItems = footerItemsRef.current
      const nextItems = reorderSidebarItems(sourceItems, startIndex, endIndex)
      if (!nextItems) {
        return
      }
      const prevItems = cloneSidebarItems(sourceItems)
      executeCommand(
        new ReorderCommand({
          pageId: getHistoryPageId(),
          target: 'footer',
          applyState: () => setFooterItems(nextItems),
          revertState: () => setFooterItems(prevItems),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  const reorderTemplateItems = useCallback(
    (startIndex: number, endIndex: number) => {
      const sourceItems = templateItemsRef.current
      const nextItems = reorderSidebarItems(sourceItems, startIndex, endIndex)
      if (!nextItems) {
        return
      }
      const prevItems = cloneSidebarItems(sourceItems)
      executeCommand(
        new ReorderCommand({
          pageId: getHistoryPageId(),
          target: 'template',
          applyState: () => setTemplateItems(nextItems),
          revertState: () => setTemplateItems(prevItems),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  // Add/Remove functions
  const addTemplateSection = useCallback(
    (definitionId: string) => {
      const definition = getSectionDefinition(definitionId)
      if (!definition) {
        logError(new Error(`Unknown section definition: ${definitionId}`), {
          scope: 'useSectionManager.addTemplateSection'
        })
        return
      }
      const isGhostGrid = definitionId === 'ghostGrid'
      if (isGhostGrid && (hasGhostGridRef.current || pendingGhostGridRef.current)) {
        showToast('Ghost grid already added', 'Only one Ghost grid section is supported.', 'info')
        return
      }

      const existingIds = new Set(templateItemsRef.current.map((item) => item.id))
      let instanceId = generateCustomSectionId(definitionId, existingIds)
      let customConfig: SectionConfigSchema | undefined

      if (definitionId === 'ghostCards') {
        const ghostCardsMeta = buildGhostCardsInstanceMeta(customSectionsRef.current, existingIds)
        instanceId = ghostCardsMeta.instanceId
        customConfig = { ghostPageTag: ghostCardsMeta.ghostPageTag } as SectionConfigSchema
      }

      const instance = buildSectionInstance(definitionId, instanceId, customConfig)
      if (!instance) {
        logError(new Error(`Failed to create section instance: ${definitionId}`), {
          scope: 'useSectionManager.addTemplateSection'
        })
        return
      }

      const prevTemplateItems = cloneSidebarItems(templateItemsRef.current)
      const prevCustomSections = cloneCustomSectionsState(customSectionsRef.current)
      const prevPadding = cloneSectionPaddingState(sectionPaddingRef.current)

      const nextTemplateItems = [
        ...cloneSidebarItems(templateItemsRef.current),
        {
          id: instanceId,
          label: instance.label,
          definitionId,
          icon: definitionIconMap[definitionId] || GhostIcon
        }
      ]
      const nextCustomSections = {
        ...cloneCustomSectionsState(customSectionsRef.current),
        [instanceId]: instance
      }
      const nextPadding = cloneSectionPaddingState(sectionPaddingRef.current)
      if (!nextPadding[instanceId]) {
        const paddingSource = definition.defaultPadding
        if (paddingSource) {
          nextPadding[instanceId] = {
            top: paddingSource.top,
            bottom: paddingSource.bottom,
            left: typeof paddingSource.left === 'number' ? paddingSource.left : 0,
            right: typeof paddingSource.right === 'number' ? paddingSource.right : 0
          }
        }
      }

      if (isGhostGrid) {
        pendingGhostGridRef.current = true
      }

      executeCommand(
        new AddSectionCommand({
          pageId: getHistoryPageId(),
          label: instance.label,
          applyState: () => {
            setTemplateItems(nextTemplateItems)
            setCustomSections(nextCustomSections)
            setSectionPadding(nextPadding)
            if (isGhostGrid) {
              hasGhostGridRef.current = true
              pendingGhostGridRef.current = false
            }
          },
          revertState: () => {
            setTemplateItems(prevTemplateItems)
            setCustomSections(prevCustomSections)
            setSectionPadding(prevPadding)
            if (isGhostGrid) {
              hasGhostGridRef.current = Object.values(prevCustomSections).some(
                (section) => section.definitionId === 'ghostGrid'
              )
              pendingGhostGridRef.current = false
            }
          },
          markDirty: markAsDirty
        })
      )
    },
    [definitionIconMap, executeCommand, getHistoryPageId, markAsDirty, showToast]
  )

  const removeTemplateSection = useCallback(
    (sectionId: string) => {
      const sourceItems = templateItemsRef.current
      if (!sourceItems.some((item) => item.id === sectionId)) {
        return
      }
      const prevTemplateItems = cloneSidebarItems(sourceItems)
      const nextTemplateItems = cloneSidebarItems(sourceItems).filter(
        (item) => item.id !== sectionId
      )
      const prevCustomSections = cloneCustomSectionsState(customSectionsRef.current)
      const nextCustomSections = cloneCustomSectionsState(customSectionsRef.current)
      const removedInstance = nextCustomSections[sectionId]
      delete nextCustomSections[sectionId]

      const removedItem = prevTemplateItems.find((item) => item.id === sectionId)

      executeCommand(
        new RemoveSectionCommand({
          pageId: getHistoryPageId(),
          label: removedItem?.label ?? sectionId,
          applyState: () => {
            setTemplateItems(nextTemplateItems)
            setCustomSections(nextCustomSections)
            if (removedInstance?.definitionId === 'ghostGrid') {
              hasGhostGridRef.current = Object.values(nextCustomSections).some(
                (section) => section.definitionId === 'ghostGrid'
              )
              pendingGhostGridRef.current = false
            }
          },
          revertState: () => {
            setTemplateItems(prevTemplateItems)
            setCustomSections(prevCustomSections)
            if (removedInstance?.definitionId === 'ghostGrid') {
              hasGhostGridRef.current = Object.values(prevCustomSections).some(
                (section) => section.definitionId === 'ghostGrid'
              )
              pendingGhostGridRef.current = false
            }
          },
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  // Padding functions
  const updateSectionPadding = useCallback(
    (
      id: string,
      updater: (padding: {
        top: number
        bottom: number
        left?: number
        right?: number
      }) => { top: number; bottom: number; left?: number; right?: number },
      options?: { recordHistory?: boolean }
    ): PaddingUpdateResult | null => {
      const currentState = sectionPaddingRef.current
      const previousState = cloneSectionPaddingState(currentState)
      const current = previousState[id] ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const next = updater(current)
      const normalized: { top: number; bottom: number; left?: number; right?: number } = {
        top: sanitizePadding(next.top),
        bottom: sanitizePadding(next.bottom)
      }
      if (typeof next.left === 'number') {
        normalized.left = sanitizePadding(next.left)
      }
      if (typeof next.right === 'number') {
        normalized.right = sanitizePadding(next.right)
      }
      const existing = currentState[id]
      if (
        existing &&
        existing.top === normalized.top &&
        existing.bottom === normalized.bottom &&
        (existing.left ?? 0) === (normalized.left ?? 0) &&
        (existing.right ?? 0) === (normalized.right ?? 0)
      ) {
        return null
      }
      const nextState = {
        ...previousState,
        [id]: normalized
      }
      if (options?.recordHistory === false) {
        setSectionPadding(nextState)
        return { previousState, nextState }
      }
      executeCommand(
        new PaddingCommand({
          pageId: getHistoryPageId(),
          label: `Adjust ${id} padding`,
          applyState: () => setSectionPadding(nextState),
          revertState: () => setSectionPadding(previousState),
          markDirty: markAsDirty
        })
      )
      return { previousState, nextState }
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  const previewSectionPaddingChange = useCallback(
    (id: string, updater: Parameters<typeof updateSectionPadding>[1]) => {
      if (!pendingPaddingCommandsRef.current[id]) {
        pendingPaddingCommandsRef.current[id] = {
          previousState: cloneSectionPaddingState(sectionPaddingRef.current)
        }
      }
      updateSectionPadding(id, updater, { recordHistory: false })
    },
    [updateSectionPadding]
  )

  const commitSectionPaddingChange = useCallback(
    (id: string, updater: Parameters<typeof updateSectionPadding>[1]) => {
      const pending = pendingPaddingCommandsRef.current[id]
      if (!pending) {
        updateSectionPadding(id, updater)
        return
      }
      delete pendingPaddingCommandsRef.current[id]
      const result = updateSectionPadding(id, updater, { recordHistory: false })
      const { previousState } = pending
      const nextState = result?.nextState ?? cloneSectionPaddingState(sectionPaddingRef.current)
      if (arePaddingStatesEqual(previousState, nextState)) {
        return
      }
      executeCommand(
        new PaddingCommand({
          pageId: getHistoryPageId(),
          label: `Adjust ${id} padding`,
          applyState: () => setSectionPadding(nextState),
          revertState: () => setSectionPadding(previousState),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty, updateSectionPadding]
  )

  // Margin functions
  const updateSectionMargin = useCallback(
    (
      id: string,
      updater: (margin: { top?: number; bottom?: number }) => { top?: number; bottom?: number },
      options?: { recordHistory?: boolean }
    ): MarginUpdateResult | null => {
      const previousState = cloneSectionMarginState(sectionMarginsRef.current)
      const current = previousState[id] ?? {}
      const next = updater(current)
      const normalized: { top?: number; bottom?: number } = {}
      const nextTop = sanitizeMarginValue(next.top)
      const nextBottom = sanitizeMarginValue(next.bottom)
      if (typeof nextTop === 'number') {
        normalized.top = nextTop
      }
      if (typeof nextBottom === 'number') {
        normalized.bottom = nextBottom
      }

      const existing = sectionMarginsRef.current[id]
      const hasExisting = Boolean(existing)
      const hasNormalized = normalized.top !== undefined || normalized.bottom !== undefined

      if (!hasNormalized && !hasExisting) {
        return null
      }

      const nextState = { ...previousState }
      if (hasNormalized) {
        nextState[id] = normalized
      } else {
        delete nextState[id]
      }

      const isSame =
        hasExisting &&
        existing?.top === normalized.top &&
        existing?.bottom === normalized.bottom &&
        hasNormalized

      if (isSame) {
        return null
      }

      if (options?.recordHistory === false) {
        setSectionMargins(nextState)
        return { previousState, nextState }
      }

      executeCommand(
        new MarginCommand({
          pageId: getHistoryPageId(),
          label: `Adjust ${id} margin`,
          applyState: () => setSectionMargins(nextState),
          revertState: () => setSectionMargins(previousState),
          markDirty: markAsDirty
        })
      )
      return { previousState, nextState }
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  const previewSectionMarginChange = useCallback(
    (id: string, updater: Parameters<typeof updateSectionMargin>[1]) => {
      if (!pendingMarginCommandsRef.current[id]) {
        pendingMarginCommandsRef.current[id] = {
          previousState: cloneSectionMarginState(sectionMarginsRef.current)
        }
      }
      updateSectionMargin(id, updater, { recordHistory: false })
    },
    [updateSectionMargin]
  )

  const commitSectionMarginChange = useCallback(
    (id: string, updater: Parameters<typeof updateSectionMargin>[1]) => {
      const pending = pendingMarginCommandsRef.current[id]
      if (!pending) {
        updateSectionMargin(id, updater)
        return
      }
      delete pendingMarginCommandsRef.current[id]
      const result = updateSectionMargin(id, updater, { recordHistory: false })
      const { previousState } = pending
      const nextState = result?.nextState ?? cloneSectionMarginState(sectionMarginsRef.current)
      if (areMarginStatesEqual(previousState, nextState)) {
        return
      }
      executeCommand(
        new MarginCommand({
          pageId: getHistoryPageId(),
          label: `Adjust ${id} margin`,
          applyState: () => setSectionMargins(nextState),
          revertState: () => setSectionMargins(previousState),
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty, updateSectionMargin]
  )

  // Custom section config
  const updateCustomSectionConfig = useCallback(
    (id: string, updater: (config: SectionConfigSchema) => SectionConfigSchema) => {
      const current = customSectionsRef.current[id]
      if (!current) {
        return
      }
      const nextConfig = updater(current.config)
      if (!nextConfig) {
        return
      }
      const nextInstance = buildSectionInstance(current.definitionId, current.id, nextConfig)
      if (!nextInstance) {
        return
      }

      const prevCustomSections = cloneCustomSectionsState(customSectionsRef.current)
      const nextCustomSections = cloneCustomSectionsState(customSectionsRef.current)
      nextCustomSections[id] = nextInstance

      const prevPadding = cloneSectionPaddingState(sectionPaddingRef.current)
      const nextPadding = cloneSectionPaddingState(sectionPaddingRef.current)
      if (!nextPadding[id]) {
        const definition = getSectionDefinition(current.definitionId)
        const paddingSource = definition?.defaultPadding
        if (paddingSource) {
          nextPadding[id] = {
            top: paddingSource.top,
            bottom: paddingSource.bottom,
            left: typeof paddingSource.left === 'number' ? paddingSource.left : 0,
            right: typeof paddingSource.right === 'number' ? paddingSource.right : 0
          }
        }
      }

      executeCommand(
        new CustomSectionCommand({
          pageId: getHistoryPageId(),
          label: `Edit ${current.label}`,
          applyState: () => {
            setCustomSections(nextCustomSections)
            setSectionPadding(nextPadding)
          },
          revertState: () => {
            setCustomSections(prevCustomSections)
            setSectionPadding(prevPadding)
          },
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, getHistoryPageId, markAsDirty]
  )

  // Subheader spacing
  const applySubheaderSpacing = useCallback(
    (style: string, options?: { recordHistory?: boolean }) => {
      const prevPaddingState = cloneSectionPaddingState(sectionPaddingRef.current)
      const prevMarginState = cloneSectionMarginState(sectionMarginsRef.current)
      const nextPaddingState = cloneSectionPaddingState(sectionPaddingRef.current)
      const nextMarginState = cloneSectionMarginState(sectionMarginsRef.current)

      if (SUBHEADER_MARGIN_STYLES.has(style)) {
        const current = prevMarginState[SUBHEADER_SECTION_ID]
        const nextTop =
          typeof current?.top === 'number'
            ? current.top
            : (subheaderMarginCacheRef.current?.top ?? SUBHEADER_MARGIN_DEFAULT)
        const nextBottom =
          typeof current?.bottom === 'number'
            ? current.bottom
            : (subheaderMarginCacheRef.current?.bottom ?? 0)
        const next = { top: nextTop, bottom: nextBottom }
        subheaderMarginCacheRef.current = next
        nextMarginState[SUBHEADER_SECTION_ID] = next
      } else {
        const current = prevMarginState[SUBHEADER_SECTION_ID]
        if (current?.top !== undefined || current?.bottom !== undefined) {
          subheaderMarginCacheRef.current = current
        }
        delete nextMarginState[SUBHEADER_SECTION_ID]
      }

      const applyPaddingValue = (value: number) => {
        const base =
          nextPaddingState[SUBHEADER_SECTION_ID] ??
          prevPaddingState[SUBHEADER_SECTION_ID] ?? { top: 0, bottom: 0 }
        nextPaddingState[SUBHEADER_SECTION_ID] = {
          ...base,
          top: value,
          bottom: value
        }
      }

      if (SUBHEADER_MARGIN_STYLES.has(style)) {
        applyPaddingValue(0)
      } else {
        const base = prevPaddingState[SUBHEADER_SECTION_ID]
        const nextValue =
          typeof base?.top === 'number' && base.top > 0 ? base.top : SUBHEADER_PADDING_DEFAULT
        applyPaddingValue(nextValue)
      }

      if (SUBHEADER_PADDING_STYLES.has(style)) {
        const base = prevPaddingState[SUBHEADER_SECTION_ID]
        const nextValue =
          typeof base?.top === 'number' && base.top > 0 ? base.top : SUBHEADER_PADDING_DEFAULT
        applyPaddingValue(nextValue)
      }

      const prevMargin = prevMarginState[SUBHEADER_SECTION_ID] ?? {}
      const nextMargin = nextMarginState[SUBHEADER_SECTION_ID] ?? {}
      const marginChanged = JSON.stringify(prevMargin) !== JSON.stringify(nextMargin)
      const prevPadding = prevPaddingState[SUBHEADER_SECTION_ID] ?? {}
      const nextPadding = nextPaddingState[SUBHEADER_SECTION_ID] ?? {}
      const paddingChanged = JSON.stringify(prevPadding) !== JSON.stringify(nextPadding)

      if (!marginChanged && !paddingChanged) {
        return
      }

      if (options?.recordHistory === false) {
        setSectionMargins(nextMarginState)
        setSectionPadding(nextPaddingState)
        return
      }

      executeCommand(
        new HeaderCommand({
          label: 'Adjust header spacing',
          applyState: () => {
            setSectionMargins(nextMarginState)
            setSectionPadding(nextPaddingState)
          },
          revertState: () => {
            setSectionMargins(prevMarginState)
            setSectionPadding(prevPaddingState)
          },
          markDirty: markAsDirty
        })
      )
    },
    [executeCommand, markAsDirty]
  )

  // Hydration
  const hydrateSection = useCallback((data: SectionHydrationData) => {
    setSectionVisibility(data.sectionVisibility)
    setSectionPadding(data.sectionPadding)
    setSectionMargins(data.sectionMargins)
    setTemplateItems(data.templateItems)
    setFooterItems(data.footerItems)
    setCustomSections(data.customSections)
  }, [])

  return {
    // State
    sectionVisibility,
    sectionPadding,
    sectionMargins,
    templateItems,
    footerItems,
    customSections,

    // Refs
    sectionVisibilityRef,
    sectionPaddingRef,
    sectionMarginsRef,
    templateItemsRef,
    footerItemsRef,
    customSectionsRef,

    // Memoized values
    templateDefinitions,
    memoizedTemplateOrder,
    memoizedFooterOrder,
    customTemplateSectionList,
    definitionIconMap,

    // Visibility functions
    setSectionVisibilityState,
    toggleSectionVisibility,
    syncFeaturedSectionVisibility,

    // Reorder functions
    reorderTemplateItems,
    reorderFooterItems,

    // Add/Remove functions
    addTemplateSection,
    removeTemplateSection,

    // Padding functions
    updateSectionPadding,
    previewSectionPaddingChange,
    commitSectionPaddingChange,

    // Margin functions
    updateSectionMargin,
    previewSectionMarginChange,
    commitSectionMarginChange,

    // Custom section functions
    updateCustomSectionConfig,

    // Subheader spacing
    applySubheaderSpacing,

    // Hydration
    hydrateSection,

    // State setters
    setSectionVisibility,
    setSectionPadding,
    setSectionMargins,
    setTemplateItems,
    setFooterItems,
    setCustomSections
  }
}
