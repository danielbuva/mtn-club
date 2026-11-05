'use client'

import { Button } from '@/components/ui/button'

export default function TripsError({ reset }: { reset: () => void }) {
  return (
    <div className="public-page-top mx-auto max-w-7xl space-y-4 px-4 pb-16">
      <p>Trips could not be loaded. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
