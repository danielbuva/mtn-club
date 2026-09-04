import {
  CalendarRange,
  CircleDollarSign,
  MailCheck,
  Mountain,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { LoadingPanel, LoadingValue, panelClass } from './primitives'

export function AnalyticsLoading() {
  return (
    <>
      <div className="mt-6 flex flex-wrap gap-1">
        {['Active term', '30 days', '90 days', 'All time'].map(label => (
          <span
            key={label}
            className="bg-white/55 px-3 py-2 text-sm font-semibold dark:bg-card"
          >
            {label}
          </span>
        ))}
      </div>
      <section
        aria-label="Operational metrics"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[
          { label: 'Accounts', note: 'Current login identities', icon: Users },
          {
            label: 'Applications',
            note: 'Submitted in this range',
            icon: UserRoundPlus,
          },
          { label: 'Confirmed dues', icon: CircleDollarSign },
          { label: 'Active members', icon: Users },
          { label: 'Trips', icon: Mountain },
          { label: 'Mailing opt-ins', icon: MailCheck },
        ].map(({ label, note, icon: Icon }) => (
          <article key={label} className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#6A5146] dark:text-muted-foreground">
                {label}
              </p>
              <Icon className="size-5 text-[#6A5146]" />
            </div>
            <LoadingValue className="mt-4 h-12 w-16" />
            {note ? (
              <p className="mt-1 text-xs text-[#6A5146] dark:text-muted-foreground">
                {note}
              </p>
            ) : (
              <LoadingValue className="mt-1 h-4 w-36" />
            )}
          </article>
        ))}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LoadingPanel>
          <h2 className="flex items-center gap-2 font-brand text-2xl uppercase">
            <CalendarRange className="size-5" />
            Trip lifecycle
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {['Published', 'Canceled', 'Archived'].map(label => (
              <div
                key={label}
                className="bg-[#E9DDC3]/70 p-4 dark:bg-secondary"
              >
                <LoadingValue className="h-9 w-10" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </LoadingPanel>
        <LoadingPanel title="Trip activity mix">
          <LoadingValue className="mt-5 h-7 w-40" />
          <LoadingValue className="mt-3 h-7 w-48" />
        </LoadingPanel>
      </div>
    </>
  )
}
