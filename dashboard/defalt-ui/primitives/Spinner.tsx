import { twMerge } from 'tailwind-merge'

type SpinnerProps = {
  size?: number
  className?: string
}

/**
 * Simple spinner styled to match Sonner's minimal ring.
 */
export function Spinner({ size = 20, className }: SpinnerProps) {
  const dimension = `${size}px`

  return (
    <span
      className={twMerge(
        'inline-block animate-spin rounded-full border-2 border-border-strong border-t-gray-900',
        className
      )}
      style={{ width: dimension, height: dimension }}
      role="status"
      aria-label="Loading"
    />
  )
}
