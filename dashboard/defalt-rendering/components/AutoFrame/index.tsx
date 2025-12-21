import { createContext } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { createPortal } from 'react-dom'

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

export type AutoFrameProps = {
  children?: ReactNode
  title?: string
  className?: string
  style?: CSSProperties
  iframeStyle?: CSSProperties
}

const FRAME_SRC_DOC = '<!DOCTYPE html><html><head></head><body><div id="frame-root" data-defalt-frame></div></body></html>'

export function AutoFrame({
  children,
  title = 'Preview frame',
  className,
  style,
  iframeStyle,
}: AutoFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [frameDoc, setFrameDoc] = useState<Document | null>(null)
  const [frameWindow, setFrameWindow] = useState<Window | null>(null)
  const [frameRoot, setFrameRoot] = useState<HTMLDivElement | null>(null)

  const handleLoad = useCallback(() => {
    const iframe = frameRef.current
    if (!iframe) {
      return
    }
    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) {
      return
    }
    let root = doc.getElementById('frame-root') as HTMLDivElement | null
    if (!root && doc.body) {
      root = doc.createElement('div')
      root.id = 'frame-root'
      root.setAttribute('data-defalt-frame', 'true')
      doc.body.appendChild(root)
    }
    setFrameDoc(doc)
    setFrameWindow(win)
    setFrameRoot(root)
  }, [])

  const contextValue = useMemo(
    () => ({
      document: frameDoc,
      window: frameWindow,
      frameRoot,
    }),
    [frameDoc, frameWindow, frameRoot]
  )

  return (
    <div className={className} style={style}>
      <iframe
        ref={frameRef}
        title={title}
        style={iframeStyle}
        srcDoc={FRAME_SRC_DOC}
        onLoad={handleLoad}
      />
      {frameRoot && frameDoc && (
        <AutoFrameContext.Provider value={contextValue}>
          {createPortal(children, frameRoot)}
        </AutoFrameContext.Provider>
      )}
    </div>
  )
}
