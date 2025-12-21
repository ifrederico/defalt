import { useMemo, useState, type CSSProperties, type Ref } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../utils/cn'

export type SelectItem<TValue> = {
  value: TValue
  label: string
  disabled?: boolean
}

export type SelectProps<TValue> = {
  selected: TValue
  items: SelectItem<TValue>[]
  onSelect: (value: TValue) => void
  triggerLabel?: string
  triggerClassName?: string
  contentClassName?: string
  contentStyle?: CSSProperties
  triggerRef?: Ref<HTMLButtonElement>
  itemClassName?: string
  disabled?: boolean
}

const DEFAULT_TRIGGER_CLASSES =
  'inline-flex h-[34px] w-[160px] items-center justify-between rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:bg-subtle'

const DEFAULT_CONTENT_CLASSES =
  'bg-surface rounded-md shadow-md overflow-hidden min-w-[160px] border border-border p-1 z-[100]'

const DEFAULT_ITEM_CLASSES =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-subtle data-[highlighted]:bg-subtle data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

export function Select<TValue>({
  selected,
  items,
  onSelect,
  triggerLabel,
  triggerClassName,
  contentClassName,
  contentStyle,
  triggerRef,
  itemClassName,
  disabled = false,
}: SelectProps<TValue>) {
  const selectedLabel = useMemo(() => {
    if (triggerLabel) {
      return triggerLabel
    }

    const match = items.find((item) => item.value === selected)
    return match ? match.label : ''
  }, [items, selected, triggerLabel])

  const resolvedTriggerClasses = cn(
    triggerClassName ?? DEFAULT_TRIGGER_CLASSES,
    disabled && 'cursor-not-allowed opacity-60'
  )

  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          ref={triggerRef}
          className={resolvedTriggerClasses}
          disabled={disabled}
          aria-disabled={disabled}
        >
          <span className="flex-1 text-left truncate">{selectedLabel}</span>
          <ChevronDown size={16} strokeWidth={2} className="text-foreground shrink-0 ml-auto opacity-60" />
        </button>
      </DropdownMenu.Trigger>

      {!disabled && (
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={contentClassName ?? DEFAULT_CONTENT_CLASSES}
            style={contentStyle}
            sideOffset={4}
            align="start"
            onCloseAutoFocus={(event) => event.preventDefault()}
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
                disabled={item.disabled}
                className={cn(itemClassName ?? DEFAULT_ITEM_CLASSES)}
              >
                <span className="flex-1 text-left">{item.label}</span>
                {item.value === selected ? (
                  <Check size={16} strokeWidth={2} className="text-foreground" />
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
