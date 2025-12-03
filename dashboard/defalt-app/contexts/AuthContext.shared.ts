import { createContext } from 'react'
export type AuthStatus = 'initializing' | 'guest' | 'authenticated' | 'unauthenticated' | 'error'

export type AuthUser = {
  id: string
  email: string | null
  name?: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  status: AuthStatus
  csrfToken: string | null
  csrfTokenIssuedAt: number | null
  refreshCsrfToken: () => Promise<string | null>
  signOut: () => Promise<void>
  signIn: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
