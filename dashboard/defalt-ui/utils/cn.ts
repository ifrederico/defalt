import { twMerge } from 'tailwind-merge'

type ClassValue = string | false | null | undefined | 0 | ClassValue[]

/**
 * Combines class names and merges Tailwind classes intelligently.
 *
 * Uses tailwind-merge to resolve conflicting Tailwind classes:
 * - cn('px-2', 'px-4') => 'px-4' (later class wins)
 * - cn('md:px-2', 'md:px-4') => 'md:px-4' (handles responsive variants)
 * - cn('hover:bg-red', 'hover:bg-blue') => 'hover:bg-blue' (handles state variants)
 *
 * @example
 * cn('px-2 py-1', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(inputs.flat().filter(Boolean).join(' '))
}
