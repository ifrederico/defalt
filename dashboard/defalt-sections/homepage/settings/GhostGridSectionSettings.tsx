import { useCallback, useMemo, type ComponentType } from 'react'
import * as Separator from '@radix-ui/react-separator'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookOpen,
  Bookmark,
  Info,
  CircleQuestionMark,
  Code,
  Eye,
  FileWarning,
  GalleryVertical,
  Image,
  Images,
  Minus,
  MousePointer,
  Music4,
  Paperclip,
  Play,
  RectangleEllipsis,
  SquareArrowDown,
  Star,
  UserPlus
} from 'lucide-react'

import type { GhostGridSectionConfig } from '@defalt/sections/definitions/definitions'
import {
  SliderField,
  ToggleSwitch,
  InlineControlRow,
  SettingSection,
  ButtonGroupSetting,
  Dropdown,
} from '@defalt/ui'

type GhostGridSectionSettingsProps = {
  sectionId: string
  config: GhostGridSectionConfig
  padding: { top: number, bottom: number, left?: number, right?: number }
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onUpdateConfig: (updater: (config: GhostGridSectionConfig) => GhostGridSectionConfig) => void
}

type GhostGridIconItem = {
  id: string
  label: string
  suffix: string
  icon: ComponentType<{ size?: number }>
}

const TITLE_SIZE_ITEMS: Array<{ value: 'small' | 'normal' | 'large', label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
]

const DROPDOWN_TRIGGER_CLASSES = 'flex h-[38px] min-w-[160px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none'
const DROPDOWN_CONTENT_CLASSES = 'bg-surface rounded-md shadow-lg overflow-hidden min-w-[160px] z-[100]'
const DROPDOWN_ITEM_CLASSES = 'flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle'

const ICON_ITEMS: GhostGridIconItem[] = [
  { id: 'image', label: 'Image', suffix: '/image', icon: Image },
  { id: 'divider', label: 'Divider', suffix: '/hr', icon: Minus },
  { id: 'button', label: 'Button', suffix: '/button', icon: RectangleEllipsis },
  { id: 'bookmark', label: 'Bookmark', suffix: '/url', icon: Bookmark },
  { id: 'gallery', label: 'Gallery', suffix: '/gallery', icon: Images },
  { id: 'preview', label: 'Public preview', suffix: '/paywall', icon: Eye },
  { id: 'cta', label: 'Call to action', suffix: '/cta', icon: MousePointer },
  { id: 'callout', label: 'Callout', suffix: '/callout', icon: FileWarning },
  { id: 'signup', label: 'Signup', suffix: '/signup', icon: UserPlus },
  { id: 'header', label: 'Header', suffix: '/header', icon: GalleryVertical },
  { id: 'toggle', label: 'Toggle', suffix: '/toggle', icon: SquareArrowDown },
  { id: 'video', label: 'Video', suffix: '/video', icon: Play },
  { id: 'audio', label: 'Audio', suffix: '/audio', icon: Music4 },
  { id: 'file', label: 'File', suffix: '/file', icon: Paperclip },
  { id: 'product', label: 'Product', suffix: '/product', icon: Star },
  { id: 'html', label: 'HTML', suffix: '/html', icon: Code },
  { id: 'markdown', label: 'Markdown', suffix: '/md', icon: BookOpen },
]

