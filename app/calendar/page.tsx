import { Suspense } from 'react'
import { CalendarSkeleton } from '@/components/calendar/calendar-skeleton'
import { CalendarDataBoundary } from '@/app/calendar/CalendarDataBoundary'

export default function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarDataBoundary searchParams={searchParams} />
    </Suspense>
  )
}
