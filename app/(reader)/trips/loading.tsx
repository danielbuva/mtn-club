import { TripsListLoading } from '@/components/trips/trips-list-loading'
import { WeeklyMeetupNote } from '@/components/weekly-meetup-note'

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
        <p className="text-sm text-muted-foreground">
          Browse official club trips and community events.
        </p>
        <WeeklyMeetupNote className="text-foreground/80" />
      </section>

      <TripsListLoading />
    </main>
  )
}
