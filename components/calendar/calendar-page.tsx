import { CalendarPageClient } from '@/components/calendar/calendar-page-client'
import type { CalendarYearData, ViewerKey } from '@/lib/events/calendar'

type CalendarPageProps = {
  yearData: CalendarYearData
  viewerKey: ViewerKey
  initialMonth: string
  isMember: boolean
  isLeader: boolean
}

export function CalendarPage({
  yearData,
  viewerKey,
  initialMonth,
  isMember,
  isLeader,
}: CalendarPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CalendarPageClient
        yearData={yearData}
        viewerKey={viewerKey}
        initialMonth={initialMonth}
        isMember={isMember}
        isLeader={isLeader}
      />
    </div>
  )
}
