import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export type KoenigButtonProps = {
  color?: 'white' | 'grey' | 'gray' | 'black' | 'accent' | string
  dataTestId?: string
  href?: string | null
  size?: 'small' | 'medium' | 'large'
  width?: 'regular' | 'full'
  rounded?: boolean
  shrink?: boolean
  value?: string
  placeholder?: string
  target?: string
  children?: ReactNode
} & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
)

export function Button({
  color = 'accent',
  dataTestId,
  href,
  size = 'small',
  width = 'regular',
  rounded = true,
  shrink = false,
  value = '',
  placeholder = 'Add button text',
  children,
  className,
  ...rest
}: KoenigButtonProps) {
  const content = value || placeholder || children

  let colorClasses = ''
  let inlineStyle: CSSProperties | undefined

  if (color === 'white') {
    colorClasses = 'bg-surface text-foreground'
  } else if (color === 'grey' || color === 'gray') {
    colorClasses = 'bg-hover  text-foreground'
  } else if (color === 'black') {
    colorClasses = 'bg-inverse text-white'
  } else if (color === 'accent') {
    colorClasses = 'text-white'
    inlineStyle = { backgroundColor: 'var(--kg-accent-color, #ff0095)' }
  } else if (typeof color === 'string') {
    colorClasses = 'text-white'
    inlineStyle = { backgroundColor: color }
  }

  const classNames = cn(
    'not-kg-prose inline-block cursor-pointer text-center font-sans font-medium',
    shrink ? null : 'shrink-0',
    width === 'full' ? 'w-full' : null,
    rounded && 'rounded-md',
    value ? 'opacity-100' : 'opacity-50',
    colorClasses,
    className
  )

  const span = (
    <span
      className={cn(
        'block',
        size === 'small' && 'px-5 py-[1rem] text-md leading-[1.4]',
        size === 'medium' && 'px-5 py-2 text-[1.6rem]',
        size === 'large' && 'px-6 py-3 text-lg leading-[1.35]'
      )}
      data-testid={dataTestId ? `${dataTestId}-span` : undefined}
    >
      {content}
    </span>
  )

  if (href) {
    return (
      <a className={classNames} data-testid={dataTestId} href={href} style={inlineStyle} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {span}
      </a>
    )
  }

  return (
    <button className={classNames} data-testid={dataTestId} style={inlineStyle} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {span}
    </button>
  )
}
