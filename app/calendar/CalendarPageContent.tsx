import { format } from 'date-fns'
import { CalendarPage } from '@/components/calendar/calendar-page'
import { getPrimaryClubIdCached } from '@/lib/clubs/cached'
import { getCalendarTripsCached } from '@/lib/events/cached'

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

export async function CalendarPageContent({ searchParams }: CalendarPageContentProps) {
  const monthDate = resolveMonthDate(searchParams?.month)
  const currentMonth = format(monthDate, 'yyyy-MM')
  const clubId = await getPrimaryClubIdCached()
  const { trips, teasers } = await getCalendarTripsCached({ month: currentMonth, clubId })

  return (
    <CalendarPage
      trips={trips}
      teasers={teasers}
      currentMonth={currentMonth}
    />
  )
}
