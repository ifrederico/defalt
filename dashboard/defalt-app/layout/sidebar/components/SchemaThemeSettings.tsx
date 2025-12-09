import { useMemo } from 'react'
import * as Separator from '@radix-ui/react-separator'
import { sourceThemeSettingsGroups, type SourceThemeConfig } from '@defalt/sections/engine'
import { SliderField, ToggleSwitch, SettingSection, Dropdown, InlineControlRow } from '@defalt/ui'
import type { SettingSchema } from '@defalt/sections/engine'

type SchemaThemeSettingsProps = {
  config: SourceThemeConfig
  padding: { top: number, bottom: number, left?: number, right?: number }
  margin?: { top?: number, bottom?: number }
  onUpdateConfig: (updater: (config: SourceThemeConfig) => SourceThemeConfig) => void
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
}

function renderSettingInput(
  setting: SettingSchema,
  value: unknown,
  onChange: (next: unknown) => void,
  isDisabled?: boolean
) {
  switch (setting.type) {
    case 'checkbox':
      return (
        <InlineControlRow label={setting.label}>
          <ToggleSwitch
            checked={value === true}
            onChange={(checked) => onChange(checked)}
            ariaLabel={setting.label}
            size="small"
            disabled={isDisabled}
          />
        </InlineControlRow>
      )
    case 'select':
      return (
        <InlineControlRow label={setting.label}>
          <Dropdown
            selected={typeof value === 'string' ? value : (setting.default ?? '')}
            items={setting.options}
            onSelect={(val) => onChange(val)}
            triggerClassName="flex h-[38px] min-w-[120px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 font-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[120px] z-[100]"
            itemClassName="flex items-center gap-2 px-3 py-2 font-md text-foreground transition-colors hover:bg-subtle"
          />
        </InlineControlRow>
      )
    case 'range':
      return (
        <SliderField
          label={setting.label}
          value={typeof value === 'number' && Number.isFinite(value) ? value : setting.default}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          unit={setting.unit}
          onChange={(val) => onChange(val)}
        />
      )
    case 'header':
      return null // Headers are handled at group level
    case 'paragraph':
      return <p className="font-sm text-muted leading-relaxed">{setting.content}</p>
    default:
      return null
  }
}

export function SchemaThemeSettings({
  config,
  padding,
  onUpdateConfig,
  onPaddingChange,
  onPaddingCommit
}: SchemaThemeSettingsProps) {
  // Filter to only show the Appearance group (the "main" section settings)
  const appearanceGroup = useMemo(
    () => sourceThemeSettingsGroups.find(g => g.id === 'appearance'),
    []
  )

  const handleFieldChange = (id: string, next: unknown) => {
    onUpdateConfig((current) => ({
      ...current,
      [id]: next
    }))
  }

  // Show images in feed is only enabled when post feed style is 'List'
  const imagesInFeedEnabled = config.postFeedStyle === 'List'

  if (!appearanceGroup) {
    return null
  }

  // Filter out header settings (they're for grouping only) and handle special cases
  const settingsToRender = appearanceGroup.settings.filter(s => s.type !== 'header')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4 space-y-6">
        <SettingSection title="Appearance">
          <div className="space-y-4">
            {settingsToRender.map((setting) => {
              const currentValue = config[setting.id as keyof SourceThemeConfig]
              // Special case: showImagesInFeed is disabled when postFeedStyle is not 'List'
              const isDisabled = setting.id === 'showImagesInFeed' && !imagesInFeedEnabled

              return (
                <div key={setting.id}>
                  {renderSettingInput(
                    setting,
                    currentValue,
                    (next) => handleFieldChange(setting.id, next),
                    isDisabled
                  )}
                </div>
              )
            })}
          </div>
        </SettingSection>

        <Separator.Root className="h-px bg-hover" />

        <SettingSection title="Padding">
          <SliderField
            label="Top"
            value={padding.top}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('top', value)}
            onCommit={(value) => onPaddingCommit('top', value)}
          />
          <SliderField
            label="Bottom"
            value={padding.bottom}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('bottom', value)}
            onCommit={(value) => onPaddingCommit('bottom', value)}
          />
          <SliderField
            label="Left"
            value={padding.left ?? 0}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('left', value)}
            onCommit={(value) => onPaddingCommit('left', value)}
          />
          <SliderField
            label="Right"
            value={padding.right ?? 0}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('right', value)}
            onCommit={(value) => onPaddingCommit('right', value)}
          />
        </SettingSection>
      </div>
    </div>
  )
}
