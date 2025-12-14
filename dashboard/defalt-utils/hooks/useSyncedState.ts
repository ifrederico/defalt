import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type MutableRefObject } from 'react'

export function useSyncedState<T>(initial: T): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>]
export function useSyncedState<T>(
  initial: () => T
): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>]
export function useSyncedState<T>(
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>] {
  const [state, setState] = useState<T>(initial as T)
  const ref = useRef(state)

  useEffect(() => {
    ref.current = state
  }, [state])

  return [state, setState, ref]
}
