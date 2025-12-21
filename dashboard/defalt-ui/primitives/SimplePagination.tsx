import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '../utils/cn'
import { AppButton, type AppButtonProps } from './AppButton'

const SimplePagination = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-between gap-4 pb-6 text-sm', className)} {...props} />
  )
)
SimplePagination.displayName = 'SimplePagination'

interface SimplePaginationPagesProps extends React.HTMLAttributes<HTMLSpanElement> {
  currentPage?: string
  totalPages?: string
}

const SimplePaginationPages = React.forwardRef<HTMLSpanElement, SimplePaginationPagesProps>(
  ({ className, currentPage, totalPages, ...props }, ref) => (
    <span ref={ref} className={cn('text-secondary', className)} {...props}>
      Pages {currentPage} of {totalPages}
    </span>
  )
)
SimplePaginationPages.displayName = 'SimplePaginationPages'

const SimplePaginationNavigation = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-1.5', className)} {...props} />
  )
)
SimplePaginationNavigation.displayName = 'SimplePaginationNavigation'

type SimplePaginationButtonProps = Omit<AppButtonProps, 'variant'> & {
  variant?: AppButtonProps['variant']
}

const SimplePaginationPreviousButton = React.forwardRef<HTMLButtonElement, SimplePaginationButtonProps>(
  ({ variant = 'secondary', className, ...props }, ref) => (
    <AppButton
      ref={ref}
      variant={variant}
      className={cn('h-7 w-7 p-0', className)}
      {...props}
    >
      <ArrowLeft size={14} strokeWidth={2} />
    </AppButton>
  )
)
SimplePaginationPreviousButton.displayName = 'SimplePaginationPreviousButton'

const SimplePaginationNextButton = React.forwardRef<HTMLButtonElement, SimplePaginationButtonProps>(
  ({ variant = 'secondary', className, ...props }, ref) => (
    <AppButton
      ref={ref}
      variant={variant}
      className={cn('h-7 w-7 p-0', className)}
      {...props}
    >
      <ArrowRight size={14} strokeWidth={2} />
    </AppButton>
  )
)
SimplePaginationNextButton.displayName = 'SimplePaginationNextButton'

export {
  SimplePagination,
  SimplePaginationPages,
  SimplePaginationNavigation,
  SimplePaginationPreviousButton,
  SimplePaginationNextButton
}
