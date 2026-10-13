export function formatScheduleDate(start: string, end?: string): string {
  const startDate = new Date(`${start}T12:00:00Z`)
  const endDate = new Date(`${end ?? start}T12:00:00Z`)
  const sameYear = start.slice(0, 4) === (end ?? start).slice(0, 4)
  const sameMonth = start.slice(0, 7) === (end ?? start).slice(0, 7)
  const label = (date: Date, year: boolean) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: year ? 'numeric' : undefined,
    }).format(date)

  if (!end || start === end) return label(startDate, true)
  const endLabel = sameMonth
    ? `${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`
    : label(endDate, true)
  return `${label(startDate, !sameYear)}–${endLabel}`
}
