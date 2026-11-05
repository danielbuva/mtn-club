import { Card, CardContent } from '@/components/ui/card'

const skeletonKeys = ['one', 'two', 'three', 'four', 'five', 'six']

export function TripsListLoading() {
  return (
    <section className="space-y-6" aria-label="Loading trips" aria-busy="true">
      <div className="flex gap-4">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      </div>
      <section className="space-y-4">
        <div className="hidden gap-2 md:flex">
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skeletonKeys.map(key => (
            <Card key={key} className="overflow-hidden border-border/70">
              <div className="hidden aspect-[16/9] animate-pulse bg-muted md:block" />
              <CardContent className="space-y-3 p-4 md:p-5">
                <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-7 w-3/5 animate-pulse rounded bg-muted" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                <div className="space-y-3 border-t border-border/70 pt-3">
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-9 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
    </section>
  )
}
