'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FormLoadError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h2 className="font-brand text-2xl">
        The trip form could not be loaded.
      </h2>
      <p>Please try again. Your previously saved draft is still available.</p>
      <div className="flex items-center gap-5">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/trips/drafts" className="underline">
          Your drafts
        </Link>
      </div>
    </section>
  )
}
