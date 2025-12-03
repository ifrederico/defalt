import { createContext } from 'react'
import type { SubscriptionTier, SubscriptionStatus } from '@defalt/utils/types/subscription'

export interface SubscriptionContextType {
  tier: SubscriptionTier | null
  subscriptionStatus: SubscriptionStatus | null
  subscriptionCancelAtPeriodEnd: boolean
  subscriptionPeriodEnd: string | null
  loading: boolean
  hasFeature: (feature: string) => boolean
  canAccessSection: (sectionId: string) => boolean
  requiresUpgrade: (sectionId: string) => boolean
  refreshSubscription: () => Promise<void>
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)
