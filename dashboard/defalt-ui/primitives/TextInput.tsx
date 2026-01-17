import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

const TEXT_FIELD_BASE_CLASSES =
  'w-full rounded-md border border-transparent bg-subtle px-3 text-base text-foreground transition-colors placeholder:text-placeholder focus-visible:outline-none focus-visible:bg-transparent focus-visible:border-success focus-visible:shadow-[0_0_0_2px_rgba(48,207,67,0.25)] disabled:cursor-not-allowed disabled:opacity-50'

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn('flex h-9 py-1', TEXT_FIELD_BASE_CLASSES, className)}
      {...props}
    />
  )
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn('flex min-h-[80px] py-2', TEXT_FIELD_BASE_CLASSES, className)}
      {...props}
    />
  )
}
