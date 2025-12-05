import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { ReactNode } from 'react'

export type ButtonOption = {
  label: string
  value: string
  icon?: ReactNode
  dataTestId?: string
  disabled?: boolean
}

type ButtonGroupSettingProps = {
  label: string
  value: string
  options: ButtonOption[]
  onChange: (next: string) => void
}

export function ButtonGroupSetting({ label, value, options, onChange }: ButtonGroupSettingProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="font-md text-foreground">{label}</p>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next)}
        className="inline-flex items-center gap-0.5 rounded bg-subtle p-0.5"
        aria-label={label}
      >
        {options.map(({ label: optionLabel, value: optionValue, icon, dataTestId, disabled }) => {
          const hasIcon = Boolean(icon)
          return (
          <ToggleGroup.Item
            key={optionValue}
            value={optionValue}
            data-testid={dataTestId}
            disabled={disabled}
            aria-label={hasIcon ? optionLabel : undefined}
            className={`flex items-center justify-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              disabled
                ? 'cursor-not-allowed text-placeholder'
                : 'text-muted data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:hover:bg-subtle data-[state=off]:hover:text-foreground'
            }`}
          >
            {icon}
            {hasIcon ? <span className="sr-only">{optionLabel}</span> : <span>{optionLabel}</span>}
          </ToggleGroup.Item>
        )})}
      </ToggleGroup.Root>
    </div>
  )
}

type SettingSectionProps = {
  title: string
  children: ReactNode
  action?: ReactNode
}

export function SettingSection({ title, action, children }: SettingSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-md font-bold tracking-wide text-foreground">{title}</h3>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </header>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

type SettingFieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}

export function SettingField({ label, htmlFor, hint, children }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="font-md text-foreground">{label}</label>
        {hint && <span className="text-[11px] text-placeholder">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

type SettingRowProps = {
  label: string
  children: ReactNode
}

export function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="grid grid-cols-[200px_minmax(0,1fr)] items-center gap-4">
      <p className="font-md text-foreground">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

type InlineControlRowProps = {
  label: string
  children: ReactNode
}

export function InlineControlRow({ label, children }: InlineControlRowProps) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-md text-secondary min-w-[96px] flex-shrink-0">{label}</p>
      <div className="ml-auto">{children}</div>
    </div>
  )
}
