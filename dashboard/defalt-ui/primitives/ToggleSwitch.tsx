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
      className={`group relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${disabled ? 'cursor-not-allowed bg-hover opacity-60 data-[state=checked]:bg-hover' : 'cursor-pointer bg-hover data-[state=checked]:bg-inverse'}`}
    >
      <span className="sr-only">{ariaLabel}</span>
      <Switch.Thumb className="pointer-events-none block h-[14px] w-[14px] translate-x-[2px] rounded-full bg-surface shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[18px]" />
    </Switch.Root>
  )
}
