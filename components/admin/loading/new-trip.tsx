import { EventFloatingActions } from '@/components/events/event-floating-actions'
import { LoadingField, LoadingValue } from './primitives'

export function NewTripLoading() {
  return (
    <div className="min-h-screen px-4 py-8" aria-busy="true">
      <output className="sr-only">Loading trip form options…</output>
      <div className="mx-auto max-w-3xl space-y-6 pb-8 md:pb-0">
        <section className="space-y-4">
          <div className="flex gap-3">
            <span className="border border-border px-2 py-1 text-xs">
              Official Trip
            </span>
            <span className="border border-border px-2 py-1 text-xs">
              Community Meetup
            </span>
          </div>
          <LoadingField label="Title" knownValue="" />
          <div className="text-sm font-medium">
            Activity tags
            <div className="mt-2 flex gap-2">
              {[0, 1, 2].map(item => (
                <LoadingValue key={item} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>
          <LoadingField label="Difficulty" />
        </section>
        <LoadingField label="Description" multiline knownValue="" />
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadingField label="Start" />
          <LoadingField label="End" />
        </div>
        <LoadingField label="Time zone" />
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadingField label="Primary location" knownValue="" />
          <LoadingField label="Meeting location" knownValue="" />
        </div>
      </div>
      <EventFloatingActions admin loading />
    </div>
  )
}
