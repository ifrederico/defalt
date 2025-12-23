import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { CodeXml, Copy, Trash2, Eye, EyeOff, Clipboard } from 'lucide-react'
import { FOOTER_ROOT_SELECTOR, TEMPLATE_CONTAINER_SELECTOR } from '../../custom-source/handlebars/sectionSelectors'
import { isFixedSection } from '@defalt/utils/config/sectionRegistry'
import { useFrame } from '../AutoFrame/useFrame'
import { getOverlayStyle, resolveSectionElement, type OverlayStyle } from '../overlayUtils'
import {
  heroConfigSchema,
  ghostCardsConfigSchema,
  ghostGridConfigSchema,
  imageWithTextConfigSchema,
  type SectionInstance,
  getSectionDefinition
} from '@defalt/sections/engine'
import {
  resolveContainerPaddingX,
  resolveImageAspectRatio,
  resolveImageColumns,
  resolveHeroDefaultTag,
  resolveImageWithTextDefaultTag,
  resolveGhostCardsDefaultTag,
  toTagFilter
} from '@defalt/rendering/derived/sectionDerived'
import { formatInternalTag } from '@defalt/sections/utils/tagUtils'
import { sanitizeHexColor } from '@defalt/utils/security/sanitizers'
import { DEFAULT_CUSTOM_SECTION_PADDING, type SectionPadding } from '@defalt/utils/config/themeConfig'
import { withBasePath } from '@defalt/utils/env/basePath'

type SectionActionBarProps = {
  selectedSectionId?: string | null
  hiddenSections?: Record<string, boolean>
  customSectionIds?: string[]
  aiSectionIds?: string[]
  customSections?: SectionInstance[]
  sectionPadding?: Record<string, SectionPadding>
  onToggleVisibility?: (sectionId: string) => void
  onDuplicateSection?: (sectionId: string) => void
  onRemoveSection?: (sectionId: string) => void
  renderKey?: string
  layoutKey?: unknown
}

const ACTION_BAR_SPACE = 8
const ACTION_BAR_SIDE = ACTION_BAR_SPACE
const ACTION_BAR_MIN_TOP = 12

const isAnnouncementSection = (sectionId: string) =>
  sectionId === 'announcement-bar' || sectionId.startsWith('announcement-bar-')
const isFooterParentSection = (sectionId: string) => sectionId.toLowerCase() === 'footer'
const isFooterChildSection = (sectionId: string) => {
  const normalized = sectionId.toLowerCase()
  return normalized === 'footerbar' || normalized === 'footer-bar' || normalized === 'footersignup' || normalized === 'footer-signup'
}

const TEMPLATE_SNIPPET_CACHE = new Map<string, string>()
const TEMPLATE_SNIPPET_CACHE_VERSION = 'clean-v4'
const PARTIAL_FILENAME_MAP: Record<string, string> = {
  hero: 'defalt-hero.hbs',
  ghostCards: 'defalt-ghost-cards.hbs',
  ghostGrid: 'defalt-ghost-grid.hbs',
  'image-with-text': 'defalt-image-with-text.hbs'
}

const normalizePaddingValue = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return Math.max(0, Math.round(fallback))
}

const resolvePadding = (padding?: SectionPadding): SectionPadding => {
  const base = padding ?? DEFAULT_CUSTOM_SECTION_PADDING
  return {
    top: normalizePaddingValue(base.top, DEFAULT_CUSTOM_SECTION_PADDING.top),
    bottom: normalizePaddingValue(base.bottom, DEFAULT_CUSTOM_SECTION_PADDING.bottom),
    left: normalizePaddingValue(base.left ?? 0, DEFAULT_CUSTOM_SECTION_PADDING.left ?? 0),
    right: normalizePaddingValue(base.right ?? 0, DEFAULT_CUSTOM_SECTION_PADDING.right ?? 0)
  }
}

const buildSectionStyle = (padding: SectionPadding): string => {
  const styles: string[] = []
  if (padding.top > 0) styles.push(`padding-top: ${padding.top}px`)
  if (padding.bottom > 0) styles.push(`padding-bottom: ${padding.bottom}px`)
  if ((padding.left ?? 0) > 0) styles.push(`padding-left: ${padding.left}px`)
  if ((padding.right ?? 0) > 0) styles.push(`padding-right: ${padding.right}px`)
  return styles.join('; ')
}

