'use client'

import { CalendarDays, List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type CalendarViewOption = 'calendar' | 'list'

interface CalendarControlsProps {
  view: CalendarViewOption
  onViewChange: (value: CalendarViewOption) => void
  className?: string
}

export function CalendarControls({
  view,
  onViewChange,
  className,
}: CalendarControlsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <Tabs
        value={view}
        onValueChange={value => onViewChange(value as CalendarViewOption)}
      >
        <TabsList className="w-full rounded-none border border-border bg-card p-0">
          <TabsTrigger value="calendar" className="rounded-none gap-2 flex-1">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-none gap-2 flex-1">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
