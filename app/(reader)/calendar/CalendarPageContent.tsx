import { format } from 'date-fns'
import { connection } from 'next/server'
import { CalendarPage } from '@/components/calendar/calendar-page'
import { clampCalendarMonthDate } from '@/components/calendar/calendar-utils'
import { getViewer } from '@/lib/auth/viewer'
import { getCalendarYearData, type ViewerKey } from '@/lib/events/calendar'

const resolveMonthDate = (monthValue?: string): Date => {
  const match = monthValue ? /^(\d{4})-(\d{2})$/.exec(monthValue) : null
  if (!match) {
    return new Date()
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) {
    return new Date()
  }

  return new Date(year, monthIndex, 1)
}

type CalendarPageContentProps = {
  searchParams?: { month?: string }
}

export async function CalendarPageContent({
  searchParams,
}: CalendarPageContentProps) {
  await connection()
  const monthDate = clampCalendarMonthDate(
    resolveMonthDate(searchParams?.month),
  )
  const currentMonth = format(monthDate, 'yyyy-MM')
  const year = monthDate.getFullYear()
  const viewer = await getViewer()
  const viewerKey: ViewerKey = viewer.isMember ? 'member' : 'public'
  const yearData = await getCalendarYearData({ year, viewerKey })

  return (
    <CalendarPage
      yearData={yearData}
      viewerKey={viewerKey}
      initialMonth={currentMonth}
    />
  )
}
