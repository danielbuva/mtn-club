import { Card, CardContent } from '@/components/ui/card'

export function CalendarSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
              <div className="h-4 w-72 bg-muted/40 rounded animate-pulse" />
            </div>
            <Card className="bg-card border-border/50 w-full md:w-64">
              <CardContent className="p-4 space-y-3">
                <div className="h-4 w-36 bg-muted/50 rounded animate-pulse" />
                <div className="h-8 w-full bg-muted/40 rounded-xl animate-pulse" />
                <div className="h-8 w-full bg-muted/40 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 shrink-0 space-y-6">
              <div className="h-10 w-full bg-muted/40 rounded-xl animate-pulse" />
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                  <div className="h-8 w-full bg-muted/40 rounded-xl animate-pulse" />
                  <div className="h-8 w-full bg-muted/40 rounded-xl animate-pulse" />
                  <div className="h-8 w-full bg-muted/40 rounded-xl animate-pulse" />
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-40 bg-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-muted/40 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-muted/40 rounded-xl animate-pulse" />
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
                <div className="h-8 w-36 bg-muted/40 rounded-xl animate-pulse" />
              </div>
              <div className="space-y-3">
                {['row-1', 'row-2', 'row-3', 'row-4', 'row-5', 'row-6'].map((key) => (
                  <div
                    key={key}
                    className="h-20 w-full bg-card border border-border rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
