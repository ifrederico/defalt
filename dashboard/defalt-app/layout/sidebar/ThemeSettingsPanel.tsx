import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Separator from '@radix-ui/react-separator'
import CodeMirror from '@uiw/react-codemirror'
import { css } from '@codemirror/lang-css'
import { PanelHeader, ColorPickerSetting, ToggleSwitch, TextInput } from '@defalt/ui'
import { sanitizeHex } from '@defalt/utils/color/colorUtils'
import { Check, ChevronDown } from 'lucide-react'

const FIELD_STACK = 'space-y-2'
const LABEL_CLASS = 'font-md font-medium text-foreground'
const LABEL_DISABLED_CLASS = 'text-placeholder'
const HELPER_CLASS = 'font-sm text-muted'
const HELPER_DISABLED_CLASS = 'text-placeholder'
const SECTION_PADDING = 'pl-4 pr-6 pt-3 pb-5 space-y-4'
const SECTION_HEADER = 'w-full pl-4 pr-6 py-3 flex items-center justify-between hover:bg-subtle transition-colors'

export type ThemeSettingsPanelProps = {
  accentColor: string
  onAccentColorChange: (value: string) => void
  backgroundColor: string
  onBackgroundColorChange: (value: string) => void
  navigationLayoutValue: string
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  onNavigationLayoutChange: (value: string) => void
  headerAndFooterColorValue: string
  headerAndFooterColorOptions: string[]
  onHeaderAndFooterColorChange: (value: string) => void
  titleFontValue: string
  titleFontOptions: string[]
  onTitleFontChange: (value: string) => void
  bodyFontValue: string
  bodyFontOptions: string[]
  onBodyFontChange: (value: string) => void
  isFooterBarHidden: boolean
  signupHeadingValue: string
  onSignupHeadingChange: (value: string) => void
  signupSubheadingValue: string
  onSignupSubheadingChange: (value: string) => void
  headerStyleValue: string
  headerStyleOptions: string[]
  onHeaderStyleChange: (value: string) => void
  headerTextValue: string
  onHeaderTextChange: (value: string) => void
  backgroundImageEnabled: boolean
  onBackgroundImageToggle: (value: boolean) => void
  showFeaturedPosts: boolean
  onShowFeaturedPostsToggle: (value: boolean) => void
  postFeedStyleValue: string
  postFeedStyleOptions: string[]
  onPostFeedStyleChange: (value: string) => void
  showImagesInFeed: boolean
  onShowImagesInFeedToggle: (value: boolean) => void
  showAuthor: boolean
  onShowAuthorToggle: (value: boolean) => void
  showPublishDate: boolean
  onShowPublishDateToggle: (value: boolean) => void
  showPublicationInfoSidebar: boolean
  onShowPublicationInfoSidebarToggle: (value: boolean) => void
  showPostMetadata: boolean
  onShowPostMetadataToggle: (value: boolean) => void
  enableDropCapsOnPosts: boolean
  onEnableDropCapsOnPostsToggle: (value: boolean) => void
  showRelatedArticles: boolean
  onShowRelatedArticlesToggle: (value: boolean) => void
  customCSS: string
  onCustomCSSChange: (value: string) => void
}

