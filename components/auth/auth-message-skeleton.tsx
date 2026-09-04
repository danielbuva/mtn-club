export function AuthMessageSkeleton({ lines = 2 }: { lines?: 2 | 3 }) {
  return (
    <div
      className="animate-pulse space-y-5"
      aria-busy="true"
      aria-live="polite"
    >
      <div className={lines === 3 ? 'h-21 space-y-2' : 'h-12 space-y-2'}>
        <div className="h-4 bg-muted/40" />
        <div className="h-4 w-4/5 bg-muted/40" />
        {lines === 3 && <div className="h-4 w-3/5 bg-muted/40" />}
      </div>
      <div className="h-12 bg-primary/30" />
      <div className="h-11 w-48 bg-muted/30" />
      <span className="sr-only">Loading your next step…</span>
    </div>
  )
}
