import { format } from 'date-fns'
import { CalendarPage } from '@/components/calendar/calendar-page'
import { getPrimaryClubId } from '@/lib/clubs/server'
import { getCalendarData } from '@/lib/events/server'
import { getMembershipState } from '@/lib/memberships/server'

type CalendarDataBoundaryProps = {
  searchParams: Promise<{ month?: string }>
}

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

export async function CalendarDataBoundary({ searchParams }: CalendarDataBoundaryProps) {
  const resolvedSearchParams = await searchParams
  const monthDate = resolveMonthDate(resolvedSearchParams?.month)
  const membershipState = await getMembershipState()
  const clubId = membershipState.clubId ?? await getPrimaryClubId()
  const isMemberOrLeader = !!membershipState.membershipId || membershipState.isLeader

  const { trips, teasers } = await getCalendarData({
    currentDate: monthDate,
    clubId,
    isMemberOrLeader,
  })

  return (
    <CalendarPage
      trips={trips}
      teasers={teasers}
      membershipState={membershipState}
      currentMonth={format(monthDate, 'yyyy-MM')}
    />
  )
}
