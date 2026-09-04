import { CalendarClock, CircleDollarSign, MapPin, Mountain } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { LoadingValue } from './loading/primitives'

type Settings = {
  dues_amount_cents: number
  time_zone: string
  non_admin_upcoming_trip_limit: number
}
type Term = { id: string; name: string; starts_on: string; ends_on: string }

function SettingsInput({
  loading,
  className,
  ...props
}: ComponentProps<typeof Input> & { loading: boolean }) {
  if (!loading) return <Input className={className} {...props} />
  return (
    <div
      className={cn(
        'relative flex h-9 w-full items-center border border-input bg-transparent px-3 py-1',
        className,
      )}
      aria-hidden="true"
    >
      <LoadingValue className="h-3 w-2/3" />
    </div>
  )
}

export function SettingsForm({
  term,
  settings,
  canUpdate,
  loading = false,
  action,
}: {
  term?: Term
  settings?: Settings
  canUpdate: boolean
  loading?: boolean
  action?: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action} className="mt-8 grid gap-6">
      <input type="hidden" name="termId" value={term?.id ?? ''} />
      <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
        <h2 className="flex items-center gap-2 font-brand text-2xl uppercase">
          <CalendarClock className="size-5" /> Active club term
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label htmlFor="term-name" className="text-sm font-semibold">
            Term name
            <SettingsInput
              loading={loading}
              id="term-name"
              className="mt-2"
              name="termName"
              defaultValue={term?.name}
              maxLength={80}
              disabled={loading || !canUpdate}
              required
            />
          </label>
          <label htmlFor="term-start" className="text-sm font-semibold">
            Starts
            <SettingsInput
              loading={loading}
              id="term-start"
              className="mt-2"
              name="startsOn"
              type="date"
              defaultValue={term?.starts_on}
              disabled={!canUpdate}
              required
            />
          </label>
          <label htmlFor="term-end" className="text-sm font-semibold">
            Ends
            <SettingsInput
              loading={loading}
              id="term-end"
              className="mt-2"
              name="endsOn"
              type="date"
              defaultValue={term?.ends_on}
              disabled={!canUpdate}
              required
            />
          </label>
        </div>
      </section>

      <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
        <h2 className="font-brand text-2xl uppercase">Operating policy</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label htmlFor="dues-amount" className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <CircleDollarSign className="size-4" /> Annual dues
            </span>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-2 text-muted-foreground">
                $
              </span>
              <SettingsInput
                loading={loading}
                id="dues-amount"
                className="pl-7"
                name="duesAmount"
                type="number"
                min="0.01"
                max="1000"
                step="0.01"
                defaultValue={
                  settings
                    ? (settings.dues_amount_cents / 100).toFixed(2)
                    : undefined
                }
                disabled={!canUpdate}
                required
              />
            </div>
          </label>
          <label htmlFor="club-time-zone" className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> Club time zone
            </span>
            <SettingsInput
              loading={loading}
              id="club-time-zone"
              className="mt-2"
              name="timeZone"
              defaultValue={settings?.time_zone}
              disabled={!canUpdate}
              required
            />
          </label>
          <label
            htmlFor="community-trip-limit"
            className="text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <Mountain className="size-4" /> Community trip limit
            </span>
            <SettingsInput
              loading={loading}
              id="community-trip-limit"
              className="mt-2"
              name="unofficialTripLimit"
              type="number"
              min={0}
              max={20}
              defaultValue={settings?.non_admin_upcoming_trip_limit}
              disabled={!canUpdate}
              required
            />
          </label>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          The trip limit is enforced atomically when a regular member publishes
          an upcoming unofficial trip. Drafts are unlimited.
        </p>
      </section>

      {canUpdate ? (
        <Button className="w-fit" type="submit" disabled={loading}>
          Save settings
        </Button>
      ) : null}
    </form>
  )
}
