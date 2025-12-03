/**
 * Subscription and membership tier types
 * Matches database schema in 004_user_subscriptions.sql
 */

import { isPremium } from '../../defalt-sections/premiumConfig.js'

export type SubscriptionTier = 'free' | 'plus_monthly' | 'plus_lifetime'

export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'past_due'

export interface UserProfile {
  id: string
  active_project_id: string | null
  tier: SubscriptionTier
  stripe_customer_id: string | null
  is_admin: boolean
  ghost_api_url: string | null
  ghost_content_key: string | null
  ghost_integration_name: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_price_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

/**
 * Check if a section requires premium access
 * Uses single source of truth from defalt-sections/premiumConfig.ts
 */
export function isPremiumSection(sectionId: string): boolean {
  return isPremium(sectionId)
}

/**
 * Check if a tier can access a section
 */
export function canAccessSection(sectionId: string, tier: SubscriptionTier): boolean {
  if (!isPremiumSection(sectionId)) {
    return true
  }
  return tier === 'plus_monthly' || tier === 'plus_lifetime'
}

/**
 * Check if a tier has any premium features
 */
export function isPlusTier(tier: SubscriptionTier): boolean {
  return tier === 'plus_monthly' || tier === 'plus_lifetime'
}
