import { useEffect } from 'react'
import { ensurePreviewStyles } from '../../custom-source/handlebars/domManipulation'
import { useFrame } from './useFrame'

const EDITOR_STYLES_ID = 'defalt-editor-overlay-styles'
const EDITOR_STYLES = `
  .df-selection-overlay {
    position: absolute;
    pointer-events: none;
    z-index: 10;
    border-radius: 0;
    box-sizing: border-box;
  }
  .df-selection-overlay--selected {
    outline: 2px solid #4dd831;
    outline-offset: -3px;
  }
  .df-selection-overlay--hover {
    outline: 2px solid rgba(77, 216, 49, 0.6);
    outline-offset: -3px;
  }
  .df-action-bar {
    position: absolute;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.92);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 12px;
  }
  .df-action-bar button {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    color: #e2e8f0;
    cursor: pointer;
  }
  .df-action-bar button:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #ffffff;
  }
  .df-action-bar button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .df-action-bar button:disabled:hover {
    background: transparent;
    color: #e2e8f0;
  }
`

export function EditorStyles() {
  const { document: frameDocument } = useFrame()

  useEffect(() => {
    if (!frameDocument) {
      return
    }
    const ensureStyles = () => {
      ensurePreviewStyles(frameDocument)
      if (!frameDocument.getElementById(EDITOR_STYLES_ID)) {
        const style = frameDocument.createElement('style')
        style.id = EDITOR_STYLES_ID
        style.type = 'text/css'
        style.textContent = EDITOR_STYLES
        frameDocument.head.appendChild(style)
      }
    }

    ensureStyles()

    const observer = new MutationObserver(() => {
      ensureStyles()
    })

    observer.observe(frameDocument.head, { childList: true })

    return () => observer.disconnect()
  }, [frameDocument])

  return null
}
