import * as React from 'react'
import { cn } from '../utils/cn'

export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {}

const Page = React.forwardRef<HTMLDivElement, PageProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mx-auto w-full max-w-[1280px] min-h-full px-8 flex flex-col', className)}
    {...props}
  />
))

Page.displayName = 'Page'

export { Page }
