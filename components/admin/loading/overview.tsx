import {
  AlertCircle,
  CalendarDays,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import { LoadingValue, panelClass } from './primitives'

export function OverviewLoading() {
  return (
    <>
      <section
        aria-label="Club snapshot"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {[
          { label: 'Active members', icon: Users },
          { label: 'Upcoming trips', icon: CalendarDays },
        ].map(({ label, icon: Icon }) => (
          <article key={label} className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[#6A5146] dark:text-muted-foreground">
                {label}
              </p>
              <Icon className="size-5 text-[#6A5146]" aria-hidden="true" />
            </div>
            <div className="mt-4 h-12">
              <LoadingValue className="h-12 w-16" />
            </div>
            {label === 'Upcoming trips' ? (
              <p className="mt-1 text-xs text-[#6A5146] dark:text-muted-foreground">
                Published events ahead
              </p>
            ) : (
              <LoadingValue className="mt-1 h-4 w-64 max-w-full" />
            )}
          </article>
        ))}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="overflow-hidden bg-[#211D18] text-[#F8F1DF] shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-brand text-sm uppercase tracking-[0.2em] text-[#FFECA2]">
                Next trip
              </p>
              <Sparkles className="size-5 text-[#FFECA2]" aria-hidden="true" />
            </div>
            <div className="mt-7">
              <LoadingValue className="h-14 w-4/5" />
              <LoadingValue className="mt-2 h-14 w-2/3" />
            </div>
            <div className="mt-7 grid gap-3 text-sm text-[#F8F1DF]/75 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-[#FFECA2]" />
                <LoadingValue />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[#FFECA2]" />
                <LoadingValue />
              </div>
              <LoadingValue />
              <div className="flex gap-2">
                Led by <LoadingValue />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <LoadingValue className="h-9 w-32" />
              <span className="inline-flex h-9 items-center border border-[#F8F1DF]/35 px-4 text-sm font-medium">
                View public page
              </span>
            </div>
          </div>
        </section>
        <section className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-brand text-sm uppercase tracking-[0.15em] text-[#6A5146] dark:text-muted-foreground">
                Needs attention
              </p>
              <LoadingValue className="mt-2 h-10 w-14" />
            </div>
            <AlertCircle className="size-7 text-amber-700" />
          </div>
          <div className="mt-5 divide-y divide-[#211D18]/10 dark:divide-border">
            {[0, 1, 2].map(row => (
              <div
                key={row}
                className="flex min-h-12 items-center justify-between gap-3 py-2"
              >
                <LoadingValue className="w-44" />
                <LoadingValue className="h-5 w-7 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className={`${panelClass} mt-6 p-6`}>
        <h2 className="font-brand text-2xl uppercase">Recent activity</h2>
        <div className="mt-4 divide-y divide-[#211D18]/10 dark:divide-border">
          {[0, 1, 2].map(row => (
            <div key={row} className="flex justify-between gap-5 py-3">
              <div>
                <LoadingValue className="w-56 max-w-full" />
                <LoadingValue className="mt-1 h-3 w-24" />
              </div>
              <LoadingValue className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
