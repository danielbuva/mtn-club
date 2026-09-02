import { CalendarPageContent } from './CalendarPageContent'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return <CalendarPageContent searchParams={resolvedSearchParams} />
}
