/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app
 */

import { useMemo, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthStatus, type AuthUser } from './AuthContext.shared'
import { useMember } from '../../src/context/MemberContext'
import { apiPath } from '@defalt/utils/api/apiPath'
import { logError } from '@defalt/utils/logging/errorLogger'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { member, isLoading, isAuthenticated, login, logout } = useMember()

  const user: AuthUser | null = member
    ? {
        id: member.uuid,
        email: member.email ?? null,
        name: member.name ?? null
      }
    : null

  const status: AuthStatus = isLoading
    ? 'initializing'
    : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated'

  const refreshCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(apiPath('/api/auth/csrf'), {
        method: 'GET',
        credentials: 'include'
      })
      if (!response.ok) {
        logError(new Error(`CSRF request failed: ${response.status}`), { scope: 'AuthContext.refreshCsrfToken' })
        return null
      }
      const data = await response.json()
      return data.token ?? null
    } catch (error) {
      logError(error, { scope: 'AuthContext.refreshCsrfToken' })
      return null
    }
  }, [])

  const handleSignOut = async () => {
    logout()
  }

  const contextValue = useMemo(
    () => ({
      user,
      loading: isLoading,
      status,
      csrfToken: null,
      csrfTokenIssuedAt: null,
      refreshCsrfToken,
      signOut: handleSignOut,
      signIn: login
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSignOut uses logout
    [user, isLoading, status, login, logout]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
