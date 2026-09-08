export function AnnouncementEditorLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading announcement editor…</span>
      <div className="h-5 w-36 bg-muted" />
      <div className="h-8 w-52 bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-16 bg-muted" />
        <div className="h-16 bg-muted" />
      </div>
      <div className="h-24 bg-muted" />
      <div className="h-24 bg-muted" />
      <div className="h-72 bg-muted" />
      <div className="h-40 border-t border-border bg-muted" />
    </div>
  )
}
