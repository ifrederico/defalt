import { useState, useMemo, useEffect, useRef, memo } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'

export type DropdownFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  helperText?: string
  errorMessage?: string | null
  disabled?: boolean
}

export const DropdownField = memo(function DropdownField({
  label,
  value,
  options,
  onChange,
  helperText,
  errorMessage,
  disabled = false,
}: DropdownFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuWidth, setMenuWidth] = useState<number | null>(null)

  const normalizedOptions = useMemo(() => {
    if (!value) {
      return options
    }
    if (options.includes(value)) {
      return options
    }
    return [value, ...options]
  }, [options, value])

  useEffect(() => {
    const measure = () => {
      const width = triggerRef.current?.getBoundingClientRect().width
      if (typeof width === 'number' && width > 0) {
        setMenuWidth((prev) => (prev === null || Math.abs(prev - width) > 0.5 ? width : prev))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [normalizedOptions.length, value])

  const isDisabled = disabled || normalizedOptions.length === 0
  const selectValue = value && normalizedOptions.includes(value) ? value : normalizedOptions[0] ?? value ?? ''
  const dropdownLabel = selectValue || 'Select an option'

  return (
    <div className="space-y-2">
      <p className="font-sm text-secondary">{label}</p>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            ref={triggerRef}
            disabled={isDisabled}
            className={`flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md px-3 text-md transition-colors focus:outline-none ${
              isDisabled
                ? 'cursor-not-allowed bg-subtle text-placeholder'
                : 'bg-subtle text-foreground hover:bg-subtle/80'
            }`}
          >
            <span className="flex-1 truncate text-left">{dropdownLabel}</span>
            <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-secondary" aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={2}
            align="start"
            className="rounded-md bg-surface shadow-[0px_20px_80px_rgba(15,23,42,0.12)]"
            style={menuWidth ? { width: `${menuWidth}px`, minWidth: `${menuWidth}px` } : undefined}
          >
            {normalizedOptions.map((option) => {
              const isActive = option === selectValue
              return (
                <DropdownMenu.Item
                  key={option}
                  disabled={isDisabled}
                  onSelect={() => {
                    if (!isDisabled && option !== selectValue) {
                      onChange(option)
                    }
                  }}
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 font-md outline-none transition-colors ${
                    isActive ? 'text-foreground hover:bg-subtle' : 'text-foreground hover:bg-subtle'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isActive && <Check size={14} strokeWidth={1.5} className="text-muted" />}
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {helperText ? <p className="font-xs text-placeholder">{helperText}</p> : null}
      {errorMessage ? <p className="font-sm text-rose-600">{errorMessage}</p> : null}
    </div>
  )
})
