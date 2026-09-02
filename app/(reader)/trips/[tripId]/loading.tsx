import { Card, CardContent } from '@/components/ui/card'

export default function TripDetailLoading() {
  const quickFactSkeletonKeys = [
    'location',
    'date',
    'time',
    'capacity',
  ] as const
  const sectionSkeletonKeys = [
    'overview',
    'stats',
    'logistics',
    'requirements',
    'comments',
  ] as const

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 pb-32 md:space-y-5 md:pb-8">
      <div className="aspect-[16/9] animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickFactSkeletonKeys.map(key => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="space-y-4">
        {sectionSkeletonKeys.map(key => (
          <Card key={key}>
            <CardContent className="p-4 md:p-5">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
