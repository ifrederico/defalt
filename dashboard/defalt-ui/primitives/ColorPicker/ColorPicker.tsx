import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, ReactNode, TouchEvent } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import * as Popover from '@radix-ui/react-popover'
import { EyedropperIcon } from '../../icons/EyedropperIcon'
import { ImgBgIcon } from '../../icons/ImgBgIcon'
import { Tooltip } from '../Tooltip'
import { getAccentColor } from '@defalt/utils/color/getAccentColor'
import { useClickOutside } from '../../hooks/useClickOutside'
import { usePreviousFocus } from '../../hooks/usePreviousFocus'
import { PlusIcon } from '../../icons/PlusIcon'
import { cn } from '../../utils/cn'

const RAINBOW_GRADIENT =
  'conic-gradient(hsl(360,100%,50%),hsl(315,100%,50%),hsl(270,100%,50%),hsl(225,100%,50%),hsl(180,100%,50%),hsl(135,100%,50%),hsl(90,100%,50%),hsl(45,100%,50%),hsl(0,100%,50%))'

export type KoenigSwatch = {
  title: string
  hex?: string
  accent?: boolean
  transparent?: boolean
  image?: boolean
  customContent?: ReactNode
}

type EyeDropperAPI = {
  open: () => Promise<{ sRGBHex: string }>
}

type EyeDropperWindow = typeof window & { EyeDropper?: new () => EyeDropperAPI }

type ColorPickerProps = {
  value: string
  eyedropper?: boolean
  hasTransparentOption?: boolean
  onChange: (next: string) => void
  children?: ReactNode
}

export function ColorPicker({ value, eyedropper, hasTransparentOption, onChange, children }: ColorPickerProps) {
  const inputWrapperRef = useRef<HTMLDivElement | null>(null)

  const stopPropagation = useCallback((event: MouseEvent | TouchEvent) => {
    event.stopPropagation()

    const inputElement = inputWrapperRef.current?.querySelector('input')
    const isInputField = event.target === inputElement

    if (isInputField) {
      return
    }

    inputElement?.focus()
    event.preventDefault()
  }, [])

  const isUsingColorPicker = useRef(false)

  const stopUsingColorPicker = useCallback(() => {
    isUsingColorPicker.current = false
    inputWrapperRef.current?.querySelector('input')?.focus()

    document.removeEventListener('mouseup', stopUsingColorPicker)
    document.removeEventListener('touchend', stopUsingColorPicker)
  }, [])

  const startUsingColorPicker = useCallback(() => {
    isUsingColorPicker.current = true

    document.addEventListener('mouseup', stopUsingColorPicker)
    document.addEventListener('touchend', stopUsingColorPicker)
  }, [stopUsingColorPicker])

  useEffect(() => {
    return () => {
      document.removeEventListener('mouseup', stopUsingColorPicker)
      document.removeEventListener('touchend', stopUsingColorPicker)
    }
  }, [stopUsingColorPicker])

  const openColorPicker = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (typeof window === 'undefined' || !('EyeDropper' in window)) {
        return
      }

      document.body.style.setProperty('pointer-events', 'none')

      const ctor = (window as EyeDropperWindow).EyeDropper
      if (!ctor) {
        document.body.style.removeProperty('pointer-events')
        return
      }

      new ctor()
        .open()
        .then((result) => onChange(result.sRGBHex))
        .finally(() => {
          isUsingColorPicker.current = false
          document.body.style.removeProperty('pointer-events')
          inputWrapperRef.current?.querySelector('input')?.focus()
        })
    },
    [onChange]
  )

  useEffect(() => {
    inputWrapperRef.current?.querySelector('input')?.focus()
  }, [])

  let hexValue = value
  if (value === 'accent') {
    hexValue = getAccentColor()
  } else if (value === 'transparent') {
    hexValue = ''
  }

  const focusHexInputOnClick = useCallback(() => {
    inputWrapperRef.current?.querySelector('input')?.focus()
  }, [])

  const handleHexInputChange = useCallback(
    (next: string) => {
      if (next === '') {
        onChange(next)
        return
      }

      const normalized = next.startsWith('#') ? next.toLowerCase() : `#${next.toLowerCase()}`
      onChange(normalized)
    },
    [onChange]
  )

  return (
    <div className="gd-color-picker" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
      <HexColorPicker color={hexValue || '#ffffff'} onChange={onChange} onMouseDown={startUsingColorPicker} onTouchStart={startUsingColorPicker} />
      <div className="mt-3 flex gap-2">
        <div
          ref={inputWrapperRef}
          className="relative flex w-full items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-sm text-foreground shadow-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-ring"
          onClick={focusHexInputOnClick}
        >
          <span className="text-muted">#</span>
          <HexColorInput aria-label="Color value" className="z-50 w-full bg-transparent text-sm text-foreground focus:outline-none" color={hexValue} onChange={handleHexInputChange} spellCheck={false} />
          {eyedropper && typeof window !== 'undefined' && (window as EyeDropperWindow).EyeDropper && (
            <button
              className="absolute inset-y-0 right-3 z-50 my-auto size-4 p-[1px] text-muted"
              type="button"
              onClick={openColorPicker}
            >
              <EyedropperIcon className="size-full stroke-2" />
            </button>
          )}
        </div>

        {hasTransparentOption && (
          <button
            className="inline-flex items-center justify-center rounded border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={() => onChange('transparent')}
          >
            Clear
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

type ColorSwatchProps = {
  swatch: KoenigSwatch
  isSelected: boolean
  onSelect: (value: string) => void
}

function ColorSwatch({ swatch, isSelected, onSelect }: ColorSwatchProps) {
  const backgroundColor = swatch.accent ? swatch.hex ?? getAccentColor() : swatch.hex

  const onSelectHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (swatch.accent) {
        onSelect('accent')
      } else if (swatch.transparent) {
        onSelect('transparent')
      } else if (swatch.hex) {
        onSelect(swatch.hex.toLowerCase())
      }
    },
    [onSelect, swatch]
  )

  if (swatch.customContent) {
    return <Fragment key={swatch.title}>{swatch.customContent}</Fragment>
  }

  return (
    <button
      className={cn(
        'group relative flex size-5 shrink-0 items-center rounded-full border border-border',
        isSelected && 'outline outline-2 outline-emerald-500'
      )}
      style={{ backgroundColor }}
      title={swatch.title}
      type="button"
      onClick={onSelectHandler}
    >
      {swatch.transparent && <div className="absolute left-0 top-0 z-10 w-[136%] origin-left rotate-45 border-b border-b-red-500" />}
      <Tooltip label={swatch.title} />
    </button>
  )
}

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
            <button
              aria-label="Pick color"
              className={cn('group relative size-6 rounded-full border border-border', !selectedSwatch && 'p-[2px] border-none')}
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
                  <Tooltip label="Pick color" />
                </>
              ) : (
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(hsl(360,100%,50%),hsl(315,100%,50%),hsl(270,100%,50%),hsl(225,100%,50%),hsl(180,100%,50%),hsl(135,100%,50%),hsl(90,100%,50%),hsl(45,100%,50%),hsl(0,100%,50%))]" />
              )}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

