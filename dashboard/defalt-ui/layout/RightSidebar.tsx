import * as React from 'react'
import { cn } from '../utils/cn'

interface RightSidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

const RightSidebarMenu = React.forwardRef<HTMLDivElement, RightSidebarMenuProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-px', className)} {...props} />
))
RightSidebarMenu.displayName = 'RightSidebarMenu'

interface RightSidebarMenuLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

const RightSidebarMenuLink = React.forwardRef<HTMLButtonElement, RightSidebarMenuLinkProps>(
  ({ active = false, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex h-9 w-full items-center justify-start gap-2 rounded-md px-3 text-sm font-medium text-secondary hover:bg-subtle',
        active && 'bg-subtle text-foreground font-semibold',
        className
      )}
      {...props}
    />
  )
)
RightSidebarMenuLink.displayName = 'RightSidebarMenuLink'

export { RightSidebarMenu, RightSidebarMenuLink }
