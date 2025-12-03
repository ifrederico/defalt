/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app
 */

import { useMemo, type ReactNode } from 'react'
import { AuthContext, type AuthStatus, type AuthUser } from './AuthContext.shared'
import { useMember } from '../../src/context/MemberContext'

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

  const refreshCsrfToken = async () => null

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
