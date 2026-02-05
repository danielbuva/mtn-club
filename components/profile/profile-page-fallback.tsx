import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ProfilePageFallback() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-16">
        <section className="py-12 px-4 bg-secondary/30 border-b border-border">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="h-9 w-52 bg-muted/70 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-border/50">
              <CardHeader className="space-y-2">
                <div className="h-4 w-40 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-64 bg-muted/50 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-9 bg-muted/40 rounded-xl animate-pulse" />
                  <div className="h-9 bg-muted/40 rounded-xl animate-pulse" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-9 bg-muted/40 rounded-xl animate-pulse" />
                  <div className="h-9 bg-muted/40 rounded-xl animate-pulse" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="space-y-2">
                <div className="h-4 w-36 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-56 bg-muted/50 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-20 bg-muted/40 rounded-2xl animate-pulse" />
                <div className="h-9 bg-muted/40 rounded-xl animate-pulse" />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="h-10 w-36 bg-muted/40 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