type ColorOptionsButton = {
  label: string
  name: string
  color: string
}

type ColorOptionButtonsProps = {
  buttons?: ColorOptionsButton[]
  selectedName?: string
  onClick: (name: string) => void
}

export function ColorOptionButtons({ buttons = [], selectedName, onClick }: ColorOptionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const componentRef = useRef<HTMLDivElement | null>(null)

  const selectedButton = buttons.find((button) => button.name === selectedName)

  useClickOutside(isOpen, componentRef, () => setIsOpen(false))

  return (
    <div ref={componentRef} className="relative">
      <button
        className={cn('relative size-6 cursor-pointer rounded-full', selectedName ? 'p-[2px]' : 'border border-border')}
        data-testid="color-options-button"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedName && (
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
        <span className={cn(selectedButton?.color || '', 'block size-full rounded-full border-2 border-white')} />
      </button>

      {isOpen && (
        <div className="absolute -right-3 bottom-full z-50 mb-2 rounded-md bg-surface px-3 py-2 shadow-lg" data-testid="color-options-popover">
          <div className="flex">
            <ul className="flex w-full items-center justify-between rounded-md font-sans text-md font-normal text-white">
              {buttons.map(({ label, name, color }) => (
                name !== 'image' ? (
                  <ColorButton
                    key={`${name}-${label}`}
                    color={color}
                    data-testid={`color-options-${name}-button`}
                    label={label}
                    name={name}
                    selectedName={selectedName}
                    onClick={(title) => {
                      onClick(title)
                      setIsOpen(false)
                    }}
                  />
                ) : (
                  <li
                    key="background-image"
                    className={cn(
                      'mb-0 flex size-[3rem] cursor-pointer items-center justify-center rounded-full border-2',
                      selectedName === name ? 'border-emerald-500' : 'border-transparent'
                    )}
                    data-testid="background-image-color-button"
                    onClick={() => onClick(name)}
                  >
                    <span className="border-1 flex size-6 items-center justify-center rounded-full border border-black/5">
                      <PlusIcon className="size-3 stroke-gray-700 stroke-2" />
                    </span>
                  </li>
                )
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

type ColorButtonProps = {
  onClick: (name: string) => void
  label: string
  name: string
  color: string
  selectedName?: string
  ['data-testid']?: string
}

function ColorButton({ onClick, label, name, color, selectedName, ...rest }: ColorButtonProps) {
  const isActive = name === selectedName
  const { handleMousedown, handleClick } = usePreviousFocus(onClick, name)

  return (
    <li className="mb-0">
      <button
        aria-label={label}
        className={cn(
          'group relative flex size-6 cursor-pointer items-center justify-center rounded-full border-2',
          isActive ? 'border-emerald-500' : 'border-transparent'
        )}
        type="button"
        onMouseDown={handleMousedown}
        onClick={handleClick}
        {...rest}
      >
        <span className={cn(color, 'size-[1.8rem] rounded-full border border-black/5')} />
        <Tooltip label={label} />
      </button>
    </li>
  )
}
