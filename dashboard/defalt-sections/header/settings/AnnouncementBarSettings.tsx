import { useMemo, useCallback } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Separator from '@radix-ui/react-separator'
import {
  GalleryHorizontal,
  GalleryThumbnails
} from 'lucide-react'
import { sanitizeHex } from '@defalt/utils/color/colorUtils'
import type { AnnouncementBarConfig } from '@defalt/utils/config/themeConfig'
import { ColorPickerSetting, SettingSection, InlineControlRow, SliderField } from '@defalt/ui'

export type AnnouncementBarSettingsProps = {
  accentColor: string
  config: AnnouncementBarConfig
  onChange: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  /** Preview callback - updates state without creating history entry */
  onPreview?: (updater: (config: AnnouncementBarConfig) => AnnouncementBarConfig) => void
  /** Commit callback - creates history entry */
  onCommit?: () => void
}

const widthOptions: AnnouncementBarConfig['width'][] = ['default', 'narrow']

export function AnnouncementBarSettings({ accentColor, config, onChange, onPreview, onCommit }: AnnouncementBarSettingsProps) {
  const colorSwatches = useMemo(() => ([
    { title: 'Accent', hex: sanitizeHex(accentColor, '#AC1E3E'), accent: true },
    { title: 'Black', hex: '#000000' },
    { title: 'White', hex: '#ffffff' }
  ]), [accentColor])

  const handlePartialChange = useCallback((patch: Partial<AnnouncementBarConfig>) => {
    onChange((prev) => ({
      ...prev,
      ...patch
    }))
  }, [onChange])

  // Preview change - uses onPreview if available, falls back to onChange
  const handlePreviewChange = useCallback((patch: Partial<AnnouncementBarConfig>) => {
    const handler = onPreview ?? onChange
    handler((prev) => ({
      ...prev,
      ...patch
    }))
  }, [onPreview, onChange])

  // Commit change - calls onCommit if available
  const handleCommit = useCallback(() => {
    onCommit?.()
  }, [onCommit])

  const handleWidthToggle = useCallback((value: string) => {
    if (value === 'default' || value === 'narrow') {
      handlePartialChange({ width: value })
    }
  }, [handlePartialChange])

  const widthToggleItems = widthOptions.map((choice) => {
    const Icon = choice === 'narrow' ? GalleryHorizontal : GalleryThumbnails
    return (
      <ToggleGroup.Item
        key={choice}
        value={choice}
        className="rounded px-2.5 py-1.5 font-md transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon size={16} strokeWidth={2} />
        <span className="sr-only">{choice}</span>
      </ToggleGroup.Item>
    )
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4">
        <div className="space-y-4">
          <SettingSection title="Appearance">
            <InlineControlRow label="Width">
              <ToggleGroup.Root
                type="single"
                value={config.width}
                onValueChange={handleWidthToggle}
                className="inline-flex gap-0.5 rounded bg-subtle p-0.5"
              >
                {widthToggleItems}
              </ToggleGroup.Root>
            </InlineControlRow>
            <ColorPickerSetting
              label="Background color"
              value={sanitizeHex(config.backgroundColor, '#AC1E3E')}
              swatches={colorSwatches}
              onChange={(value) => handlePreviewChange({ backgroundColor: sanitizeHex(value, config.backgroundColor) })}
              onCommit={handleCommit}
              hasTransparentOption={false}
              accentColor={accentColor}
            />
            <ColorPickerSetting
              label="Text color"
              value={sanitizeHex(config.textColor, '#ffffff')}
              swatches={colorSwatches}
              onChange={(value) => handlePreviewChange({ textColor: sanitizeHex(value, config.textColor) })}
              onCommit={handleCommit}
              hasTransparentOption={false}
              accentColor={accentColor}
            />
            <SliderField
              label="Divider thickness"
              value={config.dividerThickness}
              min={0}
              max={5}
              step={1}
              onChange={(value) => handlePartialChange({ dividerThickness: value })}
              variant="compact"
            />
          </SettingSection>

          <Separator.Root className="h-px bg-hover" />

          <SettingSection title="Padding">
            <SliderField
              label="Top"
              value={config.paddingTop}
              min={0}
              max={100}
              step={1}
              onChange={(value) => handlePartialChange({ paddingTop: value })}
              variant="normal"
            />
            <SliderField
              label="Bottom"
              value={config.paddingBottom}
              min={0}
              max={100}
              step={1}
              onChange={(value) => handlePartialChange({ paddingBottom: value })}
              variant="normal"
            />
          </SettingSection>
        </div>
      </div>
    </div>
  )
}
