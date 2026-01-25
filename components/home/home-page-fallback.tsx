export function HomePageFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 border-b border-border/50" />

      <main className="flex-1">
        <section className="relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-muted/20 via-muted/30 to-muted/40 animate-pulse" />
          <div className="absolute left-1/2 bottom-6 -translate-x-1/2">
            <div className="h-10 w-24 rounded-full bg-muted/40 animate-pulse" />
          </div>
        </section>

        <div className="min-h-screen flex flex-col border-t border-border bg-background">
          <section className="py-24 px-4 sm:px-6 lg:px-8 flex-1">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-muted/40 mx-auto animate-pulse" />
              <div className="h-8 w-72 bg-muted/40 rounded mx-auto animate-pulse" />
              <div className="h-4 w-80 bg-muted/30 rounded mx-auto animate-pulse" />
              <div className="space-y-3 max-w-md mx-auto">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-4 bg-muted/30 rounded animate-pulse" />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="h-12 w-40 bg-muted/40 rounded-xl animate-pulse" />
                <div className="h-12 w-40 bg-muted/30 rounded-xl animate-pulse" />
              </div>
            </div>
          </section>

          <footer className="bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="h-20 bg-muted/40 rounded-2xl animate-pulse" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
