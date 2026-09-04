import { BadgeCheck, ChevronDown, Users } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase/types'

type Membership = Pick<
  Database['public']['Tables']['memberships']['Row'],
  'user_id' | 'role' | 'member_since' | 'joined_on'
>

type ReviewItem = Pick<
  Database['public']['Tables']['membership_review_items']['Row'],
  'id' | 'user_id' | 'reason_code' | 'reason_detail' | 'status'
>

export function ActiveMembersPanel({
  memberships,
  profileNames,
}: {
  memberships: Membership[]
  profileNames: ReadonlyMap<string, string>
}) {
  return (
    <section>
      {memberships.length ? (
        <div className="grid min-w-0 gap-3 overflow-hidden">
          {memberships.map(member => (
            <details
              key={member.user_id}
              className="group min-w-0 overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card"
            >
              <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 bg-[#E9DDC3]/70 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 dark:bg-secondary [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words font-semibold">
                  {profileNames.get(member.user_id) ?? 'Member'}
                </span>
                <span className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd>{member.member_since ?? member.joined_on}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Account</dt>
                  <dd>
                    <Link
                      className="font-semibold underline"
                      href={`/admin/accounts/${member.user_id}`}
                    >
                      Open
                    </Link>
                  </dd>
                </div>
              </dl>
            </details>
          ))}
        </div>
      ) : (
        <PanelEmptyState icon={Users} text="No active members yet." />
      )}
    </section>
  )
}

export function MembershipExceptionsPanel({
  reviews,
  profileNames,
}: {
  reviews: ReviewItem[]
  profileNames: ReadonlyMap<string, string>
}) {
  if (!reviews.length) {
    return (
      <PanelEmptyState
        icon={BadgeCheck}
        text="No membership exceptions need review."
      />
    )
  }

  return (
    <section className="grid min-w-0 gap-4 overflow-hidden">
      {reviews.map(review => (
        <details
          key={review.id}
          className="group min-w-0 overflow-hidden border border-amber-600/25 bg-amber-50/70 text-sm dark:bg-amber-950/20"
        >
          <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 [&::-webkit-details-marker]:hidden">
            <h2 className="min-w-0 break-words font-semibold">
              {profileNames.get(review.user_id) ?? 'Member'}
            </h2>
            <span className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Badge variant="outline">
                {review.status.replaceAll('_', ' ')}
              </Badge>
              <ChevronDown
                className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </summary>
          <div className="break-words border-t border-amber-600/20 p-4 sm:p-5">
            <p className="mt-3 font-medium capitalize">
              {review.reason_code.replaceAll('_', ' ')}
            </p>
            <p className="mt-1 text-muted-foreground">{review.reason_detail}</p>
          </div>
        </details>
      ))}
    </section>
  )
}

function PanelEmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof Users
  text: string
}) {
  return (
    <div className="border border-dashed border-[#211D18]/20 p-12 text-center text-sm text-[#6A5146] dark:border-border dark:text-muted-foreground">
      <Icon className="mx-auto mb-3 size-6" aria-hidden="true" />
      {text}
    </div>
  )
}
