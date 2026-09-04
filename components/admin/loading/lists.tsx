'use client'

import { ChevronDown, Eye, Pencil } from 'lucide-react'
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
  return (
    <>
      <LoadingTabs
        labels={[
          'Membership review',
          'Active members',
          'Exceptions',
          'Archive',
        ]}
      />
      <div className="mt-6 space-y-4">
        {[0, 1].map(row => (
          <article key={row} className={panelClass}>
            <div className="flex min-h-[5.25rem] flex-col items-stretch gap-3 bg-[#E9DDC3]/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 dark:bg-secondary">
              <div className="min-w-0">
                <LoadingValue className="h-6 w-40 max-w-full" />
                <LoadingValue className="mt-1 h-5 w-56 max-w-full" />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                <LoadingValue className="h-5 w-20 rounded-full" />
                <LoadingValue className="h-5 w-32 rounded-full" />
                <ChevronDown
                  className="ml-auto size-4 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
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
