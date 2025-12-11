/**
 * Subscription Context
 *
 * Provides subscription tier and feature access state throughout the app
 */

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import {
  canAccessSection as checkSectionAccess,
  isPlusTier,
  type SubscriptionTier,
  type SubscriptionStatus
} from '@defalt/utils/types/subscription'
import { SubscriptionContext } from './SubscriptionContext.shared'
import { logError } from '@defalt/utils/logging/errorLogger'
import { useMember } from './MemberContext'
import { isLifetimeMember } from '../lib/ghost'

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { member, isPaid } = useMember()
  const [tier, setTier] = useState<SubscriptionTier | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionCancelAtPeriodEnd, setSubscriptionCancelAtPeriodEnd] = useState(false)
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSubscription = useCallback(async () => {
    if (!member) {
      setTier(null)
      setSubscriptionStatus(null)
      setSubscriptionCancelAtPeriodEnd(false)
      setSubscriptionPeriodEnd(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Check for lifetime label first, then paid status
      let resolvedTier: SubscriptionTier = 'free'
      if (isLifetimeMember(member)) {
        resolvedTier = 'plus_lifetime'
      } else if (isPaid) {
        resolvedTier = 'plus_monthly'
      }
      setTier(resolvedTier)
      setSubscriptionStatus(isPaid ? 'active' : null)
      setSubscriptionCancelAtPeriodEnd(false)
      setSubscriptionPeriodEnd(null)
    } catch (error) {
      logError(error, { scope: 'SubscriptionContext.fetchSubscription' })
      // Default to free on error
      setTier('free')
      setSubscriptionStatus(null)
      setSubscriptionCancelAtPeriodEnd(false)
      setSubscriptionPeriodEnd(null)
    } finally {
      setLoading(false)
    }
  }, [member, isPaid])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const hasFeature = useCallback(
    (feature: string) => {
      void feature
      if (!tier) return false
      return isPlusTier(tier)
    },
    [tier]
  )

  const canAccessSection = useCallback(
    (sectionId: string) => {
      // Default to free tier if tier not loaded yet
      return checkSectionAccess(sectionId, tier || 'free')
    },
    [tier]
  )

  const requiresUpgrade = useCallback(
    (sectionId: string) => {
      // Default to free tier if tier not loaded yet
      return !checkSectionAccess(sectionId, tier || 'free')
    },
    [tier]
  )

  const refreshSubscription = useCallback(async () => {
    await fetchSubscription()
  }, [fetchSubscription])

  const contextValue = useMemo(
    () => ({
      tier,
      subscriptionStatus,
      subscriptionCancelAtPeriodEnd,
      subscriptionPeriodEnd,
      loading,
      hasFeature,
      canAccessSection,
      requiresUpgrade,
      refreshSubscription
    }),
    [
      tier,
      subscriptionStatus,
      subscriptionCancelAtPeriodEnd,
      subscriptionPeriodEnd,
      loading,
      hasFeature,
      canAccessSection,
      requiresUpgrade,
      refreshSubscription
    ]
  )

  return <SubscriptionContext.Provider value={contextValue}>{children}</SubscriptionContext.Provider>
}
