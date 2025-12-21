import * as Switch from '@radix-ui/react-switch'

export type ToggleSwitchProps = {
  checked: boolean
  onChange: (value: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

export function ToggleSwitch({ checked, onChange, ariaLabel, disabled = false }: ToggleSwitchProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`peer inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface h-4 w-7 ${disabled ? 'cursor-not-allowed opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-subtle' : 'cursor-pointer data-[state=checked]:bg-primary data-[state=unchecked]:bg-subtle'}`}
    >
      <span className="sr-only">{ariaLabel}</span>
      <Switch.Thumb className="pointer-events-none block h-3 w-3 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0" />
    </Switch.Root>
  )
}
