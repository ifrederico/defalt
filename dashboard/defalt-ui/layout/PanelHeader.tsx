import { ChevronLeft } from 'lucide-react'

export type PanelHeaderProps = {
  title: string
  onBack?: () => void
}

export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border">
      <header className="flex h-12 items-center px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 font-md font-bold text-foreground transition-colors hover:text-secondary"
          >
            <ChevronLeft size={16} className="text-muted" />
            <span>{title}</span>
          </button>
        ) : (
          <h2 className="font-lg text-foreground">{title}</h2>
        )}
      </header>
    </div>
  )
}
