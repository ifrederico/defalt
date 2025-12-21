import * as React from 'react'
import { cn } from '../utils/cn'

interface ViewHeaderActionsProps extends React.HTMLAttributes<HTMLElement> {}

const ViewHeaderActions: React.FC<ViewHeaderActionsProps> = ({ children }) => (
  <div className="flex items-center gap-2">
    {children}
  </div>
)

interface ViewHeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ className, children }) => {
  const [headerComponent, actionsComponent] = React.Children.toArray(children)

  return (
    <header className="sticky top-0 z-40 -mx-8 bg-surface backdrop-blur-md">
      <div
        className={cn(
          'relative flex min-h-[102px] items-center justify-between gap-5 p-8 border-b border-border',
          className
        )}
      >
        {headerComponent}
        {actionsComponent}
      </div>
    </header>
  )
}

export { ViewHeader, ViewHeaderActions }
