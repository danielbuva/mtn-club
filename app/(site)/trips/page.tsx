import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TripsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            UNLV Mountain Club
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold">
            Trips are coming soon
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            We're building a trips calendar and RSVP flow. For now, check
            Discord for upcoming outings.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/start-here">Start here</Link>
          </Button>
          <Button variant="secondary" asChild className="rounded-xl">
            <Link href="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
