import * as Separator from '@radix-ui/react-separator'
import { SliderField, SettingSection } from '@defalt/ui'
import { SECTION_ID_MAP, PADDING_BLOCK_SECTIONS } from '@defalt/utils/config/themeConfig'

export type SectionSpacingMode = 'auto' | 'padding-block' | 'padding' | 'margin'

export type SectionPaddingSettingsProps = {
  sectionId: string
  padding: { top: number, bottom: number, left?: number, right?: number }
  margin?: { top?: number, bottom?: number }
  defaultMargin?: { top?: number, bottom?: number }
  onChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onCommit: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onMarginChange?: (direction: 'top' | 'bottom', value: number) => void
  onMarginCommit?: (direction: 'top' | 'bottom', value: number) => void
  mode?: SectionSpacingMode
}

export function SectionPaddingSettings({ sectionId, padding, margin, defaultMargin, onChange, onCommit, onMarginChange, onMarginCommit, mode = 'auto' }: SectionPaddingSettingsProps) {
  const configKey = SECTION_ID_MAP[sectionId] || sectionId
  const resolvedMode: SectionSpacingMode = (() => {
    if (mode !== 'auto') {
      return mode
    }
    return PADDING_BLOCK_SECTIONS.has(configKey) ? 'padding-block' : 'padding'
  })()
  const showPaddingControls = resolvedMode !== 'margin'
  const isPaddingBlockSection = resolvedMode === 'padding-block'
  const marginBottomValue = (() => {
    if (margin && typeof margin.bottom === 'number') {
      return margin.bottom
    }
    if (defaultMargin && typeof defaultMargin.bottom === 'number') {
      return defaultMargin.bottom
    }
    return 0
  })()
  const marginTopValue = (() => {
    if (margin && typeof margin.top === 'number') {
      return margin.top
    }
    if (defaultMargin && typeof defaultMargin.top === 'number') {
      return defaultMargin.top
    }
    return 0
  })()
  const marginControlAvailable = typeof onMarginChange === 'function'
  const showMarginControls = marginControlAvailable && (
    resolvedMode === 'margin' ||
    defaultMargin?.bottom !== undefined ||
    defaultMargin?.top !== undefined ||
    margin?.bottom !== undefined ||
    margin?.top !== undefined
  )
  const showMarginTopSlider = showMarginControls && (resolvedMode === 'margin' || margin?.top !== undefined || defaultMargin?.top !== undefined)
  const showMarginBottomSlider = showMarginControls && (resolvedMode === 'margin' || margin?.bottom !== undefined || defaultMargin?.bottom !== undefined)

  return (
    <>
      {showPaddingControls && (
        <SettingSection title="Padding">
          {isPaddingBlockSection ? (
            <SliderField
              label="Padding block"
              value={padding.top}
              min={0}
              max={200}
              step={1}
              onChange={(value) => onChange('top', value)}
              onCommit={(value) => onCommit('top', value)}
              variant="normal"
            />
          ) : (
            <>
              <SliderField
                label="Top"
                value={padding.top}
                min={0}
                max={200}
                step={1}
                onChange={(value) => onChange('top', value)}
                onCommit={(value) => onCommit('top', value)}
                variant="normal"
              />
              <SliderField
                label="Bottom"
                value={padding.bottom}
                min={0}
                max={200}
                step={1}
                onChange={(value) => onChange('bottom', value)}
                onCommit={(value) => onCommit('bottom', value)}
                variant="normal"
              />
            </>
          )}
        </SettingSection>
      )}

      {showPaddingControls && showMarginControls && (
        <Separator.Root className="h-px bg-hover" />
      )}

      {showMarginControls && (
        <SettingSection title="Margin">
          {showMarginTopSlider && (
            <SliderField
              label="Top"
              value={marginTopValue}
              min={0}
              max={200}
              step={1}
              onChange={(value) => onMarginChange?.('top', value)}
              onCommit={(value) => onMarginCommit?.('top', value)}
              variant="normal"
            />
          )}
          {showMarginBottomSlider && (
            <SliderField
              label="Bottom"
              value={marginBottomValue}
              min={0}
              max={200}
              step={1}
              onChange={(value) => onMarginChange?.('bottom', value)}
              onCommit={(value) => onMarginCommit?.('bottom', value)}
              variant="normal"
            />
          )}
        </SettingSection>
      )}
    </>
  )
}
