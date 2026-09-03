import { BadgeCheck, Users } from 'lucide-react'
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
    <section className="overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card">
      {memberships.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E9DDC3]/70 text-xs uppercase tracking-wide dark:bg-secondary">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Member since</th>
                <th className="px-5 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211D18]/10 dark:divide-border">
              {memberships.map(member => (
                <tr key={member.user_id}>
                  <td className="px-5 py-4 font-medium">
                    {profileNames.get(member.user_id) ?? 'Member'}
                  </td>
                  <td className="px-5 py-4 capitalize">{member.role}</td>
                  <td className="px-5 py-4">
                    {member.member_since ?? member.joined_on}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="font-semibold underline"
                      href={`/admin/accounts/${member.user_id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <section className="grid gap-4">
      {reviews.map(review => (
        <article
          key={review.id}
          className="border border-amber-600/25 bg-amber-50/70 p-5 text-sm dark:bg-amber-950/20"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">
              {profileNames.get(review.user_id) ?? 'Member'}
            </h2>
            <Badge variant="outline">
              {review.status.replaceAll('_', ' ')}
            </Badge>
          </div>
          <p className="mt-3 font-medium capitalize">
            {review.reason_code.replaceAll('_', ' ')}
          </p>
          <p className="mt-1 text-muted-foreground">{review.reason_detail}</p>
        </article>
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
