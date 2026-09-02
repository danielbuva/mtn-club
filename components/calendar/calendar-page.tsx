import { CalendarPageClient } from '@/components/calendar/calendar-page-client'
import type { CalendarYearData, ViewerKey } from '@/lib/events/calendar'

type CalendarPageProps = {
  yearData: CalendarYearData
  viewerKey: ViewerKey
  initialMonth: string
}

export function CalendarPage({
  yearData,
  viewerKey,
  initialMonth,
}: CalendarPageProps) {
  return (
    <div
      data-calendar-page
      className="min-h-screen flex flex-col bg-background text-foreground"
    >
      <CalendarPageClient
        yearData={yearData}
        viewerKey={viewerKey}
        initialMonth={initialMonth}
      />
    </div>
  )
}
