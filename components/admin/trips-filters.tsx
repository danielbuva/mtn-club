import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TripFilters({
  filters = {},
  disabled = false,
}: {
  filters?: { q?: string; timing?: string; kind?: string; lifecycle?: string }
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <form
        action="/admin/trips"
        className="mt-8 grid gap-3 border border-[#211D18]/15 bg-white/45 p-4 dark:border-border dark:bg-card sm:grid-cols-[1fr_repeat(4,auto)]"
      >
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Search trips"
          aria-label="Search trips"
        />
        <select
          aria-label="Trip dates"
          name="timing"
          defaultValue={filters.timing ?? 'upcoming'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
        <select
          aria-label="Trip type"
          name="kind"
          defaultValue={filters.kind ?? 'all'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="all">All types</option>
          <option value="official">Official</option>
          <option value="unofficial">Unofficial</option>
          <option value="meetup">Meetups</option>
          <option value="trip">Trips</option>
        </select>
        <select
          name="lifecycle"
          defaultValue={filters.lifecycle ?? 'active'}
          className="h-10 border border-input bg-background px-3 text-sm"
          aria-label="Trip lifecycle"
        >
          <option value="active">Published and canceled</option>
          <option value="published">Published</option>
          <option value="canceled">Canceled</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>
    </fieldset>
  )
}
