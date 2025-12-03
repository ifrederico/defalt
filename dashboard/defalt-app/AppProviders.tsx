import { type ReactNode } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <WorkspaceProvider>
                {children}
            </WorkspaceProvider>
        </ThemeProvider>
    )
}
