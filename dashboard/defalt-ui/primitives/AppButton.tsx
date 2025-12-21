import type { ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'light' | 'dark' | 'link'
type State = 'default' | 'loading' | 'disabled' | 'success'

export type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: Variant
  state?: State
}

const baseClasses =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const variantStateClasses: Record<Variant, Record<State, string>> = {
  primary: {
    default: 'bg-primary text-white hover:bg-primary-hover',
    loading: 'cursor-wait bg-primary text-white opacity-75',
    disabled: 'cursor-not-allowed bg-primary text-white opacity-60',
    success: 'bg-primary text-white',
  },
  secondary: {
    default: 'border border-border bg-surface text-foreground hover:bg-subtle',
    loading: 'cursor-wait border border-border bg-surface text-muted',
    disabled: 'cursor-not-allowed border border-border bg-surface text-placeholder',
    success: 'border border-border bg-surface text-secondary',
  },
  danger: {
    default: 'bg-error text-white hover:opacity-90',
    loading: 'cursor-wait bg-error text-white opacity-75',
    disabled: 'cursor-not-allowed bg-error text-white opacity-60',
    success: 'bg-error text-white',
  },
  success: {
    default: 'bg-success text-white hover:opacity-90',
    loading: 'cursor-wait bg-success text-white opacity-75',
    disabled: 'cursor-not-allowed bg-success text-white opacity-60',
    success: 'bg-success text-white',
  },
  light: {
    default: 'bg-transparent text-foreground hover:bg-subtle',
    loading: 'cursor-wait bg-transparent text-muted',
    disabled: 'cursor-not-allowed bg-transparent text-placeholder',
    success: 'bg-transparent text-secondary',
  },
  dark: {
    default: 'bg-inverse text-white hover:bg-inverse-subtle',
    loading: 'cursor-wait bg-inverse text-white opacity-75',
    disabled: 'cursor-not-allowed bg-inverse text-white opacity-60',
    success: 'bg-inverse text-white',
  },
  link: {
    default: 'bg-transparent text-muted hover:text-foreground',
    loading: 'cursor-wait bg-transparent text-placeholder',
    disabled: 'cursor-not-allowed bg-transparent text-placeholder',
    success: 'bg-transparent text-secondary',
  },
}

export function AppButton({
  variant,
  state = 'default',
  className,
  disabled,
  type = 'button',
  ...rest
}: AppButtonProps) {
  const classes = twMerge(
    baseClasses,
    'h-[34px] px-3 py-2',
    variantStateClasses[variant][state],
    className
  )

  return (
    <button
      className={classes}
      disabled={disabled}
      type={type}
      {...rest}
    />
  )
}
