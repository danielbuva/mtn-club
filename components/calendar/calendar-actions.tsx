'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type CalendarActionsProps = {
  isMember: boolean
  isLeader: boolean
}

export function CalendarActions({ isMember, isLeader }: CalendarActionsProps) {
  if (!isMember) {
    return null
  }

  const href = isLeader
    ? '/calendar/new?type=official'
    : '/calendar/new?type=meetup'

  return (
    <Link href={href} className="fixed bottom-6 right-6 z-40">
      <Button size="sm" className="rounded-full px-4 shadow-lg">
        + Create Event
      </Button>
    </Link>
  )
}
