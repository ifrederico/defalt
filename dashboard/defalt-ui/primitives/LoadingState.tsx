import { Spinner } from './Spinner'

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className ?? ''}`}>
      <Spinner size={24} />
      <p className="mt-3 text-base text-muted">Loading…</p>
    </div>
  )
}
