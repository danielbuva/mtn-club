import { ShieldAlert, UserRound } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { AccountFilters } from '@/components/admin/accounts-filters'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { retryAccountDeletionAction } from './actions'

async function AdminAccountsPageContent({
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
    <>
      <AccountFilters filters={filters} roles={roles.data ?? []} />
      <p className="mt-4 text-sm text-[#6A5146] dark:text-muted-foreground">
        {totalAccounts} account
        {totalAccounts === 1 ? '' : 's'}
      </p>
      <section className="mt-4 min-w-0 max-w-full overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card">
        {accounts.length ? (
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
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
                          {deletionJob
                            ? 'Deleted identity'
                            : (user.email ?? 'No email')}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!deletionJob && (
                            <Badge variant="secondary">
                              {user.membership_state}
                            </Badge>
                          )}
                          {!deletionJob && user.restriction !== 'normal' ? (
                            <Badge variant="destructive">
                              <ShieldAlert className="size-3" />
                              {user.restriction}
                            </Badge>
                          ) : null}
                          {deletionJob ? (
                            <Badge
                              variant={
                                deletionJob === 'completed'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {deletionJob === 'completed'
                                ? 'Deleted'
                                : 'Cleanup required'}
                            </Badge>
                          ) : null}
                          {deletionJob &&
                          deletionJob !== 'completed' &&
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
    </>
  )
}

export default function AdminAccountsPage(
  props: Parameters<typeof AdminAccountsPageContent>[0],
) {
  return (
    <AdminViewFrame view="accounts">
      <Suspense fallback={<AdminPanelFallback view="accounts" />}>
        <AdminAccountsPageContent {...props} />
      </Suspense>
    </AdminViewFrame>
  )
}
