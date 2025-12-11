import { useMemo } from 'react'
import * as Separator from '@radix-ui/react-separator'
import { sourceThemeSettingsGroups, type SourceThemeConfig } from '@defalt/sections/engine'
import { SliderField, SettingSection } from '@defalt/ui'
import { renderSettingInput } from './settingsRenderUtils'

type SchemaThemeSettingsProps = {
  config: SourceThemeConfig
  padding: { top: number, bottom: number, left?: number, right?: number }
  margin?: { top?: number, bottom?: number }
  onUpdateConfig: (updater: (config: SourceThemeConfig) => SourceThemeConfig) => void
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
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
                    { isDisabled, size: 'small' }
                  )}
                </div>
              )
            })}
          </div>
        </SettingSection>

        <Separator.Root className="h-px bg-hover" />

        <SettingSection title="Padding">
          <SliderField
            label="Block"
            value={padding.top}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('top', value)}
            onCommit={(value) => onPaddingCommit('top', value)}
          />
        </SettingSection>
      </div>
    </div>
  )
}
