/**
 * Clipboard Copy Utilities
 *
 * Provides cross-browser clipboard copy functionality
 * with fallback to execCommand for older browsers.
 */

export type CopyTarget = 'include' | 'partial'
export type CopyStatus = 'success' | 'error'

/**
 * Copies text to clipboard using the modern Clipboard API with fallback
 * Returns a promise that resolves to true on success, false on failure
 */
export async function copyToClipboard(
  text: string,
  frameDocument?: Document | null
): Promise<boolean> {
  // Try modern clipboard API first
  const clipboard = frameDocument?.defaultView?.navigator?.clipboard ?? navigator.clipboard
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy method
    }
  }

  // Fallback to legacy execCommand
  if (frameDocument) {
    return copyWithExecCommand(text, frameDocument)
  }

  return false
}

/**
 * Legacy clipboard copy using execCommand
 */
function copyWithExecCommand(text: string, doc: Document): boolean {
  const textarea = doc.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  doc.body.appendChild(textarea)
  textarea.select()

  try {
    return doc.execCommand('copy')
  } catch {
    return false
  } finally {
    doc.body.removeChild(textarea)
  }
}

/**
 * Creates a copy status notification handler
 */
export function createCopyStatusHandler(
  setCopyStatus: (status: { target: CopyTarget; status: CopyStatus } | null) => void,
  timeoutRef: { current: number | null }
) {
  const notifySuccess = (target: CopyTarget) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    setCopyStatus({ target, status: 'success' })
    timeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null)
      timeoutRef.current = null
    }, 1200)
  }

  const notifyFailure = (target: CopyTarget) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    setCopyStatus({ target, status: 'error' })
    timeoutRef.current = window.setTimeout(() => {
      setCopyStatus(null)
      timeoutRef.current = null
    }, 1200)
  }

  return { notifySuccess, notifyFailure }
}
