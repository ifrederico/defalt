import { useMemo, useCallback } from 'react'
import * as Separator from '@radix-ui/react-separator'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { AlignLeft, AlignCenter, AlignRight, Info, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react'

import type { ImageWithTextSectionConfig } from '@defalt/sections/definitions/definitions'
import {
  SliderField,
  ToggleSwitch,
  InlineControlRow,
  SettingSection,
  ButtonGroupSetting,
  Dropdown,
} from '@defalt/ui'

const dropdownTriggerClasses = 'flex h-[38px] min-w-[160px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none'
const dropdownContentClasses = 'bg-surface rounded-md shadow-lg overflow-hidden min-w-[160px] z-[100]'
const dropdownItemClasses = 'flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle'
const toggleItemClasses = 'rounded px-2.5 py-1.5 font-md transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export type ImageWithTextSectionSettingsProps = {
  sectionId: string
  config: ImageWithTextSectionConfig
  padding: { top: number, bottom: number, left?: number, right?: number }
  onUpdateConfig: (updater: (config: ImageWithTextSectionConfig) => ImageWithTextSectionConfig) => void
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
}

export default function ImageWithTextSectionSettings({
  sectionId,
  config,
  padding,
  onUpdateConfig,
  onPaddingChange,
  onPaddingCommit,
}: ImageWithTextSectionSettingsProps) {
  const tagBase = '#image-with-text'
  const suffixMatch = sectionId.match(/(\d+)$/)
  const fallbackTag = suffixMatch ? `${tagBase}-${suffixMatch[1]}` : tagBase
  const displayTag = typeof config.ghostPageTag === 'string' && config.ghostPageTag.trim()
    ? config.ghostPageTag.trim()
    : fallbackTag

  const showHeader = config.showHeader !== false
  const alignmentValue = config.headerAlignment === 'left' || config.headerAlignment === 'right'
    ? config.headerAlignment
    : 'center'
  const imagePositionValue = config.imagePosition || 'left'

  const handleConfigPatch = useCallback((patch: Partial<ImageWithTextSectionConfig>) => {
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
            Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">{displayTag}</code> tag to a published Ghost page. The first image, page title, excerpt, and any button/CTA cards will appear in this section.
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

          <InlineControlRow label="Aspect ratio">
            <Dropdown<ImageWithTextSectionConfig['aspectRatio']>
              selected={config.aspectRatio || 'default'}
              items={[
                { label: 'Default', value: 'default' },
                { label: '1:1 Square', value: '1:1' },
                { label: '3:4 Portrait', value: '3:4' },
                { label: '4:3 Landscape', value: '4:3' },
                { label: '16:9 Wide', value: '16:9' },
                { label: '2:3 Tall', value: '2:3' }
              ]}
              onSelect={(value) => handleConfigPatch({ aspectRatio: value })}
              triggerClassName={dropdownTriggerClasses}
              contentClassName={dropdownContentClasses}
              itemClassName={dropdownItemClasses}
            />
          </InlineControlRow>

          <SliderField
            label="Border radius"
            value={config.imageBorderRadius ?? 0}
            min={0}
            max={48}
            step={1}
            onChange={(value) => handleConfigPatch({ imageBorderRadius: value })}
            variant="normal"
          />
        </SettingSection>

        <Separator.Root className="h-px bg-hover my-3" />

        <SettingSection title="Layout">
          <InlineControlRow label="Container width">
            <Dropdown<ImageWithTextSectionConfig['containerWidth']>
              selected={config.containerWidth || 'default'}
              items={[
                { label: 'Default', value: 'default' },
                { label: 'Narrow', value: 'narrow' },
                { label: 'Full', value: 'full' }
              ]}
              onSelect={(value) => handleConfigPatch({ containerWidth: value })}
              triggerClassName={dropdownTriggerClasses}
              contentClassName={dropdownContentClasses}
              itemClassName={dropdownItemClasses}
            />
          </InlineControlRow>

          <InlineControlRow label="Image position">
            <Dropdown<ImageWithTextSectionConfig['imagePosition']>
              selected={imagePositionValue}
              items={[
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' }
              ]}
              onSelect={(value) => handleConfigPatch({ imagePosition: value })}
              triggerClassName={dropdownTriggerClasses}
              contentClassName={dropdownContentClasses}
              itemClassName={dropdownItemClasses}
            />
          </InlineControlRow>

          <InlineControlRow label="Image width">
            <Dropdown<ImageWithTextSectionConfig['imageWidth']>
              selected={config.imageWidth || '1/2'}
              items={[
                { label: '1/2', value: '1/2' },
                { label: '2/3', value: '2/3' },
                { label: '3/4', value: '3/4' }
              ]}
              onSelect={(value) => handleConfigPatch({ imageWidth: value })}
              triggerClassName={dropdownTriggerClasses}
              contentClassName={dropdownContentClasses}
              itemClassName={dropdownItemClasses}
            />
          </InlineControlRow>

          <SliderField
            label="Gap"
            value={config.gap ?? 32}
            min={0}
            max={100}
            step={1}
            onChange={(value) => handleConfigPatch({ gap: value })}
            variant="normal"
          />

          <InlineControlRow label="Text alignment">
            <ToggleGroup.Root
              type="single"
              value={config.textAlignment || 'middle'}
              onValueChange={(value) => {
                if (value === 'top' || value === 'middle' || value === 'bottom') {
                  handleConfigPatch({ textAlignment: value })
                }
              }}
              className="inline-flex gap-0.5 rounded bg-subtle p-0.5"
            >
              <ToggleGroup.Item value="top" className={toggleItemClasses}>
                <AlignStartVertical size={16} strokeWidth={2} />
                <span className="sr-only">Top</span>
              </ToggleGroup.Item>
              <ToggleGroup.Item value="middle" className={toggleItemClasses}>
                <AlignCenterVertical size={16} strokeWidth={2} />
                <span className="sr-only">Middle</span>
              </ToggleGroup.Item>
              <ToggleGroup.Item value="bottom" className={toggleItemClasses}>
                <AlignEndVertical size={16} strokeWidth={2} />
                <span className="sr-only">Bottom</span>
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          </InlineControlRow>
        </SettingSection>

        <Separator.Root className="h-px bg-hover my-3" />

        <SettingSection title="Typography">
          <InlineControlRow label="Heading size">
            <Dropdown<ImageWithTextSectionConfig['headingSize']>
              selected={config.headingSize || 'normal'}
              items={[
                { label: 'Small', value: 'small' },
                { label: 'Normal', value: 'normal' },
                { label: 'Large', value: 'large' },
                { label: 'X-Large', value: 'x-large' }
              ]}
              onSelect={(value) => handleConfigPatch({ headingSize: value })}
              triggerClassName={dropdownTriggerClasses}
              contentClassName={dropdownContentClasses}
              itemClassName={dropdownItemClasses}
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
      </div>
    </div>
  )
}
