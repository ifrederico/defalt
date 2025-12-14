import * as Switch from '@radix-ui/react-switch'

export type ToggleSwitchProps = {
  checked: boolean
  onChange: (value: boolean) => void
  ariaLabel: string
  disabled?: boolean
  size?: 'default' | 'small'
}

export function ToggleSwitch({ checked, onChange, ariaLabel, disabled = false, size = 'default' }: ToggleSwitchProps) {
  const isSmall = size === 'small'
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`group relative inline-flex items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSmall ? 'h-[16px] w-[30px]' : 'h-[18px] w-[34px]'} ${disabled ? 'cursor-not-allowed bg-hover opacity-60 data-[state=checked]:bg-hover' : 'cursor-pointer bg-hover data-[state=checked]:bg-inverse'}`}
    >
      <span className="sr-only">{ariaLabel}</span>
      <Switch.Thumb className={`pointer-events-none block translate-x-[2px] rounded-full bg-surface shadow-sm transition-transform duration-200 ease-out ${isSmall ? 'h-[12px] w-[12px] data-[state=checked]:translate-x-[16px]' : 'h-[14px] w-[14px] data-[state=checked]:translate-x-[18px]'}`} />
    </Switch.Root>
  )
}
