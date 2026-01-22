import { Card, CardContent } from '@/components/ui/card'

export function HomePageFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 border-b border-border/50" />

      <main className="flex-1 relative pt-16">
        <div className="absolute inset-0 pt-16">
          <div className="h-full w-full bg-linear-to-br from-muted/20 via-muted/30 to-muted/40 animate-pulse" />
        </div>

        <div className="absolute top-20 left-4 w-96 max-w-[calc(100%-2rem)] flex flex-col gap-4 z-10">
          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-48 bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted/40 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-9 w-32 bg-muted/50 rounded-xl animate-pulse" />
                <div className="h-9 w-24 bg-muted/40 rounded-xl animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
            <CardContent className="p-4 space-y-3">
              <div className="h-4 w-28 bg-muted/60 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 bg-muted/40 rounded-xl animate-pulse" />
                <div className="h-8 bg-muted/40 rounded-xl animate-pulse" />
                <div className="h-8 bg-muted/40 rounded-xl animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted/40 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="absolute top-20 right-4 z-10">
          <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
            <CardContent className="p-1">
              <div className="h-10 w-28 bg-muted/40 rounded-xl animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-20 bg-muted/40 rounded-2xl animate-pulse" />
        </div>
      </footer>
    </div>
  )
}
