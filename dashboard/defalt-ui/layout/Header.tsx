import * as React from 'react'
import { cn } from '../utils/cn'
import { H1 } from './Heading'

type PropsWithClassName = React.PropsWithChildren & { className?: string }

function HeaderAbove({ className, children }: PropsWithClassName) {
  return (
    <div className={cn('flex items-center gap-2 [grid-area:above]', className)} data-header="header-above">
      {children}
    </div>
  )
}

function HeaderTitle({ className, children }: PropsWithClassName) {
  return (
    <H1 className={cn('text-2xl leading-[1.2em] lg:text-3xl [grid-area:title]', className)} data-header="header-title">
      {children}
    </H1>
  )
}

function HeaderMeta({ className, children }: PropsWithClassName) {
  return (
    <div className={cn('flex items-center justify-start text-secondary [grid-area:meta] pb-4 pt-1', className)} data-header="header-meta">
      {children}
    </div>
  )
}

function HeaderActionGroup({ className, children }: PropsWithClassName) {
  return (
    <div className={cn('flex items-center gap-2', className)} data-header="header-action-group">
      {children}
    </div>
  )
}

function HeaderActions({ className, children }: PropsWithClassName) {
  return (
    <div className={cn('flex items-center gap-4 [grid-area:actions] sm:justify-self-end self-start', className)} data-header="header-actions">
      {children}
    </div>
  )
}

function HeaderNav({ className, children }: PropsWithClassName) {
  return (
    <div className={cn('flex items-center gap-2 [grid-area:nav] self-start mt-2 lg:mt-0.5', className)} data-header="header-nav">
      {children}
    </div>
  )
}

type HeaderVariant = 'default' | 'inline-nav'

interface HeaderProps extends PropsWithClassName {
  variant?: HeaderVariant
}

function Header({ className, children, variant = 'default' }: HeaderProps) {
  const baseClasses = `sticky top-0 z-40 -mb-4 grid gap-x-4 bg-surface backdrop-blur-md p-4 [grid-template-areas:'above''title''meta''actions''nav'] sm:[grid-template-areas:'above_above''title_actions''meta_actions''nav_nav'] lg:-mb-8 lg:p-8`
  const variantClasses =
    variant === 'inline-nav'
      ? `lg:[grid-template-areas:'above_above_above''title_nav_actions''meta_nav_actions'] lg:[grid-template-columns:1fr_auto_auto]`
      : `lg:[grid-template-areas:'above_above''title_actions''meta_actions''nav_nav']`

  return (
    <header className={cn(baseClasses, variantClasses, className)} data-header="header">
      {children}
    </header>
  )
}

Header.Above = HeaderAbove
Header.Title = HeaderTitle
Header.Actions = HeaderActions
Header.ActionGroup = HeaderActionGroup
Header.Nav = HeaderNav
Header.Meta = HeaderMeta

export { Header, HeaderActions, HeaderTitle, HeaderNav, HeaderMeta }
