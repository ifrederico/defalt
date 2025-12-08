import { useCallback, useMemo, useState } from 'react'
import * as Separator from '@radix-ui/react-separator'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  GalleryHorizontal,
  UnfoldHorizontal,
  UnfoldVertical
} from 'lucide-react'

import type { HeroSectionConfig } from '@defalt/sections/engine'
import {
  ToggleSwitch,
  SliderField,
  ColorPickerSetting,
  ButtonGroupSetting,
  SettingSection,
  SettingField,
  InlineControlRow,
} from '@defalt/ui'
import { sanitizeHex, getContrastTextColor } from '@defalt/utils/color/colorUtils'

export type HeroSectionSettingsProps = {
  config: HeroSectionConfig
  padding: { top: number, bottom: number }
  accentColor: string
  onUpdateConfig: (updater: (config: HeroSectionConfig) => HeroSectionConfig) => void
  onPaddingChange: (direction: 'top' | 'bottom', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom', value: number) => void
}

export default function HeroSectionSettings({
  config,
  padding,
  accentColor,
  onUpdateConfig,
  onPaddingChange,
  onPaddingCommit,
}: HeroSectionSettingsProps) {
  const alignmentValue = config.contentAlignment === 'left'
    ? 'left'
    : config.contentAlignment === 'right'
      ? 'right'
      : 'center'
  const widthValue = (!config.contentWidth || config.contentWidth === 'regular') ? 'regular' : 'full'
  const heightValue = config.heightMode === 'expand' ? 'expand' : 'regular'
  const isFullWidth = widthValue === 'full'
  const showButton = config.showButton !== false

  const backgroundColor = sanitizeHex(config.backgroundColor, '#000000')
  const buttonColor = sanitizeHex(config.buttonColor, '#ffffff')
  const buttonTextColor = sanitizeHex(config.buttonTextColor, '#151515')
  const cardBorderRadius = typeof config.cardBorderRadius === 'number'
    ? config.cardBorderRadius
    : typeof config.buttonBorderRadius === 'number'
      ? config.buttonBorderRadius
      : 24

  const placeholder = config.placeholder ?? {
    title: '',
    description: '',
    imageUrl: undefined,
    buttonText: '',
    buttonHref: '',
  }

  const handleConfigPatch = useCallback((patch: Partial<HeroSectionConfig>) => {
    onUpdateConfig((current) => ({
      ...current,
      ...patch,
      placeholder: current.placeholder ?? {
        title: '',
        description: '',
        buttonText: '',
        buttonHref: '',
      }
    }))
  }, [onUpdateConfig])

  const handlePlaceholderChange = useCallback((field: 'title' | 'description' | 'buttonText' | 'buttonHref', value: string) => {
    onUpdateConfig((current) => {
      const currentPlaceholder = current.placeholder ?? {
        title: '',
        description: '',
        imageUrl: undefined,
        buttonText: '',
        buttonHref: '',
      }
      return {
        ...current,
        placeholder: {
          ...currentPlaceholder,
          [field]: value
        }
      }
    })
  }, [onUpdateConfig])

  const handleBackgroundColorChange = useCallback((color: string) => {
    const sanitized = sanitizeHex(color, backgroundColor)
    handleConfigPatch({
      backgroundColor: sanitized
    })
  }, [backgroundColor, handleConfigPatch])

  const handleButtonColorChange = useCallback((color: string) => {
    const sanitized = sanitizeHex(color, buttonColor)
    const nextText = getContrastTextColor(sanitized)
    handleConfigPatch({
      buttonColor: sanitized,
      buttonTextColor: nextText
    })
  }, [buttonColor, handleConfigPatch])

  const [backgroundColorPickerExpanded, setBackgroundColorPickerExpanded] = useState(false)
  const [buttonColorPickerExpanded, setButtonColorPickerExpanded] = useState(false)

  const accentSwatchColor = useMemo(() => sanitizeHex(accentColor, '#151515'), [accentColor])

  const backgroundSwatches = useMemo(() => ([
    { title: 'White', hex: '#ffffff' },
    { title: 'Black', hex: '#000000' },
    { title: 'Brand color', hex: accentSwatchColor, accent: true }
  ]), [accentSwatchColor])

  const buttonSwatches = useMemo(() => ([
    { title: 'Black', hex: '#000000' },
    { title: 'Light grey', hex: '#d1d5db' },
    { title: 'Brand color', hex: accentSwatchColor, accent: true }
  ]), [accentSwatchColor])

  const buttonTextSwatches = useMemo(() => ([
    { title: 'White', hex: '#ffffff' },
    { title: 'Dark', hex: '#151515' }
  ]), [])

  const widthOptions = useMemo(() => ([
    { label: 'Regular', value: 'regular', icon: <GalleryHorizontal size={16} /> },
    { label: 'Full', value: 'full', icon: <UnfoldHorizontal size={16} /> },
  ]), [])

  const heightOptions = useMemo(() => ([
    { label: 'Regular', value: 'regular', icon: <AlignVerticalSpaceAround size={16} /> },
    { label: 'Expand', value: 'expand', icon: <UnfoldVertical size={16} /> },
  ]), [])

  const alignmentOptions = useMemo(() => ([
    { label: 'Left', value: 'left', icon: <AlignLeft size={16} /> },
    { label: 'Center', value: 'center', icon: <AlignCenter size={16} /> },
    { label: 'Right', value: 'right', icon: <AlignRight size={16} /> },
  ]), [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-8 pl-4 pr-6 py-4">
        <SettingSection title="Content">
          <SettingField
            label="Heading"
            htmlFor="hero-heading-input"
          >
            <input
              id="hero-heading-input"
              type="text"
              value={placeholder.title}
              onChange={(event) => handlePlaceholderChange('title', event.target.value)}
              className="w-full rounded border border-border-strong px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter heading text"
            />
          </SettingField>

          <SettingField
            label="Subheading"
            htmlFor="hero-description-input"
          >
            <textarea
              id="hero-description-input"
              value={placeholder.description}
              onChange={(event) => handlePlaceholderChange('description', event.target.value)}
              className="w-full min-h-[96px] resize-y rounded border border-border-strong px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter subheading text"
            />
          </SettingField>

        </SettingSection>

        <Separator.Root className="h-px bg-hover" />

        <SettingSection title="Appearance">
          <ButtonGroupSetting
            label="Width"
            value={widthValue}
            options={widthOptions}
            onChange={(next) => {
              if (next === 'regular' || next === 'full') {
                handleConfigPatch({ contentWidth: next })
              }
            }}
          />
          <SliderField
            label="Border radius"
            value={cardBorderRadius}
            min={0}
            max={96}
            step={1}
            onChange={(value) => handleConfigPatch({ cardBorderRadius: value })}
            disabled={isFullWidth}
            variant="normal"
          />
          <ButtonGroupSetting
            label="Height"
            value={heightValue}
            options={heightOptions}
            onChange={(next) => {
              if (next === 'regular' || next === 'expand') {
                handleConfigPatch({ heightMode: next })
              }
            }}
          />
          <ButtonGroupSetting
            label="Alignment"
            value={alignmentValue}
            options={alignmentOptions}
            onChange={(next) => {
              if (next === 'left' || next === 'center' || next === 'right') {
                handleConfigPatch({ contentAlignment: next })
              }
            }}
          />

          <ColorPickerSetting
            label="Background"
            value={backgroundColor}
            swatches={backgroundSwatches}
            isExpanded={backgroundColorPickerExpanded}
            onChange={handleBackgroundColorChange}
            onTogglePicker={(expanded) => {
              setBackgroundColorPickerExpanded(expanded)
              if (expanded) {
                setButtonColorPickerExpanded(false)
              }
            }}
            dataTestId="hero-background-color"
            accentColor={accentColor}
            hasTransparentOption
          />

        </SettingSection>

        <Separator.Root className="h-px bg-hover" />

        <SettingSection title="Button">
          <InlineControlRow label="Show button">
            <ToggleSwitch
              checked={showButton}
              onChange={(checked) => handleConfigPatch({ showButton: checked })}
              ariaLabel="Toggle hero button"
            />
          </InlineControlRow>

          <div className={`space-y-4 ${showButton ? '' : 'opacity-50'}`}>
            <SettingField
              label="Button label"
              htmlFor="hero-button-label-input"
            >
              <input
                id="hero-button-label-input"
                type="text"
                value={placeholder.buttonText ?? ''}
                onChange={(event) => handlePlaceholderChange('buttonText', event.target.value)}
                className="w-full rounded border border-border-strong px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-subtle disabled:text-placeholder"
                placeholder="Add button text"
                disabled={!showButton}
              />
            </SettingField>

            <SettingField
              label="Button link"
              htmlFor="hero-button-link-input"
            >
              <input
                id="hero-button-link-input"
                type="text"
                value={placeholder.buttonHref ?? ''}
                onChange={(event) => handlePlaceholderChange('buttonHref', event.target.value)}
                className="w-full rounded border border-border-strong px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-subtle disabled:text-placeholder"
                placeholder="https://example.com"
                disabled={!showButton}
              />
            </SettingField>

            <ColorPickerSetting
              label="Button color"
              value={buttonColor}
              swatches={buttonSwatches}
              isExpanded={buttonColorPickerExpanded}
              onChange={handleButtonColorChange}
              onTogglePicker={(expanded) => {
                setButtonColorPickerExpanded(expanded)
                if (expanded) {
                  setBackgroundColorPickerExpanded(false)
                }
              }}
              dataTestId="hero-button-color"
              disabled={!showButton}
              accentColor={accentColor}
              hasTransparentOption
            />

            <ColorPickerSetting
              label="Button text color"
              value={buttonTextColor}
              swatches={buttonTextSwatches}
              onChange={(value) => handleConfigPatch({ buttonTextColor: sanitizeHex(value, buttonTextColor) })}
              dataTestId="hero-button-text-color"
              disabled={!showButton}
            />
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
            onChange={(value) => onPaddingChange('top', value)}
            onCommit={(value) => onPaddingCommit?.('top', value)}
            variant="normal"
          />
          <SliderField
            label="Bottom"
            value={padding.bottom}
            min={0}
            max={200}
            step={1}
            onChange={(value) => onPaddingChange('bottom', value)}
            onCommit={(value) => onPaddingCommit?.('bottom', value)}
            variant="normal"
          />
        </SettingSection>
      </div>
    </div>
  )
}
