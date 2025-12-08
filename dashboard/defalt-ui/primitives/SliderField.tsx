import { useCallback, useId, type ChangeEvent } from 'react'
import * as Slider from '@radix-ui/react-slider'

export type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  disabled?: boolean
  labelHidden?: boolean
  variant?: 'default' | 'normal' | 'compact'
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  onCommit,
  disabled = false,
  labelHidden = false,
  variant = 'default'
}: SliderFieldProps) {
  const clampedValue = Math.min(Math.max(value, min), max)
  const labelId = useId()

  const handleSliderChange = useCallback((next: number[]) => {
    if (disabled) {
      return
    }
    if (!Array.isArray(next) || typeof next[0] !== 'number') {
      return
    }
    const bounded = Math.min(Math.max(next[0], min), max)
    onChange(Number(bounded.toFixed(2)))
  }, [disabled, min, max, onChange])

  const handleSliderCommit = useCallback((next: number[]) => {
    if (disabled || !onCommit) {
      return
    }
    if (!Array.isArray(next) || typeof next[0] !== 'number') {
      return
    }
    const bounded = Math.min(Math.max(next[0], min), max)
    onCommit(Number(bounded.toFixed(2)))
  }, [disabled, max, min, onCommit])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }
    const raw = Number(event.target.value)
    if (Number.isNaN(raw)) {
      return
    }
    const bounded = Math.min(Math.max(raw, min), max)
    onChange(bounded)
    onCommit?.(bounded)
  }, [disabled, min, max, onChange, onCommit])

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center gap-3">
        {!labelHidden ? (
          <label
            id={labelId}
            className={`font-md text-left min-w-[96px] flex-shrink-0 ${disabled ? 'text-placeholder' : 'text-secondary'}`}
          >
            {label}
          </label>
        ) : null}
        <div className="ml-auto flex flex-shrink-0 items-center gap-3 text-sm">
          <Slider.Root
            className={`relative flex h-4 select-none items-center data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed ${
              variant === 'compact'
                ? 'w-16 flex-none'
                : variant === 'normal'
                ? 'w-[6rem] flex-none'
                : 'min-w-[140px] flex-1'
            }`}
            value={[clampedValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            aria-label={labelHidden ? label : undefined}
            aria-labelledby={!labelHidden ? labelId : undefined}
            disabled={disabled}
          >
            <Slider.Track className="relative h-1 w-full rounded-full bg-hover data-[disabled]:bg-hover/70">
              <Slider.Range className="absolute h-full rounded-full bg-inverse" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full border border-inverse bg-inverse shadow-sm transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[disabled]:border-border-strong data-[disabled]:bg-hover" />
          </Slider.Root>
          <div className="relative flex-shrink-0 text-right font-sm">
            <input
              type="number"
              value={clampedValue}
              onChange={handleInputChange}
              min={min}
              max={max}
              aria-label={labelHidden ? label : undefined}
              aria-labelledby={!labelHidden ? labelId : undefined}
              className={`w-[4.5rem] pl-2 py-1 border border-border-strong rounded font-sm text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-subtle disabled:text-placeholder ${unit ? 'pr-7' : 'pr-2'}`}
              disabled={disabled}
            />
            {unit && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-sm text-placeholder pointer-events-none">{unit}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
