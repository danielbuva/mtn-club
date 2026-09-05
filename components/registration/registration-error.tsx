'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
export function RegistrationError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h2 className="text-xl font-semibold">
        Registration could not be loaded
      </h2>
      <p>
        Refresh and try again. If this continues, contact the club to check your
        registration or organizer access.
      </p>
      <Button onClick={reset}>Try again</Button>
      <Link className="ml-4 underline" href="/profile/trips">
        My trips
      </Link>
    </div>
  )
}
