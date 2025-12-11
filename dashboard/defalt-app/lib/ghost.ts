import GhostContentAPI from '@tryghost/content-api'
import { apiPath } from '@defalt/utils/api/apiPath'

const ghostUrl = import.meta.env.VITE_GHOST_URL
const ghostContentKey = import.meta.env.VITE_GHOST_CONTENT_KEY

const ghostApi = ghostUrl && ghostContentKey
  ? new GhostContentAPI({
      url: ghostUrl,
      key: ghostContentKey,
      version: 'v5.0'
    })
  : null

export interface GhostSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  tier: {
    id: string
    name: string
    slug: string
  }
  plan?: {
    nickname: string
    amount: number
    interval: string
  }
  current_period_end: string
  cancel_at_period_end: boolean
}

export interface GhostLabel {
  id: string
  name: string
  slug: string
}

export interface GhostMember {
  uuid: string
  email: string
  name: string | null
  firstname: string | null
  avatar_image: string | null
  subscribed: boolean
  paid: boolean
  subscriptions: GhostSubscription[]
  labels?: GhostLabel[]
}

/**
 * Check if member has a complimentary (lifetime) subscription.
 * Complimentary subscriptions have plan.nickname === 'Complimentary' or plan.amount === 0
 */
export function isLifetimeMember(member: GhostMember | null): boolean {
  if (!member?.subscriptions?.length) return false
  return member.subscriptions.some(
    (sub) =>
      (sub.status === 'active' || sub.status === 'trialing') &&
      (sub.plan?.nickname === 'Complimentary' || sub.plan?.amount === 0)
  )
}

/**
 * Get current member from Ghost using the identity cookie.
 * Uses /api/member proxy to handle cross-domain cookie forwarding.
 */
export async function getCurrentMember(): Promise<GhostMember | null> {
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
    return {
      uuid: 'dev-member',
      email: 'dev@example.com',
      name: 'Dev User',
      firstname: 'Dev',
      avatar_image: null,
      subscribed: true,
      paid: false,
      subscriptions: [],
      labels: []
    }
  }
  try {
    // Use proxy endpoint which forwards cookies to Ghost
    const response = await fetch(apiPath('/api/member'), {
      credentials: 'include'
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get Ghost member:', error)
    return null
  }
}

/**
 * Check if member has an active paid subscription.
 */
export function hasActiveSubscription(member: GhostMember | null): boolean {
  if (!member) return false
  if (!member.paid) return false

  return member.subscriptions.some((sub) => sub.status === 'active' || sub.status === 'trialing')
}

/**
 * Get member's subscription tier.
 */
export function getMemberTier(member: GhostMember | null): string | null {
  if (!member || !member.subscriptions.length) return null

  const activeSub = member.subscriptions.find(
    (sub) => sub.status === 'active' || sub.status === 'trialing'
  )

  return activeSub?.tier?.slug ?? null
}

export function redirectToLogin(): void {
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') return
  if (!ghostUrl) {
    return
  }
  window.location.href = `${ghostUrl}/#/portal/signin`
}

export function redirectToSignup(): void {
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') return
  if (!ghostUrl) {
    return
  }
  window.location.href = `${ghostUrl}/#/portal/signup`
}

export function redirectToAccount(): void {
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') return
  if (!ghostUrl) {
    return
  }
  window.location.href = `${ghostUrl}/#/portal/account`
}

/**
 * Sign out from Ghost by calling the Members API.
 * This clears the session cookie without redirecting to the portal.
 */
export async function signOut(): Promise<void> {
  if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
    window.location.reload()
    return
  }
  if (!ghostUrl) {
    return
  }

  try {
    // Call Ghost Members API to sign out (clears session cookie)
    await fetch(`${ghostUrl}/members/api/session`, {
      method: 'DELETE',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Failed to sign out:', error)
  }

  // Redirect to Ghost homepage after sign out
  window.location.href = ghostUrl
}

export default ghostApi
