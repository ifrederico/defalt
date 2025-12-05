import { useEffect, useMemo, useState } from 'react'
import { ColorIndicator, type KoenigSwatch } from './ColorPicker'
import './ColorPickerSetting.css'
import type { ColorPickerSettingProps } from './types'

export default function ColorPickerSetting({
  label,
  value,
  swatches,
  onPickerChange,
  onSwatchChange,
  onChange,
  onCommit,
  onTogglePicker,
  isExpanded: externalIsExpanded,
  dataTestId,
  disabled,
  hasTransparentOption = true,
  accentColor,
  children
}: ColorPickerSettingProps) {
  // Manage internal state for expansion
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)

  // Use external state if provided, otherwise use internal state
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded

  // Handle toggle - update internal state and notify parent
  const handleTogglePicker = (expanded: boolean) => {
    if (externalIsExpanded === undefined) {
      setInternalIsExpanded(expanded)
    }
    onTogglePicker?.(expanded)
  }

  const koenigSwatches = useMemo<KoenigSwatch[]>(
    () =>
      swatches.map((swatch) => ({
        title: swatch.title,
        hex: swatch.hex ?? swatch.value,
        accent: swatch.accent,
        transparent: swatch.title.toLowerCase().includes('transparent'),
        customContent: swatch.customContent
      })),
    [swatches]
  )

  const accentSwatch = koenigSwatches.find((swatch) => swatch.accent)
  const accentHex = accentSwatch?.hex?.toLowerCase()

  const [activeSwatch, setActiveSwatch] = useState<string | undefined>(() => {
    const normalizedValue = value?.toLowerCase()
    if (accentHex && normalizedValue === accentHex) {
      return 'accent'
    }
    return normalizedValue
  })

  useEffect(() => {
    const normalizedValue = value?.toLowerCase()
    setActiveSwatch((current) => {
      if (accentHex && normalizedValue === accentHex) {
        return current && current !== 'accent' ? current : 'accent'
      }
      return normalizedValue
    })
  }, [value, accentHex])

  const handleSwatchChange = (selected: string) => {
    const normalized = selected.toLowerCase()
    const next = normalized === 'accent' ? 'accent' : normalized
    setActiveSwatch(next)

    let colorValue = selected
    if (next === 'accent') {
      colorValue = (accentSwatch?.hex ?? accentColor ?? value)?.toLowerCase()
    }

    // Use new API if available, fall back to legacy
    if (onChange) {
      onChange(colorValue)
    } else if (onSwatchChange) {
      onSwatchChange(colorValue)
    }
  }

  const handlePickerChange = (next: string) => {
    setActiveSwatch(next.toLowerCase())
    // Use new API if available, fall back to legacy
    if (onChange) {
      onChange(next)
    } else if (onPickerChange) {
      onPickerChange(next)
    }
  }

  const handleCommit = (committedValue: string) => {
    if (onCommit) {
      onCommit(committedValue)
    }
  }

  const displayValue = activeSwatch === 'accent' && accentSwatch?.hex ? accentSwatch.hex : value

  return (
    <div data-testid={dataTestId} className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div className="flex items-center gap-3">
        <p className="font-md text-secondary whitespace-nowrap min-w-[96px] flex-shrink-0">{label}</p>
        <div className="ml-auto">
          <ColorIndicator
            value={displayValue}
            activeSwatch={activeSwatch}
            swatches={koenigSwatches}
            onSwatchChange={handleSwatchChange}
            onTogglePicker={handleTogglePicker}
            onChange={handlePickerChange}
            onCommit={handleCommit}
            isExpanded={isExpanded}
            hasTransparentOption={hasTransparentOption}
            eyedropper={false}
          >
            {children}
          </ColorIndicator>
        </div>
      </div>
    </div>
  )
}
