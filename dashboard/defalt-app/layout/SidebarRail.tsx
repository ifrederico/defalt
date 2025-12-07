import { useState, useCallback, memo, useEffect, useMemo } from 'react'
import { PanelsTopLeft, Settings, CircleUserRound, MessageCircleQuestion, CloudCog, CloudCheck, X, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { FloatingTooltip } from '@defalt/ui'
import { SettingsModal } from '../components/SettingsModal'
import { GhostConnectionSettings } from '../components/GhostConnectionSettings'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { useActiveTab, useUIActions } from '../stores'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return date.toLocaleDateString()
}

const GHOST_CONNECTION_KEY = 'defalt:ghost-connection'

function hasGhostCredentials(): boolean {
  try {
    const stored = localStorage.getItem(GHOST_CONNECTION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as { url?: string; contentKey?: string }
      return Boolean(parsed.url && parsed.contentKey)
    }
  } catch {
    // Ignore parse errors
  }
  return false
}

export function SidebarRail() {
  const activeTab = useActiveTab()
  const { setActiveTab } = useUIActions()
  const { lastGhostFetch, refreshGhostData, ghostDataLoading, dataSource } = useWorkspaceContext()
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false)
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false)
  const [isGhostConnected, setIsGhostConnected] = useState(false)
  const [tick, setTick] = useState(0)

  // Check Ghost connection status on mount and when modal closes
  useEffect(() => {
    setIsGhostConnected(hasGhostCredentials())
  }, [isPreviewModalOpen])

  // Update relative time display every 30 seconds
  useEffect(() => {
    if (!lastGhostFetch) return
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [lastGhostFetch])

  const lastFetchLabel = useMemo(() => {
    if (!lastGhostFetch) return null
    void tick
    return formatRelativeTime(lastGhostFetch)
  }, [lastGhostFetch, tick])

  const isConnected = dataSource === 'ghost' && lastGhostFetch !== null

  const handleSupport = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('mailto:support@defalt.org?subject=Get%20help', '_blank')
    }
  }, [])

  const handleSectionsClick = useCallback(() => setActiveTab('sections'), [setActiveTab])
  const handleSettingsClick = useCallback(() => setActiveTab('settings'), [setActiveTab])
  const handleUserClick = useCallback(() => setSettingsModalOpen(true), [])

  return (
    <>
    <div className="w-[52px] bg-surface border-r border-border flex flex-col justify-between py-4 shrink-0">
      <div className="flex flex-col items-center gap-1">
        <IconButton
          icon={PanelsTopLeft}
          label="Sections"
          active={activeTab === 'sections'}
          onClick={handleSectionsClick}
        />
        <IconButton
          icon={Settings}
          label="Theme Settings"
          active={activeTab === 'settings'}
          onClick={handleSettingsClick}
        />

        <Dialog.Root open={isPreviewModalOpen} onOpenChange={setPreviewModalOpen}>
          <FloatingTooltip content={isGhostConnected ? 'Preview connected' : 'Preview connection'}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors focus:outline-none ${
                  isPreviewModalOpen ? 'bg-subtle' : 'bg-surface hover:bg-subtle'
                } ${
                  isGhostConnected ? 'text-success' : 'text-foreground'
                }`}
                aria-label="Preview connection"
              >
                {isGhostConnected ? (
                  <CloudCheck size={18} strokeWidth={1.5} />
                ) : (
                  <CloudCog size={18} strokeWidth={1.5} />
                )}
              </button>
            </Dialog.Trigger>
          </FloatingTooltip>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-[2px] data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
            <Dialog.Content className="fixed left-1/2 top-[10%] z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-surface shadow-xl focus:outline-none data-[state=open]:animate-contentShow">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    Preview Connection
                  </Dialog.Title>
                  {isConnected && (
                    <span className="text-xs text-secondary">
                      {lastFetchLabel}
                    </span>
                  )}
                </div>
                <Dialog.Description className="sr-only">
                  Configure Ghost Content API connection for preview
                </Dialog.Description>
                <div className="flex items-center gap-1">
                  {isConnected && (
                    <button
                      type="button"
                      onClick={refreshGhostData}
                      disabled={ghostDataLoading}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-secondary hover:text-foreground hover:bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Refresh Ghost content"
                      title="Refresh content"
                    >
                      <RefreshCw
                        size={16}
                        strokeWidth={2}
                        className={ghostDataLoading ? 'animate-spin' : ''}
                      />
                    </button>
                  )}
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
              </div>
              <div className="p-6">
                <GhostConnectionSettings />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Divider */}
        <div className="w-6 h-px bg-hover my-2"></div>

        <IconButton
          icon={MessageCircleQuestion}
          label="Get help"
          onClick={handleSupport}
        />

        <IconButton
          icon={CircleUserRound}
          label="Account"
          onClick={handleUserClick}
        />
      </div>

    </div>

    <SettingsModal open={isSettingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </>
  )
}

type IconButtonProps = {
  icon: LucideIcon
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  href?: string
}

const IconButton = memo(function IconButton({ icon: Icon, label, active = false, disabled = false, onClick, href }: IconButtonProps) {
  const colorClasses = disabled
    ? 'bg-surface text-placeholder cursor-not-allowed'
    : active
      ? 'bg-subtle text-foreground'
      : 'bg-surface text-foreground hover:bg-subtle'

  const contentClasses = `w-10 h-10 rounded-md flex items-center justify-center transition-colors focus:outline-none ${colorClasses}`

  const iconElement = <Icon size={18} strokeWidth={1.5} />

  if (disabled) {
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={contentClasses}
        aria-label={label}
        title={label}
      >
        {iconElement}
      </a>
    ) : (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={contentClasses}
        aria-label={label}
        title={label}
        aria-disabled={disabled}
      >
        {iconElement}
      </button>
    )
  }

  return (
    <FloatingTooltip content={label}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={contentClasses}
          aria-label={label}
        >
          {iconElement}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={contentClasses}
          aria-label={label}
        >
          {iconElement}
        </button>
      )}
    </FloatingTooltip>
  )
})
