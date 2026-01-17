import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode, TouchEvent } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { EyedropperIcon } from '../../icons/EyedropperIcon'
import { getAccentColor } from '@defalt/utils/color/getAccentColor'
import { useEyeDropper } from './useEyeDropper'

type ColorPickerProps = {
  value: string
  eyedropper?: boolean
  hasTransparentOption?: boolean
  onChange: (next: string) => void
  children?: ReactNode
}

export function ColorPicker({ value, eyedropper, hasTransparentOption, onChange, children }: ColorPickerProps) {
  const inputWrapperRef = useRef<HTMLDivElement | null>(null)
  const listenersRef = useRef<{ mouseup: (() => void) | null; touchend: (() => void) | null }>({
    mouseup: null,
    touchend: null
  })

  const focusInput = useCallback(() => {
    inputWrapperRef.current?.querySelector('input')?.focus()
  }, [])

  const { isSupported: eyeDropperSupported, openEyeDropper } = useEyeDropper(onChange, focusInput)

  const stopPropagation = useCallback((event: MouseEvent | TouchEvent) => {
    event.stopPropagation()
    const inputElement = inputWrapperRef.current?.querySelector('input')
    if (event.target !== inputElement) {
      inputElement?.focus()
      event.preventDefault()
    }
  }, [])

  const removeListeners = useCallback(() => {
    if (listenersRef.current.mouseup) {
      document.removeEventListener('mouseup', listenersRef.current.mouseup)
      listenersRef.current.mouseup = null
    }
    if (listenersRef.current.touchend) {
      document.removeEventListener('touchend', listenersRef.current.touchend)
      listenersRef.current.touchend = null
    }
  }, [])

  const startUsingColorPicker = useCallback(() => {
    removeListeners()
    const handler = () => {
      focusInput()
      removeListeners()
    }
    listenersRef.current.mouseup = handler
    listenersRef.current.touchend = handler
    document.addEventListener('mouseup', handler)
    document.addEventListener('touchend', handler)
  }, [removeListeners, focusInput])

  useEffect(() => removeListeners, [removeListeners])
  useEffect(() => { focusInput() }, [focusInput])

  let hexValue = value
  if (value === 'accent') {
    hexValue = getAccentColor()
  } else if (value === 'transparent') {
    hexValue = ''
  }

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
          onClick={focusInput}
        >
          <span className="text-muted">#</span>
          <HexColorInput aria-label="Color value" className="z-50 w-full bg-transparent text-sm text-foreground focus:outline-none" color={hexValue} onChange={handleHexInputChange} spellCheck={false} />
          {eyedropper && eyeDropperSupported && (
            <button
              aria-label="Pick color from screen"
              className="absolute inset-y-0 right-3 z-50 my-auto size-4 p-[1px] text-muted"
              type="button"
              onClick={openEyeDropper}
            >
              <EyedropperIcon aria-hidden="true" className="size-full stroke-2" />
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
