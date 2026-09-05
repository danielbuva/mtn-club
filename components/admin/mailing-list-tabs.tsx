'use client'

import { MailCheck, MailX } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Database } from '@/lib/supabase/types'

type Subscription =
  Database['public']['Tables']['mailing_list_subscriptions']['Row']

type MailingListTabsProps = {
  subscriptions: Subscription[]
  profileNames: Record<string, string>
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Los_Angeles',
      }).format(new Date(value))
    : 'Not available'

export function MailingListTabs({
  subscriptions,
  profileNames,
}: MailingListTabsProps) {
  const subscribed = subscriptions.filter(item => item.subscribed)
  const unsubscribed = subscriptions.filter(item => !item.subscribed)

  return (
    <Tabs defaultValue="subscribed" className="mt-8 gap-0">
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <Link
          className="underline"
          href="/admin/mailing-list/export?topic=announcements"
        >
          Export announcements opt-ins
        </Link>
        <Link
          className="underline"
          href="/admin/mailing-list/export?topic=general"
        >
          Export general updates opt-ins
        </Link>
        <Link
          className="underline"
          href="/admin/mailing-list/export?topic=memberStories"
        >
          Export member stories opt-ins
        </Link>
      </div>
      <TabsList
        aria-label="Mailing-list status"
        className="h-auto w-full justify-start gap-1 border-b border-[#211D18]/15 bg-transparent p-0 dark:border-border"
      >
        <MailingTabTrigger
          value="subscribed"
          label="Subscribed"
          count={subscribed.length}
        />
        <MailingTabTrigger
          value="unsubscribed"
          label="Unsubscribed"
          count={unsubscribed.length}
        />
      </TabsList>
      <TabsContent value="subscribed" className="mt-6">
        <SubscriptionTable
          subscriptions={subscribed}
          profileNames={profileNames}
          subscribed
        />
      </TabsContent>
      <TabsContent value="unsubscribed" className="mt-6">
        <SubscriptionTable
          subscriptions={unsubscribed}
          profileNames={profileNames}
          subscribed={false}
        />
      </TabsContent>
    </Tabs>
  )
}

function MailingTabTrigger({
  value,
  label,
  count,
}: {
  value: 'subscribed' | 'unsubscribed'
  label: string
  count: number
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-11 flex-none gap-2 border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:border-[#211D18] data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
    >
      {label}
      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-center text-xs leading-4 tabular-nums">
        {count}
      </span>
    </TabsTrigger>
  )
}

function SubscriptionTable({
  subscriptions,
  profileNames,
  subscribed,
}: {
  subscriptions: Subscription[]
  profileNames: Record<string, string>
  subscribed: boolean
}) {
  return (
    <section className="overflow-hidden border border-[#211D18]/15 bg-white/45 dark:border-border dark:bg-card">
      {subscriptions.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E9DDC3]/70 text-xs uppercase tracking-wide dark:bg-secondary">
              <tr>
                <th className="px-5 py-3">Subscriber</th>
                <th className="px-5 py-3">Consent source</th>
                <th className="px-5 py-3">
                  {subscribed ? 'Subscribed' : 'Unsubscribed'}
                </th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211D18]/10 dark:divide-border">
              {subscriptions.map(subscription => (
                <tr key={subscription.user_id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {profileNames[subscription.user_id] ?? 'Member'}
                    </p>
                    <a
                      href={`mailto:${subscription.email}`}
                      className="text-xs text-muted-foreground underline"
                    >
                      {subscription.email}
                    </a>
                  </td>
                  <td className="px-5 py-4 capitalize">
                    {subscription.consent_source.replaceAll('_', ' ')}
                  </td>
                  <td className="px-5 py-4">
                    {formatDate(
                      subscribed
                        ? subscription.subscribed_at
                        : subscription.unsubscribed_at,
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={subscribed ? 'secondary' : 'outline'}>
                      {subscribed ? 'Opted in' : 'Opted out'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-sm text-muted-foreground">
          {subscribed ? (
            <MailCheck className="mx-auto mb-3 size-7" />
          ) : (
            <MailX className="mx-auto mb-3 size-7" />
          )}
          No {subscribed ? 'subscribers' : 'unsubscribes'} yet.
        </div>
      )}
    </section>
  )
}
