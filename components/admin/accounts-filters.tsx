import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AccountFilters({
  filters = {},
  roles = [],
  disabled = false,
}: {
  filters?: {
    q?: string
    status?: string
    role?: string
    restriction?: string
    mailing?: string
  }
  roles?: { id: string; name: string }[]
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <form
        action="/admin/accounts"
        className="mt-8 grid gap-3 border border-[#211D18]/15 bg-white/45 p-4 dark:border-border dark:bg-card sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto_auto_auto]"
      >
        <label htmlFor="account-search" className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search name or email"
            id="account-search"
            name="q"
            defaultValue={filters.q}
            className="pl-9"
            placeholder="Search name or email"
          />
        </label>
        <select
          aria-label="Membership state"
          name="status"
          defaultValue={filters.status ?? 'all'}
          className="h-10 border border-input bg-background pl-2 pr-3 text-sm"
        >
          <option value="all">All membership states</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select
          aria-label="Leadership role"
          name="role"
          defaultValue={filters.role ?? 'all'}
          className="h-10 border border-input bg-background pl-2 pr-3 text-sm"
        >
          <option value="all">All leadership roles</option>
          {roles.map(role => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Restriction"
          name="restriction"
          defaultValue={filters.restriction ?? 'all'}
          className="h-10 border border-input bg-background pl-2 pr-3 text-sm"
        >
          <option value="all">All restrictions</option>
          <option value="normal">Unrestricted</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select
          aria-label="Mailing status"
          name="mailing"
          defaultValue={filters.mailing ?? 'all'}
          className="h-10 border border-input bg-background pl-2 pr-3 text-sm"
        >
          <option value="all">Any mailing status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Not subscribed</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
    </fieldset>
  )
}
