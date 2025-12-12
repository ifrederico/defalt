import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export const TEXT_FIELD_BASE_CLASSES =
  'w-full rounded-md border border-transparent bg-subtle px-3 py-2 font-md text-foreground placeholder:text-placeholder focus:outline-none focus:bg-surface focus:border-[rgb(48,207,67)] focus:shadow-[0_0_0_2px_rgba(48,207,67,0.25)]'

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(TEXT_FIELD_BASE_CLASSES, className)}
      {...props}
    />
  )
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(TEXT_FIELD_BASE_CLASSES, className)}
      {...props}
    />
  )
}

