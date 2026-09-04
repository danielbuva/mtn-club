'use client'

import { Eye, Pencil } from 'lucide-react'
import { useAdminViewer } from '@/components/admin/admin-view-frame'
import { Button } from '@/components/ui/button'
import { AccountFilters } from '../accounts-filters'
import {
  LoadingTable,
  LoadingTabs,
  LoadingValue,
  panelClass,
} from './primitives'

export function TripsLoading() {
  const viewer = useAdminViewer()
  return (
    <section className="mt-6 grid gap-3">
      {[0, 1, 2].map(row => (
        <article
          key={row}
          className={`${panelClass} grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center`}
        >
          <div>
            <LoadingValue className="h-7 w-64 max-w-full" />
            <div className="mt-2 flex gap-2">
              {[0, 1, 2].map(tag => (
                <LoadingValue key={tag} className="h-5 w-16 rounded-full" />
              ))}
            </div>
            <LoadingValue className="mt-3 h-5 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>
              <Eye className="size-4" /> View
            </Button>
            {viewer?.permissions['trips.update'] === 'all' ? (
              <Button size="sm" variant="outline" disabled>
                <Pencil className="size-4" /> Edit
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}

export function MembershipLoading() {
  const viewer = useAdminViewer()
  return (
    <>
      <LoadingTabs labels={['Applications', 'Active members', 'Exceptions']} />
      <div className="mt-6 space-y-4">
        {[0, 1].map(row => (
          <article key={row} className={`${panelClass} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <LoadingValue className="h-7 w-40" />
                <LoadingValue className="h-5 w-56" />
                <LoadingValue className="mt-2 h-4 w-44" />
              </div>
              <div className="flex flex-wrap gap-2">
                <LoadingValue className="h-5 w-20 rounded-full" />
                <LoadingValue className="h-5 w-32 rounded-full" />
              </div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
              {['Age', 'Guardian', 'Interests'].map(label => (
                <div key={label}>
                  <dt className="text-[#6A5146] dark:text-muted-foreground">
                    {label}
                  </dt>
                  <dd>
                    <LoadingValue className="h-5" />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid gap-2 border-l-2 border-[#211D18]/20 pl-3 text-xs text-[#6A5146] dark:border-border dark:text-muted-foreground">
              <LoadingValue className="w-64 max-w-full" />
              <p>
                Payment decisions are shown to the applicant on their membership
                page.
              </p>
            </div>
            {viewer?.permissions['membership.confirm_payment'] ? (
              <div className="mt-5 grid gap-3 border-t border-[#211D18]/10 pt-5 dark:border-border sm:grid-cols-[minmax(11rem,auto)_minmax(12rem,1fr)_auto]">
                <div className="text-sm">
                  Payment status
                  <LoadingValue className="mt-2 h-10 w-full" />
                </div>
                <div className="text-sm">
                  Internal note
                  <LoadingValue className="mt-2 h-10 w-full" />
                </div>
                <LoadingValue className="h-9 w-24 self-end" />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  )
}

export function AccountsLoading() {
  return (
    <>
      <AccountFilters disabled />
      <div className="mt-4 flex items-center gap-2 text-sm">
        <LoadingValue className="w-6" /> accounts
      </div>
      <LoadingTable
        className="mt-4"
        columns={[
          'Account',
          'Membership',
          'Leadership',
          'Mailing list',
          'Actions',
        ]}
      />
    </>
  )
}

export function MailingLoading() {
  return (
    <>
      <LoadingTabs labels={['Subscribed', 'Unsubscribed']} />
      <LoadingTable
        className="mt-6"
        columns={['Subscriber', 'Consent source', 'Subscribed', 'Status']}
      />
    </>
  )
}
