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
  .df-action-bar-overlay {
    position: absolute;
    pointer-events: none;
    z-index: 20;
  }
  .df-action-bar-overlay-inner {
    position: sticky;
    width: 100%;
    pointer-events: auto;
  }
  .df-action-bar {
    position: absolute;
    z-index: 20;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    width: max-content;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.92);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 12px;
    opacity: 1;
    pointer-events: auto;
    transform-origin: right top;
    min-height: 36px;
  }
  .df-action-bar__separator {
    width: 1px;
    height: 18px;
    background: rgba(148, 163, 184, 0.35);
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
  .df-action-bar__popover {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 21;
    width: min(520px, 90vw);
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35);
  }
  .df-action-bar__popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #cbd5f5;
    font-size: 12px;
    margin-bottom: 8px;
  }
  .df-action-bar__code + .df-action-bar__popover-header {
    margin-top: 10px;
  }
  .df-action-bar__copy-group {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .df-action-bar__copy-status {
    position: absolute;
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    line-height: 1;
    pointer-events: none;
  }
  .df-action-bar__copy-status--success {
    color: #4dd831;
  }
  .df-action-bar__copy-status--error {
    color: #ef4444;
  }
  .df-action-bar__copy {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    background: rgba(148, 163, 184, 0.2);
    color: #e2e8f0;
    cursor: pointer;
  }
  .df-action-bar__copy:hover {
    background: rgba(148, 163, 184, 0.35);
    color: #ffffff;
  }
  .df-action-bar__copy:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(148, 163, 184, 0.1);
  }
  .df-action-bar__copy svg {
    flex-shrink: 0;
  }
  .df-action-bar__code {
    margin: 0;
    padding: 10px 12px;
    border-radius: 6px;
    max-height: 240px;
    overflow: auto;
    background: rgba(2, 6, 23, 0.65);
    color: #e2e8f0;
    font-size: 11px;
    line-height: 1.5;
    white-space: pre;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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
