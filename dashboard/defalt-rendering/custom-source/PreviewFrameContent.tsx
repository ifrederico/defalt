/**
 * PreviewFrameContent - Handles DOM manipulation within the iframe preview
 *
 * This component runs inside the AutoFrame context and manages:
 * - Injecting HTML into the iframe
 * - Syncing header/announcement bar customizations
 * - Handling section selection and visibility
 * - Scroll management
 */

import { useCallback, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
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
  syncSectionVisibility
} from './handlebars/domManipulation'
import { applyHeaderCustomizations, type HeaderCustomizationOptions } from './handlebars/headerCustomization'
import { useFrame } from '../components/AutoFrame/useFrame'

export interface PreviewFrameContentProps {
  renderedHtml: string
  templateOrderRef: MutableRefObject<string[]>
  footerOrderRef: MutableRefObject<string[]>
  headerOptions: HeaderCustomizationOptions
  announcementBars: Array<{ id: string; html: string; hidden: boolean }>
  customCss?: string
  customSections: Array<{ id: string; html: string; hidden: boolean }>
  selectedSectionId: string | null
  hiddenSections: Record<string, boolean>
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
  onLayoutUpdate?: () => void
}

export function PreviewFrameContent({
  renderedHtml,
  templateOrderRef,
  footerOrderRef,
  headerOptions,
  announcementBars,
  customCss,
  customSections,
  selectedSectionId,
  hiddenSections,
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
  onLayoutUpdate
}: PreviewFrameContentProps) {
  const { document: frameDocument, frameRoot } = useFrame()
  const hasInjectedRef = useRef(false)
  const sectionSelectionCleanupRef = useRef<(() => void) | null>(null)
  const previewNavigationCleanupRef = useRef<(() => void) | null>(null)
  const prevSelectedSectionIdRef = useRef<string | null>(null)

  const scheduleLayoutUpdate = useCallback(() => {
    if (!onLayoutUpdate) {
      return
    }
    const win = frameDocument?.defaultView
    if (!win) {
      onLayoutUpdate()
      return
    }
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => {
        onLayoutUpdate()
      })
    })
  }, [frameDocument, onLayoutUpdate])

  // Reset injection flag when frame changes
  useEffect(() => {
    hasInjectedRef.current = false
  }, [frameDocument, frameRoot])

  // Inject HTML into frame
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
      selectedSectionId: selectedSectionId ?? null
    })
    scheduleLayoutUpdate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-inject on HTML changes
  }, [renderedHtml, frameDocument, frameRoot])

  // Setup preview navigation
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

  // Apply header customizations and announcement bars
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    const update = () => {
      applyHeaderCustomizations(frameDocument, headerOptions)
      syncAnnouncementBars(frameDocument, announcementBars)
      applyCustomCss(frameDocument, customCss)
      scheduleLayoutUpdate()
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [frameDocument, headerOptions, announcementBars, customCss, scheduleLayoutUpdate])

  // Update color variables
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

  // Sync template sections
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    const update = () => {
      syncTemplateSections(frameDocument, customSections)
      applyHeaderCustomizations(frameDocument, headerOptions)
      scheduleLayoutUpdate()
    }

    if (win) {
      win.requestAnimationFrame(update)
    } else {
      update()
    }
  }, [frameDocument, customSections, headerOptions, scheduleLayoutUpdate])

  // Reorder template sections
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    if (win) {
      win.requestAnimationFrame(() => {
        reorderTemplateInDOM(frameDocument, filteredTemplateOrder)
        scheduleLayoutUpdate()
      })
    } else {
      reorderTemplateInDOM(frameDocument, filteredTemplateOrder)
      scheduleLayoutUpdate()
    }
  }, [frameDocument, filteredTemplateOrder, scheduleLayoutUpdate])

  // Reorder footer sections
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    const win = frameDocument.defaultView
    if (win) {
      win.requestAnimationFrame(() => {
        reorderFooterInDOM(frameDocument, footerOrder)
        scheduleLayoutUpdate()
      })
    } else {
      reorderFooterInDOM(frameDocument, footerOrder)
      scheduleLayoutUpdate()
    }
  }, [frameDocument, footerOrder, scheduleLayoutUpdate])

  // Setup section selection
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument || !renderedHtml) return

    if (sectionSelectionCleanupRef.current) {
      sectionSelectionCleanupRef.current()
      sectionSelectionCleanupRef.current = null
    }

    if (onSectionSelect && sectionIdsForPreview.length > 0) {
      sectionSelectionCleanupRef.current = setupSectionSelection(
        frameDocument,
        sectionIdsForPreview,
        onSectionSelect,
        onFrameHoverChange
      )
    }

    return () => {
      if (sectionSelectionCleanupRef.current) {
        sectionSelectionCleanupRef.current()
        sectionSelectionCleanupRef.current = null
      }
    }
  }, [frameDocument, renderedHtml, onSectionSelect, onFrameHoverChange, sectionIdsForPreview])

  // Sync selected section attribute
  useEffect(() => {
    if (!frameDocument) return
    syncSelectedSectionAttribute(frameDocument, selectedSectionId ?? null)
  }, [frameDocument, selectedSectionId])

  // Sync section visibility
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return
    syncSectionVisibility(frameDocument, sectionIdsForPreview, hiddenSections)
  }, [frameDocument, hiddenSections, sectionIdsForPreview])

  // Scroll to selected section on selection change
  useEffect(() => {
    if (!hasInjectedRef.current || !frameDocument) return

    const selectionChanged = prevSelectedSectionIdRef.current !== selectedSectionId
    prevSelectedSectionIdRef.current = selectedSectionId ?? null

    if (!selectionChanged || !selectedSectionId) {
      return
    }

    scrollToSection(frameDocument, selectedSectionId)
  }, [frameDocument, selectedSectionId])

  // Handle scroll to section requests
  useEffect(() => {
    if (!frameDocument || !scrollToSectionId || !hasInjectedRef.current) return
    scrollToSection(frameDocument, scrollToSectionId)
    onScrollComplete?.()
  }, [frameDocument, scrollToSectionId, onScrollComplete])

  return null
}
