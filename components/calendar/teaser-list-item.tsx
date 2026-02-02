'use client'

import { format } from 'date-fns'
import { Lock } from 'lucide-react'
import { MemberCTA } from '@/components/member-cta'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TripTeaserDay } from '@/lib/events/types'

interface TeaserListItemProps {
  teaser: TripTeaserDay
  onClick: () => void
}

export function TeaserListItem({ teaser, onClick }: TeaserListItemProps) {
  const date = new Date(teaser.day)

  return (
    <Card className="border-primary/10 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Members-only adventures</p>
            <p className="text-xs text-muted-foreground">
              {format(date, 'EEE, MMM d')} - {teaser.event_count} upcoming trip
              {teaser.event_count === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={onClick}
          >
            View details
          </Button>
          <MemberCTA size="sm" className="rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
