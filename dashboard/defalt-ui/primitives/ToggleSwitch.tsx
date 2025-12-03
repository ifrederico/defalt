import * as Switch from '@radix-ui/react-switch'

export type ToggleSwitchProps = {
  checked: boolean
  onChange: (value: boolean) => void
  ariaLabel: string
  size?: 'default' | 'small'
  disabled?: boolean
}

export function ToggleSwitch({ checked, onChange, ariaLabel, size = 'default', disabled = false }: ToggleSwitchProps) {
  const dimensions = size === 'small'
    ? {
        root: 'h-[18px] w-[34px]',
        thumb: 'h-[14px] w-[14px] translate-x-[2px] data-[state=checked]:translate-x-[18px]'
      }
    : {
        root: 'h-[22px] w-[42px]',
        thumb: 'h-[18px] w-[18px] translate-x-[3px] data-[state=checked]:translate-x-[21px]'
      }

  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`group relative inline-flex ${dimensions.root} items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${disabled ? 'cursor-not-allowed bg-hover opacity-60 data-[state=checked]:bg-hover' : 'cursor-pointer bg-hover data-[state=checked]:bg-inverse'}`}
    >
      <span className="sr-only">{ariaLabel}</span>
      <Switch.Thumb className={`pointer-events-none block rounded-full bg-surface shadow-sm transition-transform duration-200 ease-out ${dimensions.thumb}`} />
    </Switch.Root>
  )
}
