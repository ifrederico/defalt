import { useEffect, useState, lazy, Suspense } from 'react'
import { LoadingState } from '@defalt/ui/primitives/LoadingState'
const DashboardApp = lazy(() => import('./App'))
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ToastProvider } from './components/Toast'
import { DashboardErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './hooks/useAuth'
import { HistoryProvider } from './contexts/HistoryContext'
import { AppButton } from '@defalt/ui/primitives/AppButton'

const BASE_PATH = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/')

function stripBase(pathname: string): string {
  if (BASE_PATH !== '/' && pathname.startsWith(BASE_PATH.slice(0, -1))) {
    const stripped = pathname.slice(BASE_PATH.length - 1)
    return stripped || '/'
  }
  return pathname || '/'
}

function resolveRoute(pathname: string): '/' | '/dashboard' {
  if (pathname.startsWith('/dashboard')) {
    return '/dashboard'
  }
  return '/'
}

function RouterView() {
  const [, setRoute] = useState(() => resolveRoute(stripBase(window.location.pathname)))
  const { status, signIn } = useAuth()

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveRoute(stripBase(window.location.pathname)))
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Skip auth in dev mode when VITE_DEV_BYPASS_AUTH is set
  const bypassAuth = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

  if (!bypassAuth && status === 'initializing') {
    return <BootstrapScreen />
  }

  // Show landing page for unauthenticated users
  if (!bypassAuth && status === 'unauthenticated') {
    return <LandingScreen onSignIn={signIn} />
  }

  // Show the dashboard/editor
  return (
    <HistoryProvider>
      <DashboardErrorBoundary>
        <DashboardApp onSignIn={signIn} />
      </DashboardErrorBoundary>
    </HistoryProvider>
  )
}

export default function RootApp() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Suspense fallback={<BootstrapScreen />}>
            <RouterView />
          </Suspense>
        </SubscriptionProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

function BootstrapScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <LoadingState />
    </div>
  )
}

function LandingScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Defalt Theme Editor</h1>
        <p className="text-secondary">Sign in to customize your Ghost theme</p>
      </div>
      <AppButton variant="dark" onClick={onSignIn}>
        Sign in
      </AppButton>
    </div>
  )
}
