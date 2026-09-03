import { Search, ShieldAlert, UserRound } from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { retryAccountDeletionAction } from './actions'

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    status?: string
    role?: string
    restriction?: string
    mailing?: string
    page?: string
    filter?: string
  }>
}) {
  const context = await requireAdminCapability('accounts.read')
  const filters = await searchParams
  const admin = createAdminClient()
  const parsedPage = Number.parseInt(filters.page ?? '1', 10)
  const requestedPage = Number.isFinite(parsedPage)
    ? Math.max(parsedPage, 1)
    : 1
  const [accountsResult, roles] = await Promise.all([
    admin.rpc('admin_list_accounts', {
      p_actor_user_id: context.userId,
      p_search: filters.q?.trim() || null,
      p_membership_state:
        filters.status && filters.status !== 'all' ? filters.status : null,
      p_role_name: filters.role && filters.role !== 'all' ? filters.role : null,
      p_restriction:
        filters.restriction && filters.restriction !== 'all'
          ? filters.restriction
          : null,
      p_mailing:
        filters.mailing && filters.mailing !== 'all' ? filters.mailing : null,
      p_needs_attention: filters.filter === 'attention',
      p_page: requestedPage,
      p_page_size: 25,
    }),
    admin.from('admin_roles').select('id, name'),
  ])
  const queryError = accountsResult.error ?? roles.error
  if (queryError) throw queryError
  const pageSize = 25
  const accounts = accountsResult.data ?? []
  const totalAccounts = accounts[0]?.total_count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalAccounts / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (key !== 'page' && value) params.set(key, value)
    }
    params.set('page', String(nextPage))
    return `/admin/accounts?${params.toString()}`
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <AdminPageHeader
        title="Accounts"
        description="Search members, inspect access, and manage account lifecycle safely."
      />
      <form className="mt-8 grid gap-3 border border-[#211D18]/15 bg-white/45 p-4 dark:border-border dark:bg-card sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto_auto_auto]">
        <label htmlFor="account-search" className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            id="account-search"
            name="q"
            defaultValue={filters.q}
            className="pl-9"
            placeholder="Search name or email"
          />
        </label>
        <select
          name="status"
          defaultValue={filters.status ?? 'all'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="all">All membership states</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select
          name="role"
          defaultValue={filters.role ?? 'all'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="all">All leadership roles</option>
          {(roles.data ?? []).map(role => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          name="restriction"
          defaultValue={filters.restriction ?? 'all'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="all">All restrictions</option>
          <option value="normal">Unrestricted</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select
          name="mailing"
          defaultValue={filters.mailing ?? 'all'}
          className="h-10 border border-input bg-background px-3 text-sm"
        >
          <option value="all">Any mailing status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Not subscribed</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      <p className="mt-4 text-sm text-[#6A5146] dark:text-muted-foreground">
        {totalAccounts} account
        {totalAccounts === 1 ? '' : 's'}
      </p>
      <section className="mt-4 overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card">
        {accounts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#E9DDC3]/70 text-xs uppercase tracking-wide dark:bg-secondary">
                <tr>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Membership</th>
                  <th className="px-5 py-3">Leadership</th>
                  <th className="px-5 py-3">Mailing list</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#211D18]/10 dark:divide-border">
                {accounts.map(user => {
                  const deletionJob = user.deletion_status
                  return (
                    <tr key={user.user_id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {user.display_name ?? 'Account'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email ?? 'Deleted identity'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {user.membership_state}
                          </Badge>
                          {user.restriction !== 'normal' ? (
                            <Badge variant="destructive">
                              <ShieldAlert className="size-3" />
                              {user.restriction}
                            </Badge>
                          ) : null}
                          {deletionJob ? (
                            <Badge variant="destructive">
                              deletion {user.deletion_status}
                            </Badge>
                          ) : null}
                          {deletionJob &&
                          context.isSuperAdmin &&
                          context.permissions['accounts.update'] ? (
                            <form action={retryAccountDeletionAction}>
                              <input
                                type="hidden"
                                name="userId"
                                value={user.user_id}
                              />
                              <Button type="submit" size="sm" variant="outline">
                                Retry cleanup
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {user.leadership_roles.length
                          ? user.leadership_roles.join(', ')
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {user.mailing_subscribed
                          ? 'Subscribed'
                          : 'Not subscribed'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/accounts/${user.user_id}`}>
                            <UserRound className="size-4" /> Open
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No accounts match these filters.
          </div>
        )}
      </section>
      {totalPages > 1 ? (
        <nav
          aria-label="Account pages"
          className="mt-5 flex items-center justify-between"
        >
          {page === 1 ? (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>Previous</Link>
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          {page === totalPages ? (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>Next</Link>
            </Button>
          )}
        </nav>
      ) : null}
    </div>
  )
}
