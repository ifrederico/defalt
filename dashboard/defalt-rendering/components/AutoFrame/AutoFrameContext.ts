import { createContext } from 'react'

export type AutoFrameContextValue = {
  document: Document | null
  window: Window | null
  frameRoot: HTMLDivElement | null
}

export const AutoFrameContext = createContext<AutoFrameContextValue>({
  document: null,
  window: null,
  frameRoot: null,
})
