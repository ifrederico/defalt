import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCcw, AlertTriangle } from 'lucide-react'
import { useToast } from './ToastContext'
import { logError } from '@defalt/utils/logging/errorLogger'

type FallbackRenderArgs = {
  error: Error
  reset: () => void
}

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  fallbackRender?: (args: FallbackRenderArgs) => ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: ReadonlyArray<unknown>
}

type ErrorBoundaryState = {
  error: Error | null
}

const arrayChanged = (a: ReadonlyArray<unknown> = [], b: ReadonlyArray<unknown> = []) => {
  if (a.length !== b.length) {
    return true
  }
  for (let i = 0; i < a.length; i += 1) {
    if (Object.is(a[i], b[i])) {
      continue
    }
    return true
  }
  return false
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && this.props.resetKeys && prevProps.resetKeys) {
      if (arrayChanged(this.props.resetKeys, prevProps.resetKeys)) {
        this.reset()
      }
    }
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({ error: this.state.error, reset: this.reset })
      }
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

type FullScreenErrorProps = {
  title: string
  description: string
  onRetry?: () => void
  retryLabel?: string
  secondaryAction?: { label: string, onClick: () => void }
}

function FullScreenError({ title, description, onRetry, retryLabel = 'Try again', secondaryAction }: FullScreenErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-subtle px-6 py-12">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-warning">
          <AlertTriangle size={24} strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-foreground">{title}</p>
          <p className="text-md text-secondary leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-inverse px-5 py-2 text-white transition hover:bg-inverse-subtle"
            >
              <RefreshCcw size={16} />
              {retryLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-md border border-border-strong px-5 py-2 text-secondary transition hover:bg-subtle"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type PreviewFallbackProps = {
  title: string
  description: string
  onRetry: () => void
}

function PreviewFallback({ title, description, onRetry }: PreviewFallbackProps) {
  return (
    <div className="flex h-full min-h-[480px] w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border-strong bg-subtle text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-warning">
        <AlertTriangle size={24} strokeWidth={2} />
      </div>
      <div className="space-y-1 px-6">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-secondary">{description}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-inverse px-4 py-2 text-sm font-medium text-white transition hover:bg-inverse-subtle"
      >
        <RefreshCcw size={16} />
        Retry preview
      </button>
    </div>
  )
}

export function RootAppErrorBoundary({ children }: { children: ReactNode }) {
  const reload = () => window.location.reload()
  return (
    <ErrorBoundary
      onError={(error) => {
        logError(error, { scope: 'RootAppErrorBoundary' })
      }}
      fallbackRender={({ reset }) => (
        <FullScreenError
          title="Something went wrong"
          description="The editor failed to load. Please try again or reload the page."
          onRetry={reset}
          secondaryAction={{ label: 'Reload page', onClick: reload }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  return (
    <ErrorBoundary
      onError={(error) => {
        logError(error, { scope: 'DashboardErrorBoundary' })
        showToast('Editor crashed', 'Something went wrong in the dashboard. Try again or reload.', 'error')
      }}
      fallbackRender={({ reset }) => (
        <FullScreenError
          title="Dashboard crashed"
          description="An unexpected error occurred. Trying again usually fixes it."
          onRetry={reset}
          secondaryAction={{ label: 'Reload page', onClick: () => window.location.reload() }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

type PreviewErrorBoundaryProps = {
  children: ReactNode
  resetKeys?: ReadonlyArray<unknown>
  onPreviewError?: (error: Error) => void
  onPreviewReset?: () => void
}

export function PreviewErrorBoundary({ children, resetKeys, onPreviewError, onPreviewReset }: PreviewErrorBoundaryProps) {
  const { showToast } = useToast()
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onError={(error) => {
        logError(error, { scope: 'PreviewErrorBoundary' })
        showToast('Preview error', 'We hit an error rendering the preview. Retrying…', 'error')
        onPreviewError?.(error)
      }}
      onReset={onPreviewReset}
      fallbackRender={({ reset }) => (
        <PreviewFallback
          title="Preview failed"
          description="We could not render the preview. Retry to rebuild it."
          onRetry={reset}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
