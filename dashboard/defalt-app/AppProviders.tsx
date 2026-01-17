import { type ReactNode, useEffect } from 'react'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { useThemeStore } from './stores/themeStore'

export function AppProviders({ children }: { children: ReactNode }) {
    const initialize = useThemeStore((s) => s.initialize)

    useEffect(() => {
        void initialize()
    }, [initialize])

    return (
        <WorkspaceProvider>
            {children}
        </WorkspaceProvider>
    )
}
