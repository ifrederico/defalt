import { useCallback } from 'react'

export function useStripeActions() {
  const startCheckout = useCallback(async () => {
    const portalUrl = import.meta.env.VITE_GHOST_URL
    if (portalUrl) {
      window.location.href = `${portalUrl}/#/portal/signup`
    }
  }, [])

  return {
    startCheckout
  }
}
