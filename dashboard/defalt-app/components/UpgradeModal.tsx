/**
 * UpgradeModal Component
 *
 * Modal displaying pricing options for upgrading to Plus tier
 */

import { X } from 'lucide-react'
import { useState } from 'react'
import { useStripeActions } from '../hooks/useStripeActions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './ToastContext'
import { AppButton } from '@defalt/ui/primitives/AppButton'
import { trackEvent } from '@defalt/utils/analytics/umami'

type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
  sectionName?: string
}

export function UpgradeModal({ isOpen, onClose, sectionName }: UpgradeModalProps) {
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'lifetime' | null>(null)
  const { startCheckout } = useStripeActions()
  const { user } = useAuth()
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleUpgrade = async (plan: 'monthly' | 'lifetime') => {
    if (!user) {
      showToast('Please sign in to upgrade.', undefined, 'error')
      return
    }
    setPendingPlan(plan)
    trackEvent('upgrade-clicked', { plan })
    try {
      await startCheckout()
    } catch {
      showToast('Failed to start checkout. Please try again.', undefined, 'error')
      setPendingPlan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl bg-surface rounded-md shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-placeholder hover:text-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Upgrade to Plus
            </h2>
            {sectionName && (
              <p className="text-secondary">
                Unlock {sectionName} and all premium sections
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Monthly Plan */}
            <div className="border-2 border-border rounded-md p-6 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Plus Monthly
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$9</span>
                  <span className="text-secondary">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All premium sections
                </li>
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cloud storage
                </li>
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cancel anytime
                </li>
              </ul>

              <AppButton
                variant="dark"
                className="w-full mt-auto"
                onClick={() => handleUpgrade('monthly')}
                disabled={pendingPlan !== null}
              >
                {pendingPlan === 'monthly' ? 'Loading…' : 'Get Plus'}
              </AppButton>
            </div>

            {/* Lifetime Plan */}
            <div className="border-2 border-border rounded-md p-6 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Plus Lifetime
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$69</span>
                  <span className="text-secondary">one-time</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All premium sections
                </li>
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cloud storage
                </li>
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <strong>Lifetime access</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-secondary">
                  <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Early access to new features
                </li>
              </ul>

              <AppButton
                variant="dark"
                className="w-full mt-auto"
                onClick={() => handleUpgrade('lifetime')}
                disabled={pendingPlan !== null}
              >
                {pendingPlan === 'lifetime' ? 'Loading…' : 'Get Lifetime'}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
