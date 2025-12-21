import * as React from 'react'
import { cn } from '../utils/cn'

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr:hover:before]:bg-transparent', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-b bg-subtle font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('group relative border-b border-border data-[state=selected]:bg-subtle', className)}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

type TableHeadVariant = 'default' | 'cardhead'

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  variant?: TableHeadVariant
}

const TABLE_HEAD_VARIANTS: Record<TableHeadVariant, string> = {
  default: 'h-10 px-2 text-left text-xs font-medium uppercase tracking-wide text-secondary',
  cardhead: 'text-base font-normal [&>div]:px-0'
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <th
      ref={ref}
      className={cn('relative align-middle', TABLE_HEAD_VARIANTS[variant], className)}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

type TableHeadButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const TableHeadButton = React.forwardRef<HTMLButtonElement, TableHeadButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('text-xs uppercase tracking-wide leading-4 text-secondary hover:text-foreground px-0', className)}
      {...props}
    />
  )
)
TableHeadButton.displayName = 'TableHeadButton'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('relative p-2.5 align-middle group-hover:bg-subtle/50', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-secondary', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableHeadButton,
  TableRow,
  TableCell,
  TableCaption
}
