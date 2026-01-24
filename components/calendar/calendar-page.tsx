import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CalendarPageClient } from '@/components/calendar/calendar-page-client'
import { CalendarAuthSync } from '@/components/calendar/calendar-auth-sync'
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
      <Header />
      <CalendarAuthSync />
      <CalendarPageClient
        yearData={yearData}
        viewerKey={viewerKey}
        initialMonth={initialMonth}
        isMember={isMember}
        isLeader={isLeader}
      />
      <Footer />
    </div>
  )
}
