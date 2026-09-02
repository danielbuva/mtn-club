import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import {
  FALL_2026_TRIPS,
  formatTripDate,
  getFallTripScheduleKey,
} from '@/lib/club-content'

const calendarLinkClass =
  'group inline-flex min-h-11 items-center gap-2 font-semibold text-[#FFECA2] underline decoration-[#FFECA2]/35 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#FFECA2]'

function ScheduleLinks() {
  return (
    <div className="flex flex-col items-start gap-2">
      <Link href="/calendar" className={calendarLinkClass}>
        <span>See trip calendar</span>
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
      <Link href="/trips" className={calendarLinkClass}>
        <span>See all trips and events</span>
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}

export function TripSchedulePage({
  tripDetailHrefs,
}: {
  tripDetailHrefs: Record<string, string>
}) {
  return (
    <PublicShell disclaimerId="disclaimer" overscrollTone="inverse">
      <PageViewTracker eventName="schedule_view" />

      <section className="public-page-top bg-[#211D18] px-5 pb-16 text-[#F8F1DF] sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#FFECA2]/70">
            Around the semester
          </p>
          <h1 className="mt-3 max-w-4xl font-brand text-5xl uppercase leading-[0.9] sm:text-7xl">
            Get outside this semester.
          </h1>
          <div className="mt-4">
            <ScheduleLinks />
          </div>

          <div className="mt-6 grid gap-px overflow-hidden border border-[#F8F1DF]/15 bg-[#F8F1DF]/15 sm:grid-cols-2">
            {FALL_2026_TRIPS.map(trip => {
              const scheduleKey = getFallTripScheduleKey(trip)
              const href =
                tripDetailHrefs[scheduleKey] ??
                `/calendar?month=${trip.startDate.slice(0, 7)}`
              return (
                <Link
                  key={scheduleKey}
                  href={href}
                  className="group bg-[#211D18] p-5 outline-none transition hover:bg-[#2A241E] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFECA2]"
                >
                  <p className="font-brand text-lg uppercase tracking-wide text-[#FFECA2]">
                    {formatTripDate(trip)}
                  </p>
                  <h2 className="mt-1 flex items-start justify-between gap-3 text-lg font-semibold">
                    <span>{trip.title}</span>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#F8F1DF]/65">
                    Led by{' '}
                    {trip.hosts
                      .map(host => `${host.name} — ${host.title}`)
                      .join('; ')}
                  </p>
                </Link>
              )
            })}
          </div>
          <p className="mt-5 text-sm text-[#F8F1DF]/60">
            Exact time and logistics for special trips are announced in Discord.
          </p>
          <div className="mt-4">
            <ScheduleLinks />
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
