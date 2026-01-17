import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ImgBgIcon } from '../../icons/ImgBgIcon'
import { FloatingTooltip } from '../FloatingTooltip'
import { getAccentColor } from '@defalt/utils/color/getAccentColor'
import { useClickOutside } from '../../hooks/useClickOutside'
import { cn } from '../../utils/cn'
import { RAINBOW_GRADIENT } from './constants'
import { ColorPicker } from './ColorPicker'
import { ColorSwatch } from './ColorSwatch'
import type { KoenigSwatch } from './types'

type ColorIndicatorProps = {
  value: string
  activeSwatch?: string
  swatches: KoenigSwatch[]
  onSwatchChange: (value: string) => void
  onTogglePicker: (expanded: boolean) => void
  onChange: (value: string) => void
  onCommit?: (value: string) => void
  isExpanded?: boolean
  eyedropper?: boolean
  hasTransparentOption?: boolean
  children?: ReactNode
}

export function ColorIndicator({
  value,
  activeSwatch,
  swatches,
  onSwatchChange,
  onTogglePicker,
  onChange,
  onCommit,
  isExpanded = false,
  eyedropper,
  hasTransparentOption,
  children
}: ColorIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const valueOnOpenRef = useRef<string>(value)

  useClickOutside(isOpen, popoverRef, () => setIsOpen(false))

  const { backgroundColor, selectedSwatch } = useMemo(() => {
    const accentSwatch = swatches.find((swatch) => swatch.accent)
    const accentHexValue = accentSwatch?.hex ?? getAccentColor()
    const accentHexLower = accentHexValue?.toLowerCase()
    const normalizedValue = typeof value === 'string' ? value.toLowerCase() : value
    const normalizedActive = activeSwatch?.toLowerCase()
    const selectionKey = normalizedActive ?? normalizedValue

    if (selectionKey === 'accent' || (!normalizedActive && accentHexLower && normalizedValue === accentHexLower)) {
      return {
        backgroundColor: accentHexValue,
        selectedSwatch: accentSwatch?.title ?? null
      }
    }

    if (selectionKey === 'image') {
      return {
        backgroundColor: 'transparent',
        selectedSwatch: swatches.find((swatch) => swatch.image)?.title ?? null
      }
    }

    if (selectionKey === 'transparent') {
      return {
        backgroundColor: 'white',
        selectedSwatch: swatches.find((swatch) => swatch.transparent)?.title ?? null
      }
    }

    const match = swatches.find((swatch) => swatch.hex?.toLowerCase() === selectionKey)?.title ?? null

    return {
      backgroundColor: value,
      selectedSwatch: match
    }
  }, [activeSwatch, swatches, value])

  const handleColorPickerChange = useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange]
  )

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          valueOnOpenRef.current = value
        } else {
          onTogglePicker(false)
          if (onCommit && value !== valueOnOpenRef.current) {
            onCommit(value)
          }
        }
        setIsOpen(open)
      }}
    >
      <div className="relative inline-flex shrink-0 items-center gap-3" data-testid="color-selector-button">
        <Popover.Trigger asChild>
          <button
            ref={triggerRef}
            className={cn('relative size-6 cursor-pointer rounded-full', value ? 'p-[2px]' : 'border border-border')}
            type="button"
            onClick={() => {}}
          >
            {value && (
              <div
                className="absolute inset-0 rounded-full bg-clip-content p-[3px]"
                style={{
                  background: RAINBOW_GRADIENT,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude'
                }}
              />
            )}
            <span
              className={cn(
                'block size-full rounded-full border-2 border-white',
                value === 'image' && 'flex items-center justify-center'
              )}
              style={{ backgroundColor }}
            >
              {value === 'image' && <ImgBgIcon className="size-[1.4rem]" />}
              {value === 'transparent' && <div className="absolute left-[3px] top-[3px] z-10 w-[136%] origin-left rotate-45 border-b border-b-red-500" />}
            </span>
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={8}
          className={cn(
            "z-[1000] flex flex-col gap-3 rounded-md bg-surface p-3 shadow-lg",
            isExpanded ? 'w-[220px]' : 'w-auto'
          )}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {!isExpanded && children}
          {isExpanded && (
            <ColorPicker
              eyedropper={eyedropper}
              hasTransparentOption={hasTransparentOption}
              value={value}
              onChange={handleColorPickerChange}
            >
              {children}
            </ColorPicker>
          )}
          <div className="flex justify-end gap-1">
            <div className="flex items-center gap-1">
              {swatches.map(({ customContent, ...swatch }) => (
                customContent ? (
                  <Fragment key={swatch.title}>{customContent}</Fragment>
                ) : (
                  <ColorSwatch
                    key={swatch.title}
                    swatch={swatch}
                    isSelected={selectedSwatch === swatch.title}
                    onSelect={(selected) => {
                      onSwatchChange(selected)
                    }}
                  />
                )
              ))}
            </div>
            <FloatingTooltip content="Pick color" placement="top">
              <button
                aria-label="Pick color"
                className={cn('relative size-6 rounded-full border border-border', !selectedSwatch && 'p-[2px] border-none')}
                data-testid="color-picker-toggle"
                type="button"
                onClick={() => onTogglePicker(!isExpanded)}
              >
                {!selectedSwatch ? (
                  <>
                    <div
                      className="absolute inset-0 rounded-full bg-clip-content p-[3px]"
                      style={{
                        background: RAINBOW_GRADIENT,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude'
                      }}
                    />
                    <span className="block size-full rounded-full border-2 border-white" style={{ backgroundColor }}>
                      {value === 'transparent' && <div className="absolute left-[3px] top-[3px] z-10 w-[136%] origin-left rotate-45 border-b border-b-red-500" />}
                    </span>
                  </>
                ) : (
                  <div className="absolute inset-0 rounded-full" style={{ background: RAINBOW_GRADIENT }} />
                )}
              </button>
            </FloatingTooltip>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
