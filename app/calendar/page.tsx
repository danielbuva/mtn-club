import { CalendarPageContent } from '@/app/calendar/CalendarPageContent'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return <CalendarPageContent searchParams={resolvedSearchParams} />
}
