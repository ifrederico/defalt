type PreviewLoadingBarProps = {
  visible?: boolean
}

export function PreviewLoadingBar({ visible = true }: PreviewLoadingBarProps) {
  if (!visible) {
    return null
  }

  return (
    <div
      className="absolute left-0 right-0 h-1 bg-hover overflow-hidden z-20 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label="Loading preview"
    >
      <div className="h-full bg-inverse preview-loading-bar" />
    </div>
  )
}
