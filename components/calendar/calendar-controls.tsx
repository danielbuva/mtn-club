'use client'

import { CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarViewOption = 'calendar' | 'list'

interface CalendarControlsProps {
  view: CalendarViewOption
  onViewChange: (value: CalendarViewOption) => void
  onToday: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
  className?: string
}

export function CalendarControls({
  view,
  onViewChange,
  onToday,
  onPrevMonth,
  onNextMonth,
  className,
}: CalendarControlsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={view} onValueChange={(value) => onViewChange(value as CalendarViewOption)}>
        <TabsList className="w-full rounded-full">
          <TabsTrigger value="calendar" className="rounded-full gap-2 flex-1">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-full gap-2 flex-1">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'calendar' && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={onToday}
            >
              Today
            </Button>
            <div className="flex items-center rounded-full border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={onPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={onNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
