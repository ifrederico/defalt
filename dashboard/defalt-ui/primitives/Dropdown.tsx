import { useMemo, useEffect, useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'

export type DropdownItem<TValue> = {
  value: TValue
  label: string
  disabled?: boolean
}

export type DropdownProps<TValue> = {
  selected: TValue
  items: DropdownItem<TValue>[]
  onSelect: (value: TValue) => void
  triggerLabel?: string
  triggerClassName?: string
  contentClassName?: string
  itemClassName?: string
  disabled?: boolean
}

const DEFAULT_TRIGGER_CLASSES =
  'flex items-center justify-start gap-1.5 px-3 py-2 rounded-md w-[160px] bg-subtle hover:bg-subtle/80 transition-colors focus:outline-none focus-visible:outline-none'

const DEFAULT_CONTENT_CLASSES =
  'bg-surface rounded-md shadow-lg overflow-hidden min-w-[160px] space-y-0.5 z-[100]'

const DEFAULT_ITEM_CLASSES =
  'px-3 py-2 rounded outline-none cursor-pointer flex items-center gap-2 transition-colors hover:bg-subtle text-foreground'

export function Dropdown<TValue>({
  selected,
  items,
  onSelect,
  triggerLabel,
  triggerClassName,
  contentClassName,
  itemClassName,
  disabled = false,
}: DropdownProps<TValue>) {
  const selectedLabel = useMemo(() => {
    if (triggerLabel) {
      return triggerLabel
    }

    const match = items.find((item) => item.value === selected)
    return match ? match.label : ''
  }, [items, selected, triggerLabel])

  const resolvedTriggerClasses = `${triggerClassName ?? DEFAULT_TRIGGER_CLASSES}${
    disabled ? ' cursor-not-allowed opacity-60' : ''
  }`

  // Track last input type to decide focus behavior
  const lastInputWasKeyboardRef = useRef(false)
  useEffect(() => {
    const handleKey = () => { lastInputWasKeyboardRef.current = true }
    const handlePointer = () => { lastInputWasKeyboardRef.current = false }
    window.addEventListener('keydown', handleKey, { passive: true })
    window.addEventListener('mousedown', handlePointer, { passive: true })
    window.addEventListener('pointerdown', handlePointer, { passive: true })
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handlePointer)
      window.removeEventListener('pointerdown', handlePointer)
    }
  }, [])

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && !lastInputWasKeyboardRef.current) {
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null
        if (active && active.blur) {
          active.blur()
        }
      })
    }
  }, [open])

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={resolvedTriggerClasses}
          disabled={disabled}
          aria-disabled={disabled}
        >
          <span className="flex-1 text-left">{selectedLabel}</span>
          <ChevronDown size={18} strokeWidth={1.5} className="text-foreground shrink-0 ml-auto" />
        </button>
      </DropdownMenu.Trigger>

      {!disabled && (
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={contentClassName ?? DEFAULT_CONTENT_CLASSES}
            sideOffset={1}
          >
          {items.map((item) => (
            <DropdownMenu.Item
              key={`${item.value}`}
              onSelect={(event) => {
                if (item.disabled) {
                  event.preventDefault()
                  return
                }
                onSelect(item.value)
              }}
              className={`${itemClassName ?? DEFAULT_ITEM_CLASSES} ${
                item.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="flex-1 text-left">{item.label}</span>
              {item.value === selected ? (
                <Check size={16} strokeWidth={1.5} className="text-foreground" />
              ) : (
                <span className="w-4" />
              )}
            </DropdownMenu.Item>
          ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  )
}
