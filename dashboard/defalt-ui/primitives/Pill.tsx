import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type PillProps =
  | ({
      as: 'button'
      children: ReactNode
    } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({
      as?: 'a'
      children: ReactNode
    } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      as: 'span'
      children: ReactNode
    } & HTMLAttributes<HTMLSpanElement>)

const baseClasses = 'inline-flex items-center justify-center rounded text-sm font-sm text-foreground transition hover:bg-subtle hover:text-foreground'

const buildClassName = (className?: string) =>
  className ? `${baseClasses} ${className}` : baseClasses

export function Pill(props: PillProps) {
  if (props.as === 'button') {
    const { as, className, children, ...rest } = props
    void as
    return (
      <button className={buildClassName(className)} {...rest}>
        {children}
      </button>
    )
  }

  if (props.as === 'span') {
    const { as, className, children, ...rest } = props
    void as
    return (
      <span className={buildClassName(className)} {...rest}>
        {children}
      </span>
    )
  }

  const { as = 'a', className, children, ...rest } = props
  void as
  return (
    <a className={buildClassName(className)} {...rest}>
      {children}
    </a>
  )
}
