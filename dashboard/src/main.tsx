import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '../defalt-app/index.css'
import RootApp from '../defalt-app/RootApp.tsx'
import { RootAppErrorBoundary } from '../defalt-app/components/ErrorBoundary.tsx'
import { MemberProvider } from '../defalt-app/contexts/MemberContext.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}
createRoot(rootElement).render(
  <StrictMode>
    <MemberProvider>
      <RootAppErrorBoundary>
        <RootApp />
      </RootAppErrorBoundary>
    </MemberProvider>
  </StrictMode>,
)
