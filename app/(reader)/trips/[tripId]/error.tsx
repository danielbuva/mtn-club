'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function TripDetailError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-10">
      <Card className="w-full border-border/70">
        <CardContent className="space-y-4 p-6 text-center md:p-8">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this trip right now.
          </p>
          <Button onClick={reset}>Retry</Button>
        </CardContent>
      </Card>
    </main>
  )
}
