import { Card, CardContent } from '@/components/ui/card'

const skeletonKeys = [
  'trip-skeleton-one',
  'trip-skeleton-two',
  'trip-skeleton-three',
  'trip-skeleton-four',
  'trip-skeleton-five',
  'trip-skeleton-six',
]

export default function TripsLoading() {
  return (
    <main className="public-page-top mx-auto w-full max-w-7xl px-4 pb-16 md:pb-20">
      <section className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          UNLV Mountain Club
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Trips & Events
        </h1>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skeletonKeys.map(key => (
          <Card key={key} className="overflow-hidden">
            <div className="aspect-[16/9] animate-pulse bg-muted" />
            <CardContent className="space-y-3 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
