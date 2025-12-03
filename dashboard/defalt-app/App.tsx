import { useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { trackEvent } from '@defalt/utils/analytics/umami'
import { AppProviders } from './AppProviders'
import { AppContent } from './AppContent'
import { LoadingState } from '@defalt/ui/primitives/LoadingState'

type AppProps = {
  onSignIn?: () => void
}

function App({ onSignIn }: AppProps) {
  const { user, loading } = useAuth()
  const bypassAuth = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'
  const hasTrackedLoad = useRef(false)

  useEffect(() => {
    if (!bypassAuth && !loading && !user) {
      onSignIn?.()
    }
  }, [bypassAuth, user, loading, onSignIn])

  useEffect(() => {
    const isReady = bypassAuth || (!loading && user)
    if (isReady && !hasTrackedLoad.current) {
      hasTrackedLoad.current = true
      trackEvent('editor-loaded')
    }
  }, [bypassAuth, loading, user])

  if (!bypassAuth && loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!bypassAuth && !user) {
    return null
  }

  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}

export default App
