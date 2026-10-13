import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { PublicShell } from '@/components/landing/public-shell'
import { WeeklyMeetupNote } from '@/components/weekly-meetup-note'

const calendarLinkClass =
  'group inline-flex items-center gap-2 leading-7 font-semibold text-[#FFECA2] underline decoration-[#FFECA2]/35 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#FFECA2]'

function ScheduleLinks() {
  return (
    <div className="flex flex-col items-start">
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

export function TripSchedulePage({ children }: { children: ReactNode }) {
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

          <WeeklyMeetupNote className="mt-6 text-[#F8F1DF]/75" />

          {children}
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
