'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type MembershipTab = 'review' | 'members' | 'exceptions'

type MembershipTabsProps = {
  defaultTab: MembershipTab
  reviewCount: number
  memberCount: number
  exceptionCount: number
  review: ReactNode
  members: ReactNode
  exceptions: ReactNode
}

export function MembershipTabs({
  defaultTab,
  reviewCount,
  memberCount,
  exceptionCount,
  review,
  members,
  exceptions,
}: MembershipTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="mt-8 gap-0">
      <TabsList
        aria-label="Membership views"
        className="h-auto w-full justify-start gap-1 overflow-x-auto border-b border-[#211D18]/15 bg-transparent p-0 dark:border-border"
      >
        <MembershipTabTrigger
          value="review"
          label="Applications"
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
      </TabsList>
      <TabsContent value="review" className="mt-6">
        {review}
      </TabsContent>
      <TabsContent value="members" className="mt-6">
        {members}
      </TabsContent>
      <TabsContent value="exceptions" className="mt-6">
        {exceptions}
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
      className="h-11 flex-none gap-2 border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:border-[#211D18] data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
    >
      {label}
      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">
        {count}
      </span>
    </TabsTrigger>
  )
}
