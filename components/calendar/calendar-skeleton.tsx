export function CalendarSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 border-b border-border/50" />
      <main className="flex-1 pt-16 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-96 w-full bg-card border border-border rounded-2xl animate-pulse" />
        </div>
      </main>
    </div>
  )
}
