import { useCallback, useEffect, useState } from 'react'
import {
  getCurrentMember,
  getMemberTier,
  hasActiveSubscription,
  redirectToLogin,
  signOut as ghostSignOut,
  type GhostMember
} from '../lib/ghost.ts'

interface UseGhostMemberReturn {
  member: GhostMember | null
  isLoading: boolean
  isAuthenticated: boolean
  isPaid: boolean
  tier: string | null
  error: Error | null
  refetch: () => Promise<void>
  login: () => void
  logout: () => Promise<void>
}

export function useGhostMember(): UseGhostMemberReturn {
  const [member, setMember] = useState<GhostMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMember = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getCurrentMember()
      setMember(data)
    } catch (err) {
      const resolvedError = err instanceof Error ? err : new Error('Failed to fetch member')
      setError(resolvedError)
      setMember(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMember()
  }, [fetchMember])

  const login = useCallback(() => {
    redirectToLogin()
  }, [])

  const logout = useCallback(async () => {
    setMember(null)
    await ghostSignOut()
  }, [])

  return {
    member,
    isLoading,
    isAuthenticated: Boolean(member),
    isPaid: hasActiveSubscription(member),
    tier: getMemberTier(member),
    error,
    refetch: fetchMember,
    login,
    logout
  }
}