const resolveGhostGridDefaultTags = (instanceId: string): { left: string; right: string } => {
  const baseId = 'ghost-grid'
  let suffix = ''
  if (instanceId !== baseId && instanceId.startsWith(`${baseId}-`)) {
    const raw = Number.parseInt(instanceId.slice(baseId.length + 1), 10)
    if (Number.isFinite(raw) && raw > 1) {
      suffix = `-${raw}`
    }
  }
  return {
    left: `#grid-left${suffix}`,
    right: `#grid-right${suffix}`
  }
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const stripPreviewBlocks = (template: string): string => {
  const withoutPagesElse = template.replace(
    /\{\{#if\s+pages\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g,
    '{{#if pages}}$1{{/if}}'
  )
  const withoutPostsElse = withoutPagesElse.replace(
    /\{\{#if\s+posts\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g,
    '{{#if posts}}$1{{/if}}'
  )
  const withoutElsePreview = withoutPostsElse.replace(
    /\{\{else\}\}\s*\{\{#if\s+isPreview\}\}[\s\S]*?\{\{\/if\}\}/g,
    ''
  )
  return withoutElsePreview.replace(/\{\{#if\s+isPreview\}\}[\s\S]*?\{\{\/if\}\}/g, '')
}

const stripPlaceholderCss = (template: string): string =>
  template.replace(
    /(^|\n)\s*[^\n{]*placeholder[^\n{]*\{[\s\S]*?\}\s*/g,
    '\n'
  )

const tidyTemplateWhitespace = (template: string): string =>
  template
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s*\n<\/style>/g, '\n</style>')
    .trim()

const sanitizeTemplateForCopy = (template: string): string =>
  tidyTemplateWhitespace(stripPlaceholderCss(stripPreviewBlocks(template)))

const inlineStylePartialForCopy = async (templatePath: string, template: string): Promise<string> => {
  if (!templatePath.endsWith('.hbs')) {
    return template
  }
  const styleTemplatePath = templatePath.replace(/\.hbs$/, '.styles.hbs')
  const stylePartialName = `sections/${templatePath.replace(/\.hbs$/, '.styles')}`
  const regex = new RegExp(`\\{\\{>\\s*["']${escapeRegExp(stylePartialName)}["']\\s*\\}\\}`, 'g')

  try {
    const url = withBasePath(`/sections/${styleTemplatePath}`)
    const response = await fetch(url)
    if (!response.ok) {
      return template
    }
    const styleContent = await response.text()
    return template.replace(regex, styleContent.trim())
  } catch {
    return template
  }
}

const buildSectionSnippet = (section: SectionInstance, padding?: SectionPadding): string => {
  const sectionStyle = buildSectionStyle(resolvePadding(padding))

  if (section.definitionId === 'hero') {
    const parsed = heroConfigSchema.safeParse(section.config ?? {})
    const heroConfig = parsed.success ? parsed.data : heroConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(heroConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(heroConfig.backgroundColor, 'transparent')
    const internalTag = formatInternalTag(heroConfig.tags?.primary) || resolveHeroDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)
    const imageOnRight = heroConfig.invert === true || heroConfig.imagePosition === 'right'
    const { imageColumn, textColumn } = resolveImageColumns(heroConfig.imageWidth)
    const imageAspectRatio = resolveImageAspectRatio(heroConfig.imageAspect)
    const imageBorderRadius = Math.max(0, Math.min(96, Math.round(heroConfig.imageBorderRadius)))

    return `{{> "defalt-hero" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(heroConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} textAlignment=${JSON.stringify(heroConfig.textAlignment)} pageTitle=${heroConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  if (section.definitionId === 'ghostCards') {
    const parsed = ghostCardsConfigSchema.safeParse(section.config ?? {})
    const cardsConfig = parsed.success ? parsed.data : ghostCardsConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(cardsConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(cardsConfig.backgroundColor, 'transparent')
    const internalTag = formatInternalTag(cardsConfig.tags?.primary) || resolveGhostCardsDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)

    return `{{> "defalt-ghost-cards" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(cardsConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${cardsConfig.pageTitle} textAlignment=${JSON.stringify(cardsConfig.textAlignment)} titleSize=${JSON.stringify(cardsConfig.titleSize)} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  if (section.definitionId === 'ghostGrid') {
    const parsed = ghostGridConfigSchema.safeParse(section.config ?? {})
    const gridConfig = parsed.success ? parsed.data : ghostGridConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(gridConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(gridConfig.backgroundColor, 'transparent')
    const defaults = resolveGhostGridDefaultTags(section.id)
    const internalTagLeft = formatInternalTag(gridConfig.tags?.left) || defaults.left
    const internalTagRight = formatInternalTag(gridConfig.tags?.right) || defaults.right
    const leftTagFilter = toTagFilter(internalTagLeft)
    const rightTagFilter = toTagFilter(internalTagRight)
    const anyTagFilter = `${leftTagFilter},${rightTagFilter}`

    return `{{> "defalt-ghost-grid" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(gridConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} pageTitle=${gridConfig.pageTitle} textAlignment=${JSON.stringify(gridConfig.textAlignment)} titleSize=${JSON.stringify(gridConfig.titleSize)} stackOnMobile=${gridConfig.stackOnMobile} gap=${gridConfig.gap} leftTagFilter=${JSON.stringify(leftTagFilter)} rightTagFilter=${JSON.stringify(rightTagFilter)} anyTagFilter=${JSON.stringify(anyTagFilter)} internalTagLeft=${JSON.stringify(internalTagLeft)} internalTagRight=${JSON.stringify(internalTagRight)} }}`
  }

  if (section.definitionId === 'image-with-text') {
    const parsed = imageWithTextConfigSchema.safeParse(section.config ?? {})
    const imageTextConfig = parsed.success ? parsed.data : imageWithTextConfigSchema.parse({})
    const containerPaddingX = resolveContainerPaddingX(imageTextConfig.contentWidth)
    const backgroundColor = sanitizeHexColor(imageTextConfig.backgroundColor, 'transparent')
    const innerBackgroundColor = sanitizeHexColor(imageTextConfig.innerBackgroundColor, 'transparent')
    const innerBackgroundPadding = Math.max(0, Math.min(120, Math.round(imageTextConfig.innerBackgroundPadding)))
    const innerBackgroundRadius = Math.max(0, Math.min(96, Math.round(imageTextConfig.innerBackgroundRadius)))
    const internalTag = formatInternalTag(imageTextConfig.tags?.primary) || resolveImageWithTextDefaultTag(section.id)
    const tagFilter = toTagFilter(internalTag)
    const imageOnRight = imageTextConfig.invert === true || imageTextConfig.imagePosition === 'right'
    const { imageColumn, textColumn } = resolveImageColumns(imageTextConfig.imageWidth)
    const imageAspectRatio = resolveImageAspectRatio(imageTextConfig.imageAspect)
    const imageBorderRadius = Math.max(0, Math.min(96, Math.round(imageTextConfig.imageBorderRadius)))

    return `{{> "defalt-image-with-text" sectionId=${JSON.stringify(section.id)} sectionStyle=${JSON.stringify(sectionStyle)} contentWidth=${JSON.stringify(imageTextConfig.contentWidth)} containerPaddingX=${JSON.stringify(containerPaddingX)} backgroundColor=${JSON.stringify(backgroundColor)} innerBackgroundColor=${JSON.stringify(innerBackgroundColor)} innerBackgroundPadding=${innerBackgroundPadding} innerBackgroundRadius=${innerBackgroundRadius} textAlignment=${JSON.stringify(imageTextConfig.textAlignment)} pageTitle=${imageTextConfig.pageTitle} imageOnRight=${imageOnRight} imageColumn=${JSON.stringify(imageColumn)} textColumn=${JSON.stringify(textColumn)} imageAspectRatio=${JSON.stringify(imageAspectRatio)} imageBorderRadius=${imageBorderRadius} tagFilter=${JSON.stringify(tagFilter)} internalTag=${JSON.stringify(internalTag)} }}`
  }

  return ''
}

export function SectionActionBar({
  selectedSectionId,
  hiddenSections,
  customSectionIds = [],
  aiSectionIds = [],
  customSections = [],
  sectionPadding,
  onToggleVisibility,
  onDuplicateSection,
  onRemoveSection,
  renderKey,
  layoutKey,
}: SectionActionBarProps) {
  const { document: frameDocument } = useFrame()
  const barRef = useRef<HTMLDivElement>(null)
  const copyTimeoutRef = useRef<number | null>(null)
  const [overlayStyle, setOverlayStyle] = useState<OverlayStyle | null>(null)
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null)
  const [isCodeOpen, setIsCodeOpen] = useState(false)
  const [partialSnippet, setPartialSnippet] = useState<string>('')
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false)
  const [copyStatus, setCopyStatus] = useState<{ target: 'include' | 'partial'; status: 'success' | 'error' } | null>(null)

  const selectedId = selectedSectionId ?? null
  const isHidden = selectedId ? Boolean(hiddenSections?.[selectedId]) : false
  const isFixed = selectedId ? isFixedSection(selectedId) : false
  const isCustom = selectedId
    ? customSectionIds.includes(selectedId) || aiSectionIds.includes(selectedId)
    : false
  const selectedCustomSection = useMemo(
    () => (selectedId ? customSections.find((section) => section.id === selectedId) ?? null : null),
    [customSections, selectedId]
  )
  const includeSnippet = useMemo(() => {
    if (!selectedCustomSection) {
      return ''
    }
    return buildSectionSnippet(selectedCustomSection, sectionPadding?.[selectedCustomSection.id])
  }, [selectedCustomSection, sectionPadding])
  const canShowCode = Boolean(selectedCustomSection && includeSnippet)
  const canDuplicate = Boolean(selectedId && onDuplicateSection && isCustom && !isFixed)
  const canDelete = Boolean(selectedId && onRemoveSection && isCustom && !isFixed)
  const canToggleVisibility = Boolean(selectedId && onToggleVisibility)

  const updatePosition = useCallback(() => {
    if (!selectedId || !frameDocument) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    if (isAnnouncementSection(selectedId) || isHidden) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    const target = resolveSectionElement(frameDocument, selectedId)
    if (!target) {
      setOverlayStyle(null)
      setTargetEl(null)
      return
    }

    const element = target as HTMLElement
    let nextStyle = getOverlayStyle(element)

    if (isFooterChildSection(selectedId)) {
      const footerRoot = frameDocument.querySelector<HTMLElement>(FOOTER_ROOT_SELECTOR)
      if (footerRoot) {
        const footerStyle = getOverlayStyle(footerRoot)
        nextStyle = {
          ...nextStyle,
          left: footerStyle.left,
          width: footerStyle.width,
        }
      }
    }

    if (isFooterParentSection(selectedId)) {
      const computed = frameDocument.defaultView?.getComputedStyle(element)
      const marginTop = computed ? Number.parseFloat(computed.marginTop) || 0 : 0
      if (marginTop > 0) {
        nextStyle = {
          ...nextStyle,
          top: nextStyle.top - marginTop,
        }
      }
    }

    setTargetEl((current) => (current !== element ? element : current))
    setOverlayStyle(nextStyle)
  }, [frameDocument, selectedId, isHidden])

  const applyActionBarPosition = useCallback(() => {
    const node = barRef.current
    if (!node) {
      return
    }

    const barHeight = node.offsetHeight || 0
    const desiredTop = -(barHeight + ACTION_BAR_SPACE)

    node.style.left = ''
    node.style.top = `${desiredTop}px`
    node.style.transformOrigin = 'right top'

    const rect = node.getBoundingClientRect()
    const exceedsBoundsTop = rect.y < ACTION_BAR_MIN_TOP

    if (exceedsBoundsTop) {
      node.style.top = `${ACTION_BAR_MIN_TOP}px`
    }
  }, [])

  const syncActionsPosition = useCallback((node: HTMLDivElement | null) => {
    barRef.current = node
    applyActionBarPosition()
  }, [applyActionBarPosition])

  useEffect(() => {
    updatePosition()
  }, [updatePosition, renderKey, layoutKey, isHidden])

  useEffect(() => {
    applyActionBarPosition()
  }, [applyActionBarPosition, overlayStyle, selectedId])

  useEffect(() => {
    if (!targetEl) {
      return
    }
    const observer = new ResizeObserver(() => updatePosition())
    observer.observe(targetEl)
    return () => observer.disconnect()
  }, [targetEl, updatePosition])

  useEffect(() => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }
    setIsCodeOpen(false)
    setPartialSnippet('')
    setIsLoadingSnippet(false)
    setCopyStatus(null)
  }, [selectedId])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
        copyTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isCodeOpen || !frameDocument) {
      return
    }
    const handleClick = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null
      if (barRef.current && target && !barRef.current.contains(target)) {
        setIsCodeOpen(false)
      }
    }
    frameDocument.addEventListener('mousedown', handleClick)
    return () => frameDocument.removeEventListener('mousedown', handleClick)
  }, [frameDocument, isCodeOpen])

  useEffect(() => {
    if (!isCodeOpen || !selectedCustomSection) {
      return
    }

    const definition = getSectionDefinition(selectedCustomSection.definitionId)
    const templatePath = definition?.templatePath
    if (!templatePath) {
      setPartialSnippet('')
      return
    }

    const cacheKey = `${templatePath}::${TEMPLATE_SNIPPET_CACHE_VERSION}`
    if (TEMPLATE_SNIPPET_CACHE.has(cacheKey)) {
      setPartialSnippet(TEMPLATE_SNIPPET_CACHE.get(cacheKey) ?? '')
      return
    }

    let cancelled = false
    setIsLoadingSnippet(true)
    const loadTemplate = async () => {
      try {
        const url = withBasePath(`/sections/${templatePath}`)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Template fetch failed: ${response.status}`)
        }
        const content = await response.text()
        const inlined = await inlineStylePartialForCopy(templatePath, content)
        const sanitized = sanitizeTemplateForCopy(inlined)
        if (cancelled) return
        TEMPLATE_SNIPPET_CACHE.set(cacheKey, sanitized)
        setPartialSnippet(sanitized)
      } catch {
        if (!cancelled) {
          setPartialSnippet('')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSnippet(false)
        }
      }
    }
    void loadTemplate()

    return () => {
      cancelled = true
    }
  }, [isCodeOpen, selectedCustomSection])

  useEffect(() => {
    const win = frameDocument?.defaultView
    if (!win) {
      return
    }

    let rafId: number | null = null
    const schedulePositionUpdate = () => {
      if (rafId !== null) {
        return
      }
      rafId = win.requestAnimationFrame(() => {
        rafId = null
        updatePosition()
      })
    }

    const handleScroll = () => {
      schedulePositionUpdate()
    }

    const handleResize = () => {
      schedulePositionUpdate()
    }

    const scrollTargets: Array<Window | HTMLElement> = [win]
    const viewport = frameDocument.querySelector<HTMLElement>(TEMPLATE_CONTAINER_SELECTOR)
    if (viewport && viewport !== frameDocument.documentElement && viewport !== frameDocument.body) {
      scrollTargets.push(viewport)
    }

    scrollTargets.forEach((target) => target.addEventListener('scroll', handleScroll, { passive: true }))
    win.addEventListener('resize', handleResize)

    return () => {
      scrollTargets.forEach((target) => target.removeEventListener('scroll', handleScroll))
      win.removeEventListener('resize', handleResize)
      if (rafId !== null) {
        win.cancelAnimationFrame(rafId)
      }
    }
  }, [frameDocument, updatePosition, renderKey])

  if (!selectedId || isAnnouncementSection(selectedId) || isHidden) {
    return null
  }

  const wrapperStyle: CSSProperties = overlayStyle
    ? {
        top: overlayStyle.top,
        left: overlayStyle.left,
        width: overlayStyle.width,
        height: overlayStyle.height,
      }
    : {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }

  const handleDuplicate = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDuplicate && selectedId) {
      onDuplicateSection?.(selectedId)
    }
  }

  const handleDelete = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDelete && selectedId) {
      onRemoveSection?.(selectedId)
    }
  }

  const handleToggleVisibility = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (canToggleVisibility && selectedId) {
      onToggleVisibility?.(selectedId)
    }
  }

  const handleToggleCode = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canShowCode) {
      return
    }
    setIsCodeOpen((current) => !current)
  }

  const notifyCopySuccess = (target: 'include' | 'partial') => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
    }
    setCopyStatus({ target, status: 'success' })
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null)
      copyTimeoutRef.current = null
    }, 1200)
  }

  const notifyCopyFailure = (target: 'include' | 'partial') => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
    }
    setCopyStatus({ target, status: 'error' })
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null)
      copyTimeoutRef.current = null
    }, 1200)
  }

  const handleCopySnippet = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!includeSnippet) {
      return
    }
    const clipboard = frameDocument?.defaultView?.navigator?.clipboard ?? navigator.clipboard
    if (clipboard?.writeText) {
      void clipboard
        .writeText(includeSnippet)
        .then(() => notifyCopySuccess('include'))
        .catch(() => {
          notifyCopyFailure('include')
        })
      return
    }
    if (frameDocument) {
      const textarea = frameDocument.createElement('textarea')
      textarea.value = includeSnippet
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      frameDocument.body.appendChild(textarea)
      textarea.select()
      try {
        const copied = frameDocument.execCommand('copy')
        if (copied) {
          notifyCopySuccess('include')
        } else {
          notifyCopyFailure('include')
        }
      } catch {
        notifyCopyFailure('include')
      } finally {
        frameDocument.body.removeChild(textarea)
      }
    }
  }

  const handleCopyPartial = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!partialSnippet) {
      return
    }
    const clipboard = frameDocument?.defaultView?.navigator?.clipboard ?? navigator.clipboard
    if (clipboard?.writeText) {
      void clipboard
        .writeText(partialSnippet)
        .then(() => notifyCopySuccess('partial'))
        .catch(() => {
          notifyCopyFailure('partial')
        })
      return
    }
    if (frameDocument) {
      const textarea = frameDocument.createElement('textarea')
      textarea.value = partialSnippet
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      frameDocument.body.appendChild(textarea)
      textarea.select()
      try {
        const copied = frameDocument.execCommand('copy')
        if (copied) {
          notifyCopySuccess('partial')
        } else {
          notifyCopyFailure('partial')
        }
      } catch {
        notifyCopyFailure('partial')
      } finally {
        frameDocument.body.removeChild(textarea)
      }
    }
  }

  return (
    <div className="df-action-bar-overlay" style={wrapperStyle}>
      <div className="df-action-bar-overlay-inner" style={{ top: 0 }}>
        <div
          ref={syncActionsPosition}
          className="df-action-bar"
          style={{
            top: 0,
            right: 16,
            paddingLeft: ACTION_BAR_SIDE,
            paddingRight: ACTION_BAR_SIDE,
          }}
        >
          {canShowCode && (
            <button
              type="button"
              aria-label="Show section code"
              aria-expanded={isCodeOpen}
              onClick={handleToggleCode}
            >
              <CodeXml size={16} />
            </button>
          )}
          {canShowCode && <span className="df-action-bar__separator" aria-hidden="true" />}
          <button
            type="button"
            aria-label={isHidden ? 'Show section' : 'Hide section'}
            onClick={handleToggleVisibility}
            disabled={!canToggleVisibility}
          >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            aria-label="Duplicate section"
            onClick={handleDuplicate}
            disabled={!canDuplicate}
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            aria-label="Delete section"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            <Trash2 size={16} />
          </button>
          {isCodeOpen && canShowCode && (
            <div className="df-action-bar__popover" onClick={(event) => event.stopPropagation()}>
              <div className="df-action-bar__popover-header">
                <span>home.hbs</span>
                <div className="df-action-bar__copy-group">
                  {copyStatus?.target === 'include' && (
                    <span
                      className={`df-action-bar__copy-status${
                        copyStatus.status === 'success'
                          ? ' df-action-bar__copy-status--success'
                          : ' df-action-bar__copy-status--error'
                      }`}
                    >
                      {copyStatus.status === 'success' ? '✓ Copied' : 'Copy failed'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="df-action-bar__copy"
                    onClick={handleCopySnippet}
                    aria-label="Copy home.hbs snippet"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
              </div>
              <pre className="df-action-bar__code">{includeSnippet}</pre>
              <div className="df-action-bar__popover-header">
                <span>
                  {selectedCustomSection?.definitionId
                    ? `partials/${PARTIAL_FILENAME_MAP[selectedCustomSection.definitionId] ?? 'partial.hbs'}`
                    : 'partials/partial.hbs'}
                </span>
                <div className="df-action-bar__copy-group">
                  {copyStatus?.target === 'partial' && (
                    <span
                      className={`df-action-bar__copy-status${
                        copyStatus.status === 'success'
                          ? ' df-action-bar__copy-status--success'
                          : ' df-action-bar__copy-status--error'
                      }`}
                    >
                      {copyStatus.status === 'success' ? '✓ Copied' : 'Copy failed'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="df-action-bar__copy"
                    onClick={handleCopyPartial}
                    disabled={!partialSnippet}
                    aria-label="Copy partial snippet"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>
              </div>
              <pre className="df-action-bar__code">
                {isLoadingSnippet ? 'Loading template…' : (partialSnippet || 'Template unavailable.')}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
