import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import type { EyeDropperWindow } from './types'

export function useEyeDropper(onChange: (color: string) => void, onComplete?: () => void) {
  const isSupported = typeof window !== 'undefined' && 'EyeDropper' in window

  const openEyeDropper = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (!isSupported) return

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
          document.body.style.removeProperty('pointer-events')
          onComplete?.()
        })
    },
    [onChange, onComplete, isSupported]
  )

  return { isSupported, openEyeDropper }
}
