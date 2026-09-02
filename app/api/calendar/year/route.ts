import { NextResponse } from 'next/server'
import {
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_YEAR,
} from '@/components/calendar/calendar-utils'
import { getViewer } from '@/lib/auth/viewer'
import { getCalendarYearData, type ViewerKey } from '@/lib/events/calendar'

const isValidYear = (value: number) =>
  Number.isInteger(value) &&
  value >= CALENDAR_MIN_YEAR &&
  value <= CALENDAR_MAX_YEAR

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? Number(yearParam) : Number.NaN

  if (!isValidYear(year)) {
    return NextResponse.json({ error: 'Invalid year.' }, { status: 400 })
  }

  const viewer = await getViewer()
  const viewerKey: ViewerKey = viewer.isMember ? 'member' : 'public'
  const data = await getCalendarYearData({ year, viewerKey })

  return NextResponse.json({ data })
}
