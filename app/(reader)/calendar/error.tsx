'use client'

import { Button } from '@/components/ui/button'

export default function CalendarError({ reset }: { reset: () => void }) {
  return (
    <main className="public-page-top mx-auto w-full max-w-3xl space-y-4 px-4 pb-16">
      <h1 className="text-3xl font-semibold">Calendar unavailable</h1>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load the latest events. Please try again.
      </p>
      <Button onClick={reset}>Reload calendar</Button>
    </main>
  )
}
