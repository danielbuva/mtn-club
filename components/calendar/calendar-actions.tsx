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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/calendar/new?type=meetup">
        <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
          Post Meetup
        </Button>
      </Link>
      {isLeader && (
        <Link href="/calendar/new?type=official">
          <Button size="sm" className="rounded-xl">
            Add Official Trip
          </Button>
        </Link>
      )}
    </div>
  )
}
