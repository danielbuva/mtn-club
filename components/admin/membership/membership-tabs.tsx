'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type MembershipTab = 'review' | 'members' | 'exceptions' | 'archive'

type MembershipTabsProps = {
  defaultTab: MembershipTab
  reviewCount: number
  memberCount: number
  exceptionCount: number
  archiveCount: number
  review: ReactNode
  members: ReactNode
  exceptions: ReactNode
  archive: ReactNode
}

export function MembershipTabs({
  defaultTab,
  reviewCount,
  memberCount,
  exceptionCount,
  archiveCount,
  review,
  members,
  exceptions,
  archive,
}: MembershipTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab}
      className="mt-8 min-w-0 max-w-full gap-0 overflow-hidden"
    >
      <TabsList
        aria-label="Membership views"
        className="grid h-auto w-full min-w-0 grid-cols-2 gap-0 overflow-hidden border-b border-[#211D18]/15 bg-transparent p-0 sm:flex sm:justify-start sm:gap-1 sm:overflow-x-auto dark:border-border"
      >
        <MembershipTabTrigger
          value="review"
          label="Membership review"
          count={reviewCount}
        />
        <MembershipTabTrigger
          value="members"
          label="Active members"
          count={memberCount}
        />
        <MembershipTabTrigger
          value="exceptions"
          label="Exceptions"
          count={exceptionCount}
        />
        <MembershipTabTrigger
          value="archive"
          label="Archive"
          count={archiveCount}
        />
      </TabsList>
      <TabsContent
        value="review"
        className="mt-6 min-w-0 max-w-full overflow-hidden"
      >
        {review}
      </TabsContent>
      <TabsContent
        value="members"
        className="mt-6 min-w-0 max-w-full overflow-hidden"
      >
        {members}
      </TabsContent>
      <TabsContent
        value="exceptions"
        className="mt-6 min-w-0 max-w-full overflow-hidden"
      >
        {exceptions}
      </TabsContent>
      <TabsContent
        value="archive"
        className="mt-6 min-w-0 max-w-full overflow-hidden"
      >
        {archive}
      </TabsContent>
    </Tabs>
  )
}

function MembershipTabTrigger({
  value,
  label,
  count,
}: {
  value: MembershipTab
  label: string
  count: number
}) {
  return (
    <TabsTrigger
      value={value}
      className="min-h-12 min-w-0 flex-auto gap-1 whitespace-normal border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1.5 py-2 text-center leading-tight shadow-none sm:h-11 sm:min-h-0 sm:flex-none sm:gap-2 sm:whitespace-nowrap sm:px-4 sm:py-1 data-[state=active]:border-[#211D18] data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
    >
      {label}
      <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-center text-xs leading-4 tabular-nums sm:min-w-6 sm:px-2">
        {count}
      </span>
    </TabsTrigger>
  )
}
