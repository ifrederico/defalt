import { useMemo, useCallback } from 'react'
import * as Separator from '@radix-ui/react-separator'
import { AlignLeft, AlignCenter, AlignRight, Info, CircleQuestionMark, Image, Minus, RectangleEllipsis, BookOpen, Bookmark, Code, Eye, FileWarning, GalleryVertical, Images, MousePointer, Music4, Paperclip, Play, SquareArrowDown, Star, UserPlus } from 'lucide-react'
import type { GhostCardsSectionConfig } from '@defalt/sections/definitions/definitions'
import {
  SliderField,
  ToggleSwitch,
  InlineControlRow,
  SettingSection,
  ButtonGroupSetting,
  Dropdown
} from '@defalt/ui'

type GhostCardsSectionSettingsProps = {
  sectionId: string
  config: GhostCardsSectionConfig
  padding: { top: number, bottom: number, left?: number, right?: number }
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onUpdateConfig: (updater: (config: GhostCardsSectionConfig) => GhostCardsSectionConfig) => void
}

const TITLE_SIZE_ITEMS: Array<{ value: 'small' | 'normal' | 'large', label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' }
]

const ICON_ITEMS = [
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
  { id: 'markdown', label: 'Markdown', suffix: '/md', icon: BookOpen }
]

export default function GhostCardsSectionSettings({
  sectionId,
  config,
  padding,
  onPaddingChange,
  onPaddingCommit,
  onUpdateConfig
}: GhostCardsSectionSettingsProps) {
  const tagBase = '#ghost-card'
  const suffixMatch = sectionId.match(/(\d+)$/)
  const fallbackTag = suffixMatch ? `${tagBase}-${suffixMatch[1]}` : tagBase
  const displayTag = typeof config.ghostPageTag === 'string' && config.ghostPageTag.trim()
    ? config.ghostPageTag.trim()
    : fallbackTag

  const showHeader = config.showHeader === true
  const alignmentValue = config.headerAlignment === 'left' || config.headerAlignment === 'right'
    ? config.headerAlignment
    : 'center'
  const titleSizeValue = config.titleSize === 'small' || config.titleSize === 'large' ? config.titleSize : 'normal'

  const handleConfigPatch = useCallback((patch: Partial<GhostCardsSectionConfig>) => {
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
          Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">{displayTag}</code> tag to any published Ghost page to feed the card content into the homepage.
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
            triggerClassName="flex h-[38px] min-w-[160px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-sm md:text-base text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[160px] z-[100]"
            itemClassName="flex items-center gap-2 px-3 py-2 text-sm md:text-base text-foreground transition-colors hover:bg-subtle"
            disabled={!showHeader}
          />
        </InlineControlRow>
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
        <p className="text-sm text-secondary mb-3">
          Launch the dynamic card menu by clicking the + button, or type / on a new line.
        </p>
        <div className="space-y-2">
          {ICON_ITEMS.map(({ icon: Icon, label, suffix }) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 font-md text-sm text-foreground">
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