export function ThemeSettingsPanel({
  accentColor,
  onAccentColorChange,
  backgroundColor,
  onBackgroundColorChange,
  navigationLayoutValue,
  navigationLayoutOptions,
  navigationLayoutError,
  onNavigationLayoutChange,
  headerAndFooterColorValue,
  headerAndFooterColorOptions,
  onHeaderAndFooterColorChange,
  titleFontValue,
  titleFontOptions,
  onTitleFontChange,
  bodyFontValue,
  bodyFontOptions,
  onBodyFontChange,
  isFooterBarHidden,
  signupHeadingValue,
  onSignupHeadingChange,
  signupSubheadingValue,
  onSignupSubheadingChange,
  headerStyleValue,
  headerStyleOptions,
  onHeaderStyleChange,
  headerTextValue,
  onHeaderTextChange,
  backgroundImageEnabled,
  onBackgroundImageToggle,
  showFeaturedPosts,
  onShowFeaturedPostsToggle,
  postFeedStyleValue,
  postFeedStyleOptions,
  onPostFeedStyleChange,
  showImagesInFeed,
  onShowImagesInFeedToggle,
  showAuthor,
  onShowAuthorToggle,
  showPublishDate,
  onShowPublishDateToggle,
  showPublicationInfoSidebar,
  onShowPublicationInfoSidebarToggle,
  showPostMetadata,
  onShowPostMetadataToggle,
  enableDropCapsOnPosts,
  onEnableDropCapsOnPostsToggle,
  showRelatedArticles,
  onShowRelatedArticlesToggle,
  customCSS,
  onCustomCSSChange,
}: ThemeSettingsPanelProps) {
  const [siteWideExpanded, setSiteWideExpanded] = useState(true)
  const [homepageExpanded, setHomepageExpanded] = useState(true)
  const [postExpanded, setPostExpanded] = useState(true)
  const [cssExpanded, setCssExpanded] = useState(false)

  const accentColorSwatches = useMemo(() => ([
    { title: 'Accent', hex: '#AC1E3E', accent: true },
    { title: 'Black', hex: '#000000' },
    { title: 'White', hex: '#ffffff' }
  ]), [])

  const backgroundColorSwatches = useMemo(() => ([
    { title: 'Accent', hex: '#AC1E3E', accent: true },
    { title: 'Black', hex: '#000000' },
    { title: 'White', hex: '#ffffff' }
  ]), [])

  const backgroundImageToggleEnabled = useMemo(() => ['Landing', 'Search'].includes(headerStyleValue), [headerStyleValue])
  const headerTextEnabled = backgroundImageToggleEnabled
  const featuredToggleEnabled = useMemo(() => ['Highlight', 'Magazine'].includes(headerStyleValue), [headerStyleValue])
  const imagesInFeedEnabled = useMemo(() => postFeedStyleValue === 'List', [postFeedStyleValue])

  return (
    <div className="flex h-full flex-col bg-surface">
      <PanelHeader title="Theme settings" />
      <div className="flex-1 overflow-y-auto">
          <AccordionSection
            title="Site wide"
            expanded={siteWideExpanded}
            onToggle={() => setSiteWideExpanded((prev) => !prev)}
          >
            <div className="space-y-4">
              <DropdownField
                label="Navigation layout"
                value={navigationLayoutValue}
                options={navigationLayoutOptions}
                onChange={onNavigationLayoutChange}
                helperText="Choose how your logo and navigation items are arranged."
                errorMessage={navigationLayoutError}
                disabled={Boolean(navigationLayoutError)}
              />
            <ColorPickerSetting
              label="Site background color"
              value={backgroundColor}
              swatches={backgroundColorSwatches}
              onChange={(value) => onBackgroundColorChange(sanitizeHex(value, backgroundColor))}
              dataTestId="theme-background-color"
              hasTransparentOption={false}
            />
            <div className="space-y-2">
              <ColorPickerSetting
                label="Accent color"
                value={accentColor}
                swatches={accentColorSwatches}
                onChange={(value) => onAccentColorChange(sanitizeHex(value, accentColor))}
                dataTestId="theme-accent-color"
                hasTransparentOption={false}
              />
              <p className="font-xs text-placeholder">For theme preview visuals only. Actual values are defined under Customize Theme &gt; Brand.</p>
            </div>
            <DropdownField
              label="Header & footer color"
              value={headerAndFooterColorValue}
              options={headerAndFooterColorOptions}
              onChange={onHeaderAndFooterColorChange}
            />
            <DropdownField
              label="Title font"
              value={titleFontValue}
              options={titleFontOptions}
              onChange={onTitleFontChange}
            />
            <DropdownField
              label="Body font"
              value={bodyFontValue}
              options={bodyFontOptions}
              onChange={onBodyFontChange}
            />
            <TextField
              label="Signup heading"
              value={signupHeadingValue}
              onChange={onSignupHeadingChange}
              debounceDelay={300}
              disabled={isFooterBarHidden}
              helperText="Used in your footer across your theme, defaults to site title when empty."
            />
            <TextField
              label="Signup subheading"
              value={signupSubheadingValue}
              onChange={onSignupSubheadingChange}
              debounceDelay={300}
              disabled={isFooterBarHidden}
              helperText="Defaults to site description when empty."
            />
          </div>
        </AccordionSection>

        <Separator.Root className="bg-hover" style={{ height: '1px' }} />

        <AccordionSection
          title="Homepage"
          expanded={homepageExpanded}
          onToggle={() => setHomepageExpanded((prev) => !prev)}
        >
          <div className="space-y-4">
            <DropdownField
              label="Header style"
              value={headerStyleValue}
              options={headerStyleOptions}
              onChange={onHeaderStyleChange}
              helperText="Landing is recommended for all sites, Highlight & Magazine for those with more content."
            />
            <TextField
              label="Header text"
              value={headerTextValue}
              onChange={onHeaderTextChange}
              disabled={!headerTextEnabled}
              helperText={
                headerTextEnabled
                  ? 'Defaults to site description when empty.'
                  : 'Available when header style is Landing or Search.'
              }
            />
            <ToggleField
              label="Background image"
              value={backgroundImageEnabled}
              onChange={onBackgroundImageToggle}
              helperText={
                backgroundImageToggleEnabled
                  ? 'Use the publication cover set on the Brand tab as your background.'
                  : 'Available when header style is Landing or Search.'
              }
              disabled={!backgroundImageToggleEnabled}
            />
            <ToggleField
              label="Show featured posts"
              value={showFeaturedPosts}
              onChange={onShowFeaturedPostsToggle}
              helperText={
                featuredToggleEnabled
                  ? undefined
                  : 'Available when header style is Highlight or Magazine.'
              }
              disabled={!featuredToggleEnabled}
            />
            <DropdownField
              label="Post feed style"
              value={postFeedStyleValue}
              options={postFeedStyleOptions}
              onChange={onPostFeedStyleChange}
            />
            <ToggleField
              label="Show images in feed"
              value={showImagesInFeed}
              onChange={onShowImagesInFeedToggle}
              helperText={
                imagesInFeedEnabled
                  ? undefined
                  : 'Available when post feed style is List.'
              }
              disabled={!imagesInFeedEnabled}
            />
            <ToggleField
              label="Show author"
              value={showAuthor}
              onChange={onShowAuthorToggle}
            />
            <ToggleField
              label="Show publish date"
              value={showPublishDate}
              onChange={onShowPublishDateToggle}
            />
            <ToggleField
              label="Show publication info sidebar"
              value={showPublicationInfoSidebar}
              onChange={onShowPublicationInfoSidebarToggle}
            />
          </div>
        </AccordionSection>

        <Separator.Root className="bg-hover" style={{ height: '1px' }} />

        <AccordionSection
          title="Post"
          expanded={postExpanded}
          onToggle={() => setPostExpanded((prev) => !prev)}
        >
          <div className="space-y-4">
            <ToggleField
              label="Show post metadata"
              value={showPostMetadata}
              onChange={onShowPostMetadataToggle}
            />
            <ToggleField
              label="Enable drop caps on posts"
              value={enableDropCapsOnPosts}
              onChange={onEnableDropCapsOnPostsToggle}
            />
            <ToggleField
              label="Show related articles"
              value={showRelatedArticles}
              onChange={onShowRelatedArticlesToggle}
            />
          </div>
        </AccordionSection>

        <Separator.Root className="bg-hover" style={{ height: '1px' }} />

        <AccordionSection
          title="Custom CSS"
          expanded={cssExpanded}
          onToggle={() => setCssExpanded((prev) => !prev)}
        >
          <div>
            <p className="font-md text-secondary mb-3">Add custom styles to your entire online store.</p>
            <CodeMirror
              value={customCSS}
              onChange={onCustomCSSChange}
              extensions={[css()]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
              }}
              className="border border-border-strong rounded overflow-hidden text-xs [&_.cm-activeLine]:bg-transparent [&_.cm-activeLineGutter]:bg-transparent"
              style={{ fontSize: '12px' }}
              height="12rem"
            />
          </div>
        </AccordionSection>
      </div>
    </div>
  )
}

type AccordionSectionProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ title, expanded, onToggle, children }: AccordionSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={SECTION_HEADER}
        type="button"
      >
        <h3 className="font-md font-bold text-foreground">{title}</h3>
        <svg
          className={`h-4 w-4 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 4.5L13 10L6 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className={SECTION_PADDING}>
          {children}
        </div>
      )}
    </div>
  )
}

type DropdownFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  helperText?: string
  errorMessage?: string | null
  disabled?: boolean
}

function DropdownField({
  label,
  value,
  options,
  onChange,
  helperText,
  errorMessage,
  disabled = false,
}: DropdownFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuWidth, setMenuWidth] = useState<number | null>(null)

  const normalizedOptions = useMemo(() => {
    if (!value) {
      return options
    }
    if (options.includes(value)) {
      return options
    }
    return [value, ...options]
  }, [options, value])

  useEffect(() => {
    const measure = () => {
      const width = triggerRef.current?.getBoundingClientRect().width
      if (typeof width === 'number' && width > 0) {
        setMenuWidth((prev) => (prev === null || Math.abs(prev - width) > 0.5 ? width : prev))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [normalizedOptions.length, value])

  const isDisabled = disabled || normalizedOptions.length === 0
  const selectValue = value && normalizedOptions.includes(value) ? value : normalizedOptions[0] ?? value ?? ''
  const dropdownLabel = selectValue || 'Select an option'

  return (
    <div className={FIELD_STACK}>
      <p className={LABEL_CLASS}>{label}</p>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            ref={triggerRef}
            disabled={isDisabled}
            className={`flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md px-3 text-md transition-colors focus:outline-none ${
              isDisabled
                ? 'cursor-not-allowed bg-subtle text-placeholder'
                : 'bg-subtle text-foreground hover:bg-subtle/80'
            }`}
          >
            <span className="flex-1 truncate text-left">{dropdownLabel}</span>
            <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-secondary" aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={2}
            align="start"
            className="rounded-md bg-surface shadow-[0px_20px_80px_rgba(15,23,42,0.12)]"
            style={menuWidth ? { width: `${menuWidth}px`, minWidth: `${menuWidth}px` } : undefined}
          >
            {normalizedOptions.map((option) => {
              const isActive = option === selectValue
              return (
                <DropdownMenu.Item
                  key={option}
                  disabled={isDisabled}
                  onSelect={() => {
                    if (!isDisabled && option !== selectValue) {
                      onChange(option)
                    }
                  }}
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 font-md outline-none transition-colors ${
                    isActive ? 'text-foreground hover:bg-subtle' : 'text-foreground hover:bg-subtle'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isActive && <Check size={14} strokeWidth={1.5} className="text-muted" />}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {helperText ? <p className={HELPER_CLASS}>{helperText}</p> : null}
      {errorMessage ? <p className="text-sm leading-5 text-rose-600">{errorMessage}</p> : null}
    </div>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  helperText?: string
  debounceDelay?: number
  disabled?: boolean
}

function TextField({ label, value, onChange, helperText, debounceDelay, disabled = false }: TextFieldProps) {
  const hasDebounce = typeof debounceDelay === 'number' && debounceDelay > 0
  const [inputValue, setInputValue] = useState(value)
  const pendingValueRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hasDebounce) {
      setInputValue(value)
      pendingValueRef.current = null
    }
  }, [value, hasDebounce])

  const flushPendingChange = useCallback(() => {
    if (!hasDebounce) {
      return
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (pendingValueRef.current !== null) {
      onChange(pendingValueRef.current)
      pendingValueRef.current = null
    }
  }, [hasDebounce, onChange])

  useEffect(() => {
    return () => {
      flushPendingChange()
    }
  }, [flushPendingChange])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }
    const nextValue = event.target.value
    if (!hasDebounce) {
      onChange(nextValue)
      return
    }

    setInputValue(nextValue)
    pendingValueRef.current = nextValue
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    const delay = debounceDelay ?? 0
    timeoutRef.current = setTimeout(() => {
      if (pendingValueRef.current !== null) {
        onChange(pendingValueRef.current)
        pendingValueRef.current = null
      }
      timeoutRef.current = null
    }, delay)
  }

  const handleBlur = () => {
    flushPendingChange()
  }

  return (
    <label className={`block ${FIELD_STACK}`}>
      <span className={`${LABEL_CLASS} ${disabled ? LABEL_DISABLED_CLASS : ''}`}>{label}</span>
      <TextInput
        type="text"
        value={hasDebounce ? inputValue : value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="disabled:border-border disabled:bg-subtle disabled:text-placeholder disabled:placeholder:text-placeholder disabled:cursor-not-allowed"
      />
      {helperText ? (
        <p className={`${HELPER_CLASS} ${disabled ? HELPER_DISABLED_CLASS : ''}`}>{helperText}</p>
      ) : null}
    </label>
  )
}

type ToggleFieldProps = {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  helperText?: string
  disabled?: boolean
}

function ToggleField({ label, value, onChange, helperText, disabled = false }: ToggleFieldProps) {
  const handleChange = disabled ? () => {} : onChange
  return (
    <div className="flex items-start justify-between gap-4">
      <div className={`flex-1 min-w-0 ${disabled ? 'opacity-70' : ''}`}>
        <p className={`${LABEL_CLASS} ${disabled ? LABEL_DISABLED_CLASS : ''}`}>{label}</p>
        {helperText ? <p className={`${HELPER_CLASS} ${disabled ? HELPER_DISABLED_CLASS : ''}`}>{helperText}</p> : null}
      </div>
      <ToggleSwitch
        checked={value}
        onChange={handleChange}
        ariaLabel={label}
        size="small"
        disabled={disabled}
      />
    </div>
  )
}
