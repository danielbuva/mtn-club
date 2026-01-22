import { Card, CardContent } from '@/components/ui/card'

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 border-b border-border/50" />

      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="h-9 w-52 bg-muted/70 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-64 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-80 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 w-40 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-56 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
