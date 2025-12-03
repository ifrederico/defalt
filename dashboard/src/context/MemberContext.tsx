/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useGhostMember } from '../hooks/useGhostMember.ts'
import type { GhostMember } from '../lib/ghost.ts'

interface MemberContextType {
  member: GhostMember | null
  isLoading: boolean
  isAuthenticated: boolean
  isPaid: boolean
  tier: string | null
  error: Error | null
  login: () => void
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const MemberContext = createContext<MemberContextType | null>(null)

export function MemberProvider({ children }: { children: ReactNode }) {
  const memberData = useGhostMember()

  return (
    <MemberContext.Provider value={memberData}>
      {children}
    </MemberContext.Provider>
  )
}

export function useMember(): MemberContextType {
  const context = useContext(MemberContext)
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider')
  }
  return context
}
