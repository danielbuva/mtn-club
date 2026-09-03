import { CalendarClock, CircleDollarSign, MapPin, Mountain } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateAdminSettingsAction } from './actions'

export default async function AdminSettingsPage() {
  const context = await requireAdminCapability('settings.read')
  const admin = createAdminClient()
  const [term, settings] = await Promise.all([
    admin.from('club_terms').select('*').eq('is_active', true).single(),
    admin.from('club_admin_settings').select('*').eq('id', true).single(),
  ])
  if (term.error) throw term.error
  if (settings.error) throw settings.error
  const canUpdate = Boolean(context.permissions['settings.update'])

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
      <AdminPageHeader
        title="Settings"
        description="The active club term and policies used by membership and community trips."
      />
      <form action={updateAdminSettingsAction} className="mt-8 grid gap-6">
        <input type="hidden" name="termId" value={term.data.id} />
        <section className="border border-[#211D18]/15 bg-white/45 p-6 dark:border-border dark:bg-card">
          <h2 className="flex items-center gap-2 font-brand text-2xl uppercase">
            <CalendarClock className="size-5" /> Active club term
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label htmlFor="term-name" className="text-sm font-semibold">
              Term name
              <Input
                id="term-name"
                className="mt-2"
                name="termName"
                defaultValue={term.data.name}
                maxLength={80}
                disabled={!canUpdate}
                required
              />
            </label>
            <label htmlFor="term-start" className="text-sm font-semibold">
              Starts
              <Input
                id="term-start"
                className="mt-2"
                name="startsOn"
                type="date"
                defaultValue={term.data.starts_on}
                disabled={!canUpdate}
                required
              />
            </label>
            <label htmlFor="term-end" className="text-sm font-semibold">
              Ends
              <Input
                id="term-end"
                className="mt-2"
                name="endsOn"
                type="date"
                defaultValue={term.data.ends_on}
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
                <Input
                  id="dues-amount"
                  className="pl-7"
                  name="duesAmount"
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  defaultValue={(settings.data.dues_amount_cents / 100).toFixed(
                    2,
                  )}
                  disabled={!canUpdate}
                  required
                />
              </div>
            </label>
            <label htmlFor="club-time-zone" className="text-sm font-semibold">
              <span className="flex items-center gap-2">
                <MapPin className="size-4" /> Club time zone
              </span>
              <Input
                id="club-time-zone"
                className="mt-2"
                name="timeZone"
                defaultValue={settings.data.time_zone}
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
              <Input
                id="community-trip-limit"
                className="mt-2"
                name="unofficialTripLimit"
                type="number"
                min={0}
                max={20}
                defaultValue={settings.data.non_admin_upcoming_trip_limit}
                disabled={!canUpdate}
                required
              />
            </label>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            The trip limit is enforced atomically when a regular member
            publishes an upcoming unofficial trip. Drafts are unlimited.
          </p>
        </section>

        {canUpdate ? (
          <Button className="w-fit" type="submit">
            Save settings
          </Button>
        ) : null}
      </form>
    </div>
  )
}
