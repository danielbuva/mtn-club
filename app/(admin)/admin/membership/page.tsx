import Link from 'next/link'
import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { MembershipReviewPanel } from '@/components/admin/membership/membership-review-panel'
import {
  ActiveMembersPanel,
  MembershipExceptionsPanel,
} from '@/components/admin/membership/membership-secondary-panels'
import { MembershipTabs } from '@/components/admin/membership/membership-tabs'
import { requireAdminCapability } from '@/lib/admin/auth'
import { getMembershipQueue } from '@/lib/admin/membership-queue'

async function AdminMembershipPageContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const context = await requireAdminCapability('membership.read')
  const requested = await searchParams
  const queue = await getMembershipQueue(requested.tab, requested.page)
  const pages = Math.max(1, Math.ceil(queue.counts[queue.tab] / queue.pageSize))
  const profileNames =
    queue.tab === 'members' || queue.tab === 'exceptions'
      ? new Map(queue.rows.map(row => [row.user_id, row.display_name]))
      : new Map<string, string | null>()
  const pageHref = (page: number) =>
    `/admin/membership?tab=${queue.tab}&page=${page}`
  const permissions = context.permissions

  return (
    <>
      {permissions['membership.confirm_guardian'] ? (
        <Link
          className="mb-4 inline-block underline"
          href="/admin/membership/trip-guardian-reviews"
        >
          Review guardian consent
        </Link>
      ) : null}
      <MembershipTabs tab={queue.tab} counts={queue.counts} />
      <div className="mt-6 min-w-0 max-w-full">
        {queue.tab === 'members' ? (
          <ActiveMembersPanel
            memberships={queue.rows}
            profileNames={profileNames}
          />
        ) : queue.tab === 'exceptions' ? (
          <MembershipExceptionsPanel
            reviews={queue.rows}
            profileNames={profileNames}
          />
        ) : (
          <MembershipReviewPanel
            applications={queue.rows}
            canConfirmGuardian={Boolean(
              permissions['membership.confirm_guardian'],
            )}
            canReviewPayment={Boolean(
              permissions['membership.confirm_payment'],
            )}
            canGrantComplimentary={Boolean(permissions['membership.update'])}
            isSuperAdmin={context.isSuperAdmin}
            emptyMessage={
              queue.tab === 'archive'
                ? 'No completed or rejected applications are archived.'
                : undefined
            }
          />
        )}
      </div>
      {pages > 1 ? (
        <nav
          aria-label="Membership pagination"
          className="mt-6 flex flex-wrap items-center gap-4 text-sm"
        >
          {queue.page > 1 ? (
            <Link className="underline" href={pageHref(queue.page - 1)}>
              Previous
            </Link>
          ) : null}
          <span>
            Page {queue.page} of {pages}
          </span>
          {queue.page < pages ? (
            <Link className="underline" href={pageHref(queue.page + 1)}>
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}

export default function AdminMembershipPage(
  props: Parameters<typeof AdminMembershipPageContent>[0],
) {
  return (
    <AdminViewFrame view="membership">
      <Suspense fallback={<AdminPanelFallback view="membership" />}>
        <AdminMembershipPageContent {...props} />
      </Suspense>
    </AdminViewFrame>
  )
}
