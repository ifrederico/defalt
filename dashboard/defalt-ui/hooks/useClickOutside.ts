import { useEffect } from 'react'

export function useClickOutside<T extends HTMLElement>(enabled: boolean, ref: React.RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    window.addEventListener('mousedown', handleClickOutside, { capture: true })
    return () => window.removeEventListener('mousedown', handleClickOutside, { capture: true })
  }, [enabled, handler, ref])
}
