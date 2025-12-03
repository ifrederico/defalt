import { useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Crown, ExternalLink } from 'lucide-react'
import { AppButton } from '@defalt/ui/primitives/AppButton'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'

type SettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, signOut } = useAuth()
  const { tier } = useSubscription()

  const portalUrl = import.meta.env.VITE_GHOST_URL
  const resolvedTier = tier ?? 'free'
  const isPremium = resolvedTier === 'plus_monthly' || resolvedTier === 'plus_lifetime'

  const tierLabel = useMemo(() => {
    if (resolvedTier === 'plus_monthly') return 'Plus (Monthly)'
    if (resolvedTier === 'plus_lifetime') return 'Plus (Lifetime)'
    return 'Free'
  }, [resolvedTier])

  const handleSignOut = () => {
    onOpenChange(false)
    void signOut()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-[2px] data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
        <Dialog.Content className="fixed left-1/2 top-[10%] z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-surface shadow-xl focus:outline-none data-[state=open]:animate-contentShow">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Settings
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Account settings
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-md flex items-center justify-center text-secondary hover:bg-subtle transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Email</p>
                  <p className="font-medium text-foreground">{user?.email ?? 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Plan</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{tierLabel}</p>
                    {isPremium && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                        <Crown size={11} strokeWidth={0} fill="currentColor" className="text-amber-600" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm text-secondary">
                Manage billing and subscription in Ghost Portal
              </p>
              <div className="flex gap-3">
                <AppButton
                  variant="dark"
                  onClick={() => {
                    if (portalUrl) {
                      window.open(`${portalUrl}/#/portal/account`, '_blank')
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    Open Portal
                    <ExternalLink size={14} />
                  </span>
                </AppButton>
                <AppButton
                  variant="secondary"
                  onClick={() => {
                    if (portalUrl) {
                      window.open(`${portalUrl}/pricing/`, '_blank')
                    }
                  }}
                >
                  Upgrade
                </AppButton>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <AppButton variant="secondary" onClick={handleSignOut}>
                Sign out
              </AppButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
