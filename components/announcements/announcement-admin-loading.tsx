export function AnnouncementAdminLoading() {
  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading announcements…</span>
      {['first', 'second', 'third'].map(key => (
        <div key={key} className="h-24 border-b border-border bg-muted/40" />
      ))}
    </div>
  )
}
