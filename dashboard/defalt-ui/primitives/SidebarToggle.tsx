import type { MouseEventHandler } from 'react'
import { cn } from '../utils/cn'

export type SidebarToggleProps = {
  position: 'left' | 'right'
  collapsed: boolean
  onToggle: MouseEventHandler<HTMLButtonElement>
  className?: string
  ariaLabel?: string
}

export function SidebarToggle({
  position,
  collapsed,
  onToggle,
  className,
  ariaLabel,
}: SidebarToggleProps) {
  const label = ariaLabel ?? (collapsed
    ? position === 'left'
      ? 'Expand sidebar'
      : 'Expand panel'
    : position === 'left'
    ? 'Collapse sidebar'
      : 'Collapse panel')

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (event.detail === 0) {
      onToggle(event)
      return
    }

    const target = event.target as HTMLElement | null
    if (target?.closest('.df-sidebar-toggle__inner')) {
      onToggle(event)
      return
    }

    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'df-sidebar-toggle',
        position === 'left' ? 'df-sidebar-toggle--left' : 'df-sidebar-toggle--right',
        className
      )}
      data-position={position}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label={label}
      title={label}
    >
      <span className="df-sidebar-toggle__inner">
        <span className="df-sidebar-toggle__segment df-sidebar-toggle__segment--top" />
        <span className="df-sidebar-toggle__segment df-sidebar-toggle__segment--bottom" />
      </span>
    </button>
  )
}