export default function GhostGridSectionSettings({
  config,
  padding,
  onPaddingChange,
  onPaddingCommit,
  onUpdateConfig
}: GhostGridSectionSettingsProps) {
  const showHeader = config.showHeader === true
  const alignmentValue = config.headerAlignment === 'left' || config.headerAlignment === 'right'
    ? config.headerAlignment
    : 'center'
  const titleSizeValue = config.titleSize === 'small' || config.titleSize === 'large' ? config.titleSize : 'normal'
  const stackOnMobile = config.stackOnMobile !== false
  const gapValue = (() => {
    const rawGap = typeof config.columnGap === 'number' && Number.isFinite(config.columnGap) ? config.columnGap : 20
    return Math.max(0, Math.min(100, Math.round(rawGap)))
  })()

  const handleConfigPatch = useCallback((patch: Partial<GhostGridSectionConfig>) => {
    onUpdateConfig((current) => ({
      ...current,
      ...patch
    }))
  }, [onUpdateConfig])

  const alignmentOptions = useMemo(() => ([
    { label: 'Left', value: 'left', icon: <AlignLeft size={16} />, disabled: !showHeader },
    { label: 'Center', value: 'center', icon: <AlignCenter size={16} />, disabled: !showHeader },
    { label: 'Right', value: 'right', icon: <AlignRight size={16} />, disabled: !showHeader }
  ]), [showHeader])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 pl-4 pr-6 py-4">
      <div className="flex items-start gap-3 rounded-md border border-info-border bg-info-light px-3 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-info" />
        <p className="text-sm leading-5 text-info">
          Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">#ghost-grid-1</code> to the page you want on the left and <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">#ghost-grid-2</code> to the page on the right. Need to hide a column? Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">#cards-hide</code> to that same page. Tagging multiple pages with the same label only keeps the newest one.
        </p>
      </div>

        <SettingSection title="Appearance">
          <InlineControlRow label="Page title">
            <ToggleSwitch
              checked={showHeader}
              onChange={(checked) => handleConfigPatch({ showHeader: checked })}
              ariaLabel="Toggle page title visibility"
            />
          </InlineControlRow>

          <ButtonGroupSetting
            label="Title alignment"
            value={alignmentValue}
            options={alignmentOptions}
            onChange={(next) => {
              if (next === 'left' || next === 'center' || next === 'right') {
                handleConfigPatch({ headerAlignment: next })
              }
            }}
          />

          <InlineControlRow label="Title size">
            <Dropdown<'small' | 'normal' | 'large'>
              selected={titleSizeValue}
              items={TITLE_SIZE_ITEMS}
              onSelect={(value) => handleConfigPatch({ titleSize: value })}
              triggerClassName={DROPDOWN_TRIGGER_CLASSES}
              contentClassName={DROPDOWN_CONTENT_CLASSES}
              itemClassName={DROPDOWN_ITEM_CLASSES}
              disabled={!showHeader}
            />
          </InlineControlRow>
        </SettingSection>

        <Separator.Root className="h-px bg-hover my-3" />

        <SettingSection title="Layout">
          <InlineControlRow label="Stack on mobile">
            <ToggleSwitch
              checked={stackOnMobile}
              onChange={(checked) => handleConfigPatch({ stackOnMobile: checked })}
              ariaLabel="Toggle stack on mobile"
            />
          </InlineControlRow>
          <SliderField
            label="Gap"
            value={gapValue}
            min={0}
            max={100}
            step={1}
            onChange={(value) => handleConfigPatch({ columnGap: value })}
            variant="normal"
          />
        </SettingSection>

        <Separator.Root className="h-px bg-hover my-3" />

        <SettingSection title="Padding">
          <SliderField label="Top" value={padding.top} min={0} max={200} step={1} onChange={(value) => onPaddingChange('top', value)} onCommit={(value) => onPaddingCommit?.('top', value)} variant="normal" />
          <SliderField label="Bottom" value={padding.bottom} min={0} max={200} step={1} onChange={(value) => onPaddingChange('bottom', value)} onCommit={(value) => onPaddingCommit?.('bottom', value)} variant="normal" />
          <SliderField label="Left" value={padding.left ?? 0} min={0} max={200} step={1} onChange={(value) => onPaddingChange('left', value)} onCommit={(value) => onPaddingCommit?.('left', value)} variant="normal" />
          <SliderField label="Right" value={padding.right ?? 0} min={0} max={200} step={1} onChange={(value) => onPaddingChange('right', value)} onCommit={(value) => onPaddingCommit?.('right', value)} variant="normal" />
        </SettingSection>

        <Separator.Root className="h-px bg-hover my-3" />

        <SettingSection
          title="Primary cards"
          action={
            <a
              href="https://ghost.org/help/cards/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-placeholder transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Learn more about Ghost cards"
            >
              <CircleQuestionMark size={16} />
            </a>
          }
        >
        <p className="font-md text-sm text-secondary">Launch the dynamic card menu by clicking the + button, or type / on a new line.</p>
          <div className="space-y-2">
            {ICON_ITEMS.map(({ id, label, suffix, icon: Icon }) => (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 font-md text-sm text-foreground"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-secondary">
                    <Icon size={16} />
                  </span>
                  <span className="font-medium">{label}</span>
                </div>
                <span className="font-md text-xs text-placeholder">{suffix}</span>
              </div>
            ))}
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
