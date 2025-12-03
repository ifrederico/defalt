import { useEffect } from 'react'
import { useHistoryContext } from './useHistoryContext'

export function useHistoryInteractionBlocker(id: string, active: boolean) {
  const { setInteractionBlocker } = useHistoryContext()

  useEffect(() => {
    setInteractionBlocker(id, active)
    return () => {
      setInteractionBlocker(id, false)
    }
  }, [id, active, setInteractionBlocker])
}
