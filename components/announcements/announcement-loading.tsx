export function AnnouncementLoading() {
  return (
    <div aria-busy="true" className="max-w-3xl space-y-6">
      <span className="sr-only">Loading announcement…</span>
      <div className="h-4 w-48 bg-muted" />
      <div className="h-20 w-3/4 bg-muted" />
      <div className="h-16 w-1/2 bg-muted" />
      <div className="h-24 w-full border-t border-border bg-muted" />
    </div>
  )
}
