import type { ReactNode } from 'react'

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

type InlineControlRowProps = {
  label: string
  children: ReactNode
  labelWidth?: 'sm' | 'md' | 'lg'
}

const LABEL_WIDTH_CLASSES = {
  sm: 'max-w-[64px]',   // ~8 chars - for radio with many buttons
  md: 'max-w-[120px]',  // ~14 chars - default
  lg: 'max-w-[180px]'   // ~22 chars - for toggles with longer labels
}

export function InlineControlRow({ label, children, labelWidth = 'md' }: InlineControlRowProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <p className={`font-md text-foreground min-w-[60px] flex-shrink-0 truncate ${LABEL_WIDTH_CLASSES[labelWidth]}`} title={label}>{label}</p>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}
